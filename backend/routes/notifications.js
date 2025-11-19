import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';

const router = express.Router();

// Helper function to create notification in notifications table
export async function createNotification({
  recipient_id,
  patient_id = null,
  title,
  message,
  type = 'system',
  payload = null
}) {
  try {
    const notification_id = uuidv4();
    
    // Determine notification type from payload if available
    let notificationType = type;
    if (payload) {
      try {
        const payloadObj = typeof payload === 'string' ? JSON.parse(payload) : payload;
        if (payloadObj && payloadObj.type) {
          // Map to valid ENUM values: 'system','reminder','alert','appointment','lab','custom'
          if (payloadObj.type.includes('appointment')) {
            notificationType = 'appointment'; // Use 'appointment' for appointment notifications
          } else if (payloadObj.type.includes('lab')) {
            notificationType = 'lab';
          } else if (payloadObj.type.includes('alert') || payloadObj.type.includes('critical')) {
            notificationType = 'alert'; // Use 'alert' for critical alerts
          } else if (payloadObj.type.includes('reminder')) {
            notificationType = 'reminder';
          } else {
            notificationType = 'system'; // Default to 'system'
          }
        }
        // Extract patient_id from payload if available
        if (payloadObj && payloadObj.patient_id && !patient_id) {
          patient_id = payloadObj.patient_id;
        }
      } catch (parseError) {
        // If payload parsing fails, use the default type
        console.warn('Failed to parse payload for notification type detection:', parseError);
      }
    }
    
    console.log('Creating notification:', {
      notification_id,
      recipient_id,
      title,
      message: message.substring(0, 50) + '...',
      type: notificationType
    });

    const [result] = await db.query(`
      INSERT INTO notifications (
        notification_id, recipient_id, title, message, type
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      notification_id,
      recipient_id,
      title,
      message,
      notificationType
    ]);

    console.log('Notification created successfully:', {
      notification_id,
      affectedRows: result.affectedRows,
      insertId: result.insertId
    });

    return { success: true, notification_id };
  } catch (error) {
    console.error('Error creating notification:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sql: error.sql
    });
    return { success: false, error: error.message };
  }
}

// Helper function to create in-app message
export async function createInAppMessage({
  sender_id,
  recipient_id,
  recipient_type = 'user',
  subject,
  body,
  payload = null,
  priority = 'normal',
  createNotificationEntry = false // Don't create duplicate notification by default
}) {
  try {
    const message_id = uuidv4();
    
    await db.query(`
      INSERT INTO in_app_messages (
        message_id, sender_id, recipient_id, recipient_type,
        subject, body, payload, priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      message_id,
      sender_id,
      recipient_id,
      recipient_type,
      subject,
      body,
      payload ? JSON.stringify(payload) : null,
      priority
    ]);

    // Only create entry in notifications table if explicitly requested
    // This prevents duplicates - we use in_app_messages as the primary source
    if (createNotificationEntry && recipient_type === 'user') {
      const notificationResult = await createNotification({
        recipient_id,
        title: subject,
        message: body,
        type: 'system',
        payload
      });

      if (!notificationResult.success) {
        console.error('Failed to create notification entry for in-app message:', notificationResult.error);
        // Don't fail the in-app message creation if notification table insert fails
      }
    }

    return { success: true, message_id };
  } catch (error) {
    console.error('Error creating in-app message:', error);
    return { success: false, error: error.message };
  }
}

// Removed createPushNotification - using notifications table only

// Helper function to notify physician and case managers about appointment
export async function notifyAppointmentCreated(appointment) {
  try {
    const { appointment_id, patient_id, provider_id, facility_id, scheduled_start, appointment_type } = appointment;
    
    // Get patient name
    const [patients] = await db.query(
      'SELECT first_name, last_name FROM patients WHERE patient_id = ?',
      [patient_id]
    );
    const patientName = patients.length > 0 
      ? `${patients[0].first_name} ${patients[0].last_name}`
      : 'Patient';

    // Get facility name
    const [facilities] = await db.query(
      'SELECT facility_name FROM facilities WHERE facility_id = ?',
      [facility_id]
    );
    const facilityName = facilities.length > 0 ? facilities[0].facility_name : 'Facility';

    const appointmentDate = new Date(scheduled_start);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const subject = `New Appointment`;
    // Message without provider info
    const body = `A new ${appointment_type.replace('_', ' ')} appointment has been scheduled for ${patientName} at ${facilityName} on ${formattedDate}.`;
    
    const payload = {
      type: 'appointment_created',
      appointment_id,
      patient_id,
      provider_id,
      facility_id,
      scheduled_start,
      appointment_type,
      requires_confirmation: false // Patients should not see Accept/Decline buttons
    };

    const notifications = [];
    
    // NOTIFICATION 1: For NON-PHYSICIAN/NURSE STAFF (admin, case_manager, lab_personnel) - NOT patients, physicians, or nurses
    // Physicians and nurses will get Accept/Decline notifications separately (see below)
    // Get all active staff users EXCEPT physicians and nurses (they get special notifications with Accept/Decline)
    const [allStaff] = await db.query(`
      SELECT user_id, role FROM users 
      WHERE role IN ('admin', 'case_manager', 'lab_personnel')
        AND status = 'active'
    `);
    
    console.log('=== Creating notifications for non-physician/nurse staff ===');
    console.log('Staff count:', allStaff.length);
    
    for (const staff of allStaff) {
      // Create notification entry in notifications table
      // Include patient_id so patients can be excluded from seeing these notifications
      // For staff, set requires_confirmation to false (they don't need Accept/Decline)
      const staffPayload = { ...payload, requires_confirmation: false };
      const notificationResult = await createNotification({
        recipient_id: staff.user_id,
        patient_id: patient_id, // Include patient_id to exclude patient from seeing this
        title: subject,
        message: body,
        type: 'appointment', // Use 'appointment' type for appointment notifications
        payload: JSON.stringify(staffPayload)
      });
      
      if (notificationResult.success) {
        notifications.push({ 
          type: 'notification', 
          user_id: staff.user_id, 
          role: staff.role,
          notification_id: notificationResult.notification_id 
        });
        console.log(`✅ Notification created for ${staff.role} (${staff.user_id}): ${notificationResult.notification_id}`);
      } else {
        console.error(`❌ Failed to create notification for ${staff.role} (${staff.user_id}):`, notificationResult.error);
      }
    }

    // NOTIFICATION 2: For PATIENTS ONLY
    // Get patient's user_id if they have an account
    const [patientUsers] = await db.query(`
      SELECT u.user_id 
      FROM patients p
      LEFT JOIN users u ON p.created_by = u.user_id OR p.email = u.email
      WHERE p.patient_id = ?
      LIMIT 1
    `, [patient_id]);

    if (patientUsers.length > 0) {
      const patientUserId = patientUsers[0].user_id;
      // Simplified, direct notification title
      const patientSubject = `New Appointment`;
      const patientBody = `Your ${appointment_type.replace('_', ' ')} appointment request for ${formattedDate} at ${facilityName} has been submitted. Waiting for provider confirmation.`;
      
      // Only create in-app message for patients (remove duplicate notifications table entry)
      // Ensure payload doesn't have requires_confirmation for patients
      const patientPayload = { ...payload, requires_confirmation: false };
      const patientMessage = await createInAppMessage({
        sender_id: null, // System message
        recipient_id: patientUserId,
        recipient_type: 'user',
        subject: patientSubject,
        body: patientBody,
        payload: patientPayload,
        priority: 'normal'
      });
      if (patientMessage.success) {
        notifications.push(patientMessage);
        console.log(`✅ In-app message created for patient (${patientUserId})`);
      } else {
        console.error(`❌ Failed to create in-app message for patient (${patientUserId}):`, patientMessage.error);
      }
    }

    // Notify provider (physician) if assigned - Request confirmation
    if (provider_id) {
      console.log('=== Notifying Provider ===');
      console.log('Provider ID:', provider_id);
      
      // Get provider role to check if it's a physician or nurse
      const [providerInfo] = await db.query(`
        SELECT role FROM users WHERE user_id = ?
      `, [provider_id]);
      
      const providerRole = providerInfo.length > 0 ? providerInfo[0].role : null;
      
      // Only notify if provider is physician or nurse (they need Accept/Decline)
      if (providerRole === 'physician' || providerRole === 'nurse') {
        const providerSubject = `New Appointment`;
        // Message without provider info
        const providerBody = `A new ${appointment_type.replace('_', ' ')} appointment has been scheduled for ${patientName} at ${facilityName} on ${formattedDate}. Please accept or decline this appointment.`;
        
        // In-app message for provider
        const providerMessage = await createInAppMessage({
          sender_id: null, // System message
          recipient_id: provider_id,
          recipient_type: 'user',
          subject: providerSubject,
          body: providerBody,
          payload: { ...payload, requires_confirmation: true },
          priority: 'high'
        });
        
        if (providerMessage.success) {
          console.log('Provider notification created successfully:', provider_id);
          notifications.push(providerMessage);
        } else {
          console.error('Failed to create provider notification:', providerMessage.error);
        }
      }
    }

    // Notify all case managers in the facility
    const [caseManagers] = await db.query(`
      SELECT user_id FROM users 
      WHERE role = 'case_manager' 
      AND (facility_id = ? OR facility_id IS NULL)
      AND status = 'active'
    `, [facility_id]);

    console.log('=== Notifying Case Managers ===');
    console.log('Facility ID:', facility_id);
    console.log('Case managers found:', caseManagers.length);

    for (const caseManager of caseManagers) {
      const cmSubject = `New Appointment`;
      // Message without provider info
      const cmBody = `A new ${appointment_type.replace('_', ' ')} appointment has been scheduled for ${patientName} at ${facilityName} on ${formattedDate}. Please accept or decline this appointment.`;
      
      console.log('Creating notification for case manager:', caseManager.user_id);
      
      // In-app message for case manager
      const cmMessage = await createInAppMessage({
        sender_id: null,
        recipient_id: caseManager.user_id,
        recipient_type: 'user',
        subject: cmSubject,
        body: cmBody,
        payload: { ...payload, requires_confirmation: true },
        priority: 'normal'
      });
      
      if (cmMessage.success) {
        console.log('Case manager notification created successfully:', caseManager.user_id);
        notifications.push(cmMessage);
      } else {
        console.error('Failed to create case manager notification:', cmMessage.error);
      }
    }
    
    // Also notify all physicians and nurses in the facility if no provider is assigned
    if (!provider_id) {
      const [physiciansAndNurses] = await db.query(`
        SELECT user_id, role FROM users 
        WHERE role IN ('physician', 'nurse')
        AND (facility_id = ? OR facility_id IS NULL)
        AND status = 'active'
      `, [facility_id]);
      
      console.log('=== Notifying Physicians and Nurses (no provider assigned) ===');
      console.log('Physicians and nurses found:', physiciansAndNurses.length);
      
      for (const staff of physiciansAndNurses) {
        const staffSubject = `New Appointment`;
        // Message without provider info
        const staffBody = `A new ${appointment_type.replace('_', ' ')} appointment has been scheduled for ${patientName} at ${facilityName} on ${formattedDate}. Please accept or decline this appointment.`;
        
        console.log(`Creating notification for ${staff.role}:`, staff.user_id);
        
        // In-app message for physician/nurse
        const staffMessage = await createInAppMessage({
          sender_id: null,
          recipient_id: staff.user_id,
          recipient_type: 'user',
          subject: staffSubject,
          body: staffBody,
          payload: { ...payload, requires_confirmation: true },
          priority: 'high'
        });
        
        if (staffMessage.success) {
          console.log(`${staff.role} notification created successfully:`, staff.user_id);
          notifications.push(staffMessage);
        } else {
          console.error(`Failed to create ${staff.role} notification:`, staffMessage.error);
        }
      }
    }
    
    // Also notify all nurses in the facility (even if provider is assigned, nurses should also see it)
    // Exclude the provider if they are a nurse (already notified above)
    const nurseQuery = provider_id 
      ? `SELECT user_id FROM users 
         WHERE role = 'nurse'
         AND (facility_id = ? OR facility_id IS NULL)
         AND status = 'active'
         AND user_id != ?`
      : `SELECT user_id FROM users 
         WHERE role = 'nurse'
         AND (facility_id = ? OR facility_id IS NULL)
         AND status = 'active'`;
    
    const [nurses] = await db.query(nurseQuery, provider_id ? [facility_id, provider_id] : [facility_id]);
    
    console.log('=== Notifying Nurses ===');
    console.log('Nurses found:', nurses.length);
    
    for (const nurse of nurses) {
      // Skip if this nurse is already the provider (already notified above)
      if (nurse.user_id === provider_id) {
        continue;
      }
      
      const nurseSubject = `New Appointment`;
      const nurseBody = `A new ${appointment_type.replace('_', ' ')} appointment has been scheduled for ${patientName} at ${facilityName} on ${formattedDate}. Please accept or decline this appointment.`;
      
      console.log('Creating notification for nurse:', nurse.user_id);
      
      // In-app message for nurse
      const nurseMessage = await createInAppMessage({
        sender_id: null,
        recipient_id: nurse.user_id,
        recipient_type: 'user',
        subject: nurseSubject,
        body: nurseBody,
        payload: { ...payload, requires_confirmation: true },
        priority: 'high'
      });
      
      if (nurseMessage.success) {
        console.log('Nurse notification created successfully:', nurse.user_id);
        notifications.push(nurseMessage);
      } else {
        console.error('Failed to create nurse notification:', nurseMessage.error);
      }
    }

    return { success: true, notifications };
  } catch (error) {
    console.error('Error notifying appointment creation:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to notify patient that provider accepted
export async function notifyAppointmentProviderAccepted(appointment) {
  try {
    const { appointment_id, patient_id, provider_id, facility_id, scheduled_start, appointment_type } = appointment;
    
    // Get patient name
    const [patients] = await db.query(
      'SELECT first_name, last_name FROM patients WHERE patient_id = ?',
      [patient_id]
    );
    const patientName = patients.length > 0 
      ? `${patients[0].first_name} ${patients[0].last_name}`
      : 'Patient';

    // Get facility name
    const [facilities] = await db.query(
      'SELECT facility_name FROM facilities WHERE facility_id = ?',
      [facility_id]
    );
    const facilityName = facilities.length > 0 ? facilities[0].facility_name : 'Facility';

    // Get provider name
    let providerName = 'Provider';
    if (provider_id) {
      const [providers] = await db.query(
        'SELECT full_name FROM users WHERE user_id = ?',
        [provider_id]
      );
      if (providers.length > 0) {
        providerName = providers[0].full_name;
      }
    }

    const appointmentDate = new Date(scheduled_start);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const subject = `Appointment Accepted`;
    const body = `Your ${appointment_type.replace('_', ' ')} appointment with ${providerName} at ${facilityName} on ${formattedDate} has been accepted.`;
    
    const payload = {
      type: 'appointment_pending_confirmation',
      appointment_id,
      patient_id,
      provider_id,
      facility_id,
      scheduled_start,
      appointment_type,
      requires_confirmation: true
    };

    const notifications = [];

    // Get patient's user_id if they have an account
    const [patientUsers] = await db.query(`
      SELECT u.user_id 
      FROM patients p
      LEFT JOIN users u ON p.created_by = u.user_id OR p.email = u.email
      WHERE p.patient_id = ?
      LIMIT 1
    `, [patient_id]);

    if (patientUsers.length > 0) {
      const patientUserId = patientUsers[0].user_id;
      
      // In-app message for patient
      const patientMessage = await createInAppMessage({
        sender_id: null, // System message
        recipient_id: patientUserId,
        recipient_type: 'user',
        subject,
        body,
        payload,
        priority: 'high'
      });
      notifications.push(patientMessage);

      // Only create in-app message for patient (no duplicate notification entry)
      // The in-app message is sufficient - no need for duplicate notifications table entry
    }

    return { success: true, notifications };
  } catch (error) {
    console.error('Error notifying appointment provider acceptance:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to notify patient that provider declined
export async function notifyAppointmentProviderDeclined(appointment, reason = null) {
  try {
    const { appointment_id, patient_id, provider_id, facility_id, scheduled_start, appointment_type } = appointment;
    
    // Get patient name
    const [patients] = await db.query(
      'SELECT first_name, last_name FROM patients WHERE patient_id = ?',
      [patient_id]
    );
    const patientName = patients.length > 0 
      ? `${patients[0].first_name} ${patients[0].last_name}`
      : 'Patient';

    // Get facility name
    const [facilities] = await db.query(
      'SELECT facility_name FROM facilities WHERE facility_id = ?',
      [facility_id]
    );
    const facilityName = facilities.length > 0 ? facilities[0].facility_name : 'Facility';

    // Get provider name
    let providerName = 'Provider';
    if (provider_id) {
      const [providers] = await db.query(
        'SELECT full_name FROM users WHERE user_id = ?',
        [provider_id]
      );
      if (providers.length > 0) {
        providerName = providers[0].full_name;
      }
    }

    const appointmentDate = new Date(scheduled_start);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const subject = `Appointment Declined`;
    let body = `Your ${appointment_type.replace('_', ' ')} appointment with ${providerName} at ${facilityName} on ${formattedDate} has been declined.`;
    
    if (reason) {
      body += ` Reason: ${reason}`;
    } else {
      body += ` Please contact the facility to reschedule.`;
    }
    
    const payload = {
      type: 'appointment_declined',
      appointment_id,
      patient_id,
      provider_id,
      facility_id,
      scheduled_start,
      appointment_type,
      decline_reason: reason || null
    };

    const notifications = [];

    // Get patient's user_id if they have an account
    const [patientUsers] = await db.query(`
      SELECT u.user_id 
      FROM patients p
      LEFT JOIN users u ON p.created_by = u.user_id OR p.email = u.email
      WHERE p.patient_id = ?
      LIMIT 1
    `, [patient_id]);

    if (patientUsers.length > 0) {
      const patientUserId = patientUsers[0].user_id;
      
      // In-app message for patient
      const patientMessage = await createInAppMessage({
        sender_id: null, // System message
        recipient_id: patientUserId,
        recipient_type: 'user',
        subject,
        body,
        payload,
        priority: 'high'
      });
      // Only create in-app message for patient (no duplicate notification entry)
      if (patientMessage.success) {
        notifications.push(patientMessage);
      }
    }

    return { success: true, notifications };
  } catch (error) {
    console.error('Error notifying appointment provider decline:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to notify provider and patient that appointment was confirmed
// Helper function to notify patient when appointment provider or time changes
export async function notifyAppointmentChanged(appointment, changes) {
  try {
    const { appointment_id, patient_id, provider_id, facility_id, scheduled_start, appointment_type } = appointment;
    
    // Get patient name
    const [patients] = await db.query(
      'SELECT first_name, last_name FROM patients WHERE patient_id = ?',
      [patient_id]
    );
    const patientName = patients.length > 0 
      ? `${patients[0].first_name} ${patients[0].last_name}`
      : 'Patient';

    // Get facility name
    const [facilities] = await db.query(
      'SELECT facility_name FROM facilities WHERE facility_id = ?',
      [facility_id]
    );
    const facilityName = facilities.length > 0 ? facilities[0].facility_name : 'Facility';

    // Get provider name
    let providerName = 'Provider';
    if (provider_id) {
      const [providers] = await db.query(
        'SELECT full_name FROM users WHERE user_id = ?',
        [provider_id]
      );
      if (providers.length > 0) {
        providerName = providers[0].full_name;
      }
    }

    // Get old provider name if provider changed
    let oldProviderName = null;
    if (changes.providerChanged && changes.oldProviderId) {
      const [oldProviders] = await db.query(
        'SELECT full_name FROM users WHERE user_id = ?',
        [changes.oldProviderId]
      );
      if (oldProviders.length > 0) {
        oldProviderName = oldProviders[0].full_name;
      }
    }

    const appointmentDate = new Date(scheduled_start);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Build notification message based on what changed
    let subject = 'Appointment Updated';
    let body = '';
    
    if (changes.providerChanged && changes.timeChanged) {
      const oldDate = changes.oldScheduledStart ? new Date(changes.oldScheduledStart).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'previous time';
      subject = `Appointment Updated`;
      body = `Your ${appointment_type.replace('_', ' ')} appointment at ${facilityName} has been updated. `;
      if (oldProviderName) {
        body += `Provider changed from ${oldProviderName} to ${providerName}. `;
      } else {
        body += `Provider is now ${providerName}. `;
      }
      body += `New date and time: ${formattedDate}.`;
    } else if (changes.providerChanged) {
      subject = `Appointment Updated`;
      body = `Your ${appointment_type.replace('_', ' ')} appointment at ${facilityName} on ${formattedDate} has been updated. `;
      if (oldProviderName) {
        body += `Provider changed from ${oldProviderName} to ${providerName}.`;
      } else {
        body += `Provider is now ${providerName}.`;
      }
    } else if (changes.timeChanged) {
      const oldDate = changes.oldScheduledStart ? new Date(changes.oldScheduledStart).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'previous time';
      subject = `Appointment Updated`;
      body = `Your ${appointment_type.replace('_', ' ')} appointment at ${facilityName} with ${providerName} has been rescheduled. New date and time: ${formattedDate}.`;
    }

    const payload = {
      type: 'appointment_updated',
      appointment_id,
      patient_id,
      provider_id,
      facility_id,
      scheduled_start,
      appointment_type,
      changes: {
        providerChanged: changes.providerChanged,
        timeChanged: changes.timeChanged
      }
    };

    // Notify patient
    const [patientUsers] = await db.query(`
      SELECT u.user_id 
      FROM patients p
      LEFT JOIN users u ON p.created_by = u.user_id OR p.email = u.email
      WHERE p.patient_id = ?
      LIMIT 1
    `, [patient_id]);

    if (patientUsers.length > 0) {
      const patientUserId = patientUsers[0].user_id;
      
      // Create in-app message for patient
      const patientMessage = await createInAppMessage({
        sender_id: null,
        recipient_id: patientUserId,
        recipient_type: 'user',
        subject: subject,
        body: body,
        payload: JSON.stringify(payload),
        priority: 'high'
      });
      
      if (patientMessage.success) {
        console.log('Patient notification created for appointment change:', appointment_id);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error notifying appointment change:', error);
    return { success: false, error: error.message };
  }
}

export async function notifyAppointmentPatientConfirmed(appointment) {
  try {
    const { appointment_id, patient_id, provider_id, facility_id, scheduled_start, appointment_type } = appointment;
    
    // Get patient name
    const [patients] = await db.query(
      'SELECT first_name, last_name FROM patients WHERE patient_id = ?',
      [patient_id]
    );
    const patientName = patients.length > 0 
      ? `${patients[0].first_name} ${patients[0].last_name}`
      : 'Patient';

    // Get facility name
    const [facilities] = await db.query(
      'SELECT facility_name FROM facilities WHERE facility_id = ?',
      [facility_id]
    );
    const facilityName = facilities.length > 0 ? facilities[0].facility_name : 'Facility';

    // Get provider name
    let providerName = 'Provider';
    if (provider_id) {
      const [providers] = await db.query(
        'SELECT full_name FROM users WHERE user_id = ?',
        [provider_id]
      );
      if (providers.length > 0) {
        providerName = providers[0].full_name;
      }
    }

    const appointmentDate = new Date(scheduled_start);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const payload = {
      type: 'appointment_confirmed',
      appointment_id,
      patient_id,
      provider_id,
      facility_id,
      scheduled_start,
      appointment_type
    };

    const notifications = [];

    // Notify provider that patient confirmed
    if (provider_id) {
      const providerSubject = `Appointment Confirmed`;
      const providerBody = `${patientName} has confirmed their ${appointment_type.replace('_', ' ')} appointment at ${facilityName} on ${formattedDate}.`;
      
      // In-app message for provider
      const providerMessage = await createInAppMessage({
        sender_id: null, // System message
        recipient_id: provider_id,
        recipient_type: 'user',
        subject: providerSubject,
        body: providerBody,
        payload,
        priority: 'normal'
      });
      notifications.push(providerMessage);

      // Create notification entry for provider
      const providerNotification = await createNotification({
        recipient_id: provider_id,
        patient_id: patient_id, // Include patient_id so staff can see this
        title: 'Appointment Confirmed',
        message: `${patientName} has confirmed the appointment`,
        type: 'appointment',
        payload: JSON.stringify(payload)
      });
      if (providerNotification.success) {
        notifications.push(providerNotification);
      }
    }

    // Notify patient that their confirmation was successful
    const [patientUsers] = await db.query(`
      SELECT u.user_id 
      FROM patients p
      LEFT JOIN users u ON p.created_by = u.user_id OR p.email = u.email
      WHERE p.patient_id = ?
      LIMIT 1
    `, [patient_id]);

    if (patientUsers.length > 0) {
      const patientUserId = patientUsers[0].user_id;
      const patientSubject = `Appointment Confirmed`;
      const patientBody = `Your ${appointment_type.replace('_', ' ')} appointment with ${providerName} at ${facilityName} on ${formattedDate} has been confirmed.`;
      
      // Only create in-app message for patient (no duplicate notification entry)
      const patientMessage = await createInAppMessage({
        sender_id: null, // System message
        recipient_id: patientUserId,
        recipient_type: 'user',
        subject: patientSubject,
        body: patientBody,
        payload,
        priority: 'normal',
        createNotificationEntry: false // Don't create duplicate
      });
      if (patientMessage.success) {
        notifications.push(patientMessage);
      }
    }

    return { success: true, notifications };
  } catch (error) {
    console.error('Error notifying appointment patient confirmation:', error);
    return { success: false, error: error.message };
  }
}

// GET /api/notifications - Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type = 'all', unread_only = false } = req.query;
    const user_id = req.user.user_id;
    const user_role = req.user.role;

    let inAppMessages = [];
    let notifications = [];

    // Get notifications from notifications table
    if (type === 'all' || type === 'notifications') {
      // Get patient_id if user is a patient
      let patient_id = null;
      if (user_role === 'patient') {
        const [patientRows] = await db.query(`
          SELECT patient_id FROM patients 
          WHERE created_by = ? OR email IN (SELECT email FROM users WHERE user_id = ?)
          LIMIT 1
        `, [user_id, user_id]);
        if (patientRows.length > 0) {
          patient_id = patientRows[0].patient_id;
        }
      }

      let query = `
        SELECT n.*
        FROM notifications n
        WHERE n.recipient_id = ?
      `;
      const params = [user_id];
      
      if (unread_only === 'true') {
        query += ' AND n.is_read = FALSE';
      }
      
      query += ' ORDER BY n.created_at DESC LIMIT 100';
      
      console.log('Fetching notifications with query:', query);
      console.log('Query params:', params);
      
      const [notifs] = await db.query(query, params);
      
      console.log(`Found ${notifs.length} notifications for user ${user_id}`);
      
      // Try to extract appointment_id from notification message/payload if available
      // Note: Since notifications table doesn't have patient_id column, we can't match by patient
      // Appointments will be linked via in_app_messages payload instead
      
      notifications = notifs;
    }

    // Get in-app messages
    if (type === 'all' || type === 'in_app') {
      let query = `
        SELECT m.*, 
               u.full_name AS sender_name
        FROM in_app_messages m
        LEFT JOIN users u ON m.sender_id = u.user_id
        WHERE m.recipient_id = ? AND m.recipient_type = 'user'
      `;
      
      if (unread_only === 'true') {
        query += ' AND m.is_read = FALSE';
      }
      
      query += ' ORDER BY m.sent_at DESC LIMIT 100';
      
      const [messages] = await db.query(query, [user_id]);
      inAppMessages = messages;
    }

    res.json({
      success: true,
      data: {
        notifications: notifications,
        in_app_messages: inAppMessages
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read/unread
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_read = true } = req.body; // Default to marking as read, but allow unread
    const user_id = req.user.user_id;

    // Try to update in notifications table first
    let [result] = await db.query(`
      UPDATE notifications 
      SET is_read = ?
      WHERE notification_id = ? AND recipient_id = ?
    `, [is_read, id, user_id]);

    // If not found in notifications table, try in_app_messages
    if (result.affectedRows === 0) {
      [result] = await db.query(`
        UPDATE in_app_messages 
        SET is_read = ?, read_at = ${is_read ? 'NOW()' : 'NULL'}
        WHERE message_id = ? AND recipient_id = ?
      `, [is_read, id, user_id]);
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied'
      });
    }

    res.json({
      success: true,
      message: `Notification marked as ${is_read ? 'read' : 'unread'}`
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // Update all unread notifications in the notifications table
    const [result] = await db.query(`
      UPDATE notifications 
      SET is_read = TRUE
      WHERE recipient_id = ? AND is_read = FALSE
    `, [user_id]);

    // Also update in_app_messages for consistency (these use recipient_id)
    await db.query(`
      UPDATE in_app_messages 
      SET is_read = TRUE, read_at = NOW()
      WHERE recipient_id = ? AND recipient_type = 'user' AND is_read = FALSE
    `, [user_id]);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      updated_count: result.affectedRows
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const user_role = req.user.role;

    // Count from notifications table
    let patient_id = null;
    if (user_role === 'patient') {
      const [patientRows] = await db.query(`
        SELECT patient_id FROM patients 
        WHERE created_by = ? OR email IN (SELECT email FROM users WHERE user_id = ?)
        LIMIT 1
      `, [user_id, user_id]);
      if (patientRows.length > 0) {
        patient_id = patientRows[0].patient_id;
      }
    }

    let query = `
      SELECT COUNT(*) as count FROM notifications
      WHERE recipient_id = ?
        AND is_read = FALSE
    `;
    const params = [user_id];
    
    const [notifs] = await db.query(query, params);
    const notificationsCount = notifs[0].count || 0;

    // Count from in_app_messages
    const [messages] = await db.query(`
      SELECT COUNT(*) as count FROM in_app_messages
      WHERE recipient_id = ? AND recipient_type = 'user' AND is_read = FALSE
    `, [user_id]);
    const messagesCount = messages[0].count || 0;

    res.json({
      success: true,
      count: notificationsCount + messagesCount
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
});

export default router;

