// web/src/components/CareTasks.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Search, Eye, Edit, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const CareTasks = ({ socket }) => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);

  // Form state for adding/updating tasks
  const [formData, setFormData] = useState({
    patient_id: '',
    task_type: '',
    assignee_id: '',
    task_description: '',
    due_date: '',
    referral_id: '',
  });

  const [updateStatus, setUpdateStatus] = useState('pending');

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Get current user from localStorage or API
  const getCurrentUser = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        setUserLoading(false);
        return user;
      }

      // Try to fetch from API if not in localStorage
      const token = getAuthToken();
      if (token) {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            // Save to localStorage for future use
            localStorage.setItem('user', JSON.stringify(data.user));
            setCurrentUser(data.user);
            setUserLoading(false);
            return data.user;
          }
        }
      }

      setUserLoading(false);
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      setUserLoading(false);
      return null;
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadUserAndData = async () => {
      setUserLoading(true);
      const user = await getCurrentUser();

      // Only check access after user is loaded
      if (user && !['admin', 'physician', 'case_manager', 'nurse'].includes(user.role)) {
        setToast({
          message: 'Access denied',
          type: 'error',
        });
        setUserLoading(false);
        setLoading(false);
        return;
      }

      // Load data if user has access
      if (user && ['admin', 'physician', 'case_manager', 'nurse'].includes(user.role)) {
        // Don't set loading to false here - let loadTasks() handle it
        await Promise.all([
          loadTasks(),
          loadPatients(),
          loadUsers(),
          loadReferrals(),
          loadFacilities()
        ]);
      }

      setUserLoading(false);
    };

    loadUserAndData();
  }, []);

  // Filter tasks when filters change
  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, statusFilter, typeFilter, currentUser]);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load tasks from API
  const loadTasks = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setTasks([]);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/care-tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Care Tasks API Response:', data);
        if (data.success) {
          console.log('Loaded care tasks:', data.tasks?.length || 0);
          console.log('Sample task:', data.tasks?.[0]);
          setTasks(data.tasks || []);
        } else {
          console.error('API returned success=false:', data);
          setTasks([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Failed to load care tasks:', response.status, errorData);
        setToast({
          message: errorData.message || `Failed to load tasks: ${response.status}`,
          type: 'error',
        });
        setTasks([]);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Load patients
  const loadPatients = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        // Fallback to localStorage if no token
        const storedPatients = JSON.parse(localStorage.getItem('patients')) || [];
        setPatients(storedPatients);
        return;
      }

      const response = await fetch(`${API_URL}/patients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPatients(data.patients || []);
        } else {
          // Fallback to localStorage
          const storedPatients = JSON.parse(localStorage.getItem('patients')) || [];
          setPatients(storedPatients);
        }
      } else {
        // Fallback to localStorage
        const storedPatients = JSON.parse(localStorage.getItem('patients')) || [];
        setPatients(storedPatients);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      const storedPatients = JSON.parse(localStorage.getItem('patients')) || [];
      setPatients(storedPatients);
    }
  };

  // Load users (only physicians for assignment)
  const loadUsers = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setUsers([]);
        return;
      }

      // Fetch only physicians from providers endpoint
      const response = await fetch(`${API_URL}/users/providers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Loaded physicians:', data.providers?.length || 0);
          setUsers(data.providers || []);
        } else {
          console.error('API returned success=false for providers:', data);
          setUsers([]);
        }
      } else {
        console.error('Failed to load providers:', response.status);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      setUsers([]);
    }
  };

  // Load referrals
  const loadReferrals = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setReferrals([]);
        return;
      }

      const response = await fetch(`${API_URL}/referrals`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReferrals(data.referrals || []);
        }
      }
    } catch (error) {
      console.error('Error loading referrals:', error);
      setReferrals([]);
    }
  };

  // Load facilities
  const loadFacilities = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setFacilities([]);
        return;
      }

      const response = await fetch(`${API_URL}/facilities`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        let facilitiesArray = [];
        if (data.success && data.data && Array.isArray(data.data)) {
          facilitiesArray = data.data;
        } else if (Array.isArray(data)) {
          facilitiesArray = data;
        } else if (data && typeof data === 'object') {
          facilitiesArray = data.facilities || data.data || [];
        }
        setFacilities(facilitiesArray);
      }
    } catch (error) {
      console.error('Error loading facilities:', error);
      setFacilities([]);
    }
  };

  // Get facility name by ID
  const getFacilityName = (facilityId) => {
    if (!facilityId) return 'Unknown Facility';
    const facility = facilities.find((f) => 
      (f.facility_id && f.facility_id === facilityId) || 
      (f.id && f.id === facilityId)
    );
    return facility?.facility_name || facility?.name || 'Unknown Facility';
  };

  // Format task description by replacing facility IDs with names
  const formatTaskDescription = (description, referral = null) => {
    if (!description) return description;
    
    // If we have referral data with facility names, use those first
    if (referral && referral.from_facility_name && referral.to_facility_name) {
      // Check if description contains "from [UUID] to [UUID]" pattern
      const match = description.match(/from\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s+to\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      
      if (match) {
        return description.replace(
          /from\s+[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\s+to\s+[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
          `from ${referral.from_facility_name} to ${referral.to_facility_name}`
        );
      }
    }
    
    // Fallback: try to look up facilities by ID
    const match = description.match(/from\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s+to\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    
    if (match) {
      const fromFacilityId = match[1];
      const toFacilityId = match[2];
      const fromFacilityName = getFacilityName(fromFacilityId);
      const toFacilityName = getFacilityName(toFacilityId);
      return description.replace(
        /from\s+[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\s+to\s+[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
        `from ${fromFacilityName} to ${toFacilityName}`
      );
    }
    
    return description;
  };

  // Filter tasks
  const filterTasks = () => {
    let filtered = [...tasks]; // Create a copy to avoid mutating original
    console.log('Filtering tasks. Total:', tasks.length, 'Current user:', currentUser);

    // Filter by role (non-admin users see only their tasks)
    // NOTE: Backend already filters by role, so this is redundant but kept for safety
    if (currentUser && currentUser.role !== 'admin') {
      const userId = String(currentUser.userId || currentUser.user_id || currentUser.id);
      console.log('Non-admin user filtering by userId:', userId);
      const beforeFilter = filtered.length;
      filtered = filtered.filter(
        (t) => {
          const assigneeId = String(t.assignee_id || t.assigneeId || '');
          const createdById = String(t.created_by || t.createdBy || '');
          const matches = assigneeId === userId || createdById === userId;
          if (!matches && beforeFilter <= 5) { // Only log if few items to avoid spam
            console.log('Task filtered out:', t.task_id, 'assignee:', assigneeId, 'created_by:', createdById, 'user:', userId);
          }
          return matches;
        }
      );
      console.log('After role filter:', filtered.length, 'out of', beforeFilter);
    } else {
      console.log('Admin user - showing all tasks');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((task) => {
        const patientName = (task.patient_name || '').toLowerCase();
        const description = (task.task_description || '').toLowerCase();
        return patientName.includes(searchTerm.toLowerCase()) || description.includes(searchTerm.toLowerCase());
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.task_type === typeFilter);
    }

    console.log('Filtered tasks:', filtered.length, 'out of', tasks.length);
    setFilteredTasks(filtered);
  };

  // Show add task modal
  const handleShowAddModal = () => {
    const userId = currentUser?.userId || currentUser?.user_id || currentUser?.id || '';
    setFormData({
      patient_id: '',
      task_type: '',
      assignee_id: userId,
      task_description: '',
      due_date: '',
      referral_id: '',
    });
    setShowAddModal(true);
  };

  // Add task
  const handleAddTask = async () => {
    if (!formData.patient_id || !formData.task_type || !formData.assignee_id || !formData.task_description) {
      setToast({
        message: 'Please fill in all required fields',
        type: 'error',
      });
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        setToast({
          message: 'Please log in to create tasks',
          type: 'error',
        });
        return;
      }

      const response = await fetch(`${API_URL}/care-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          referral_id: formData.referral_id || null,
          patient_id: formData.patient_id,
          assignee_id: formData.assignee_id,
          task_type: formData.task_type,
          task_description: formData.task_description.trim(),
          due_date: formData.due_date || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await loadTasks(); // Reload tasks
          setShowAddModal(false);
          setToast({
            message: 'Care task created successfully',
            type: 'success',
          });
        } else {
          setToast({
            message: data.message || 'Failed to create task',
            type: 'error',
          });
        }
      } else {
        const error = await response.json();
        setToast({
          message: error.message || 'Failed to create task',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error creating task:', error);
      setToast({
        message: 'Error creating task',
        type: 'error',
      });
    }
  };

  // View task
  const handleViewTask = (taskId) => {
    const task = tasks.find((t) => (t.task_id === taskId) || (t.id === taskId));
    if (task) {
      setSelectedTask(task);
      setShowViewModal(true);
    }
  };

  // Show update status modal
  const handleShowUpdateModal = (taskId) => {
    const task = tasks.find((t) => (t.task_id === taskId) || (t.id === taskId));
    if (task) {
      setSelectedTask(task);
      setUpdateStatus(task.status);
      setShowUpdateModal(true);
    }
  };

  // Save task status
  const handleSaveTaskStatus = async () => {
    if (!selectedTask) return;

    try {
      const token = getAuthToken();
      if (!token) {
        setToast({
          message: 'Please log in to update tasks',
          type: 'error',
        });
        return;
      }

      const response = await fetch(`${API_URL}/care-tasks/${selectedTask.task_id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: updateStatus,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await loadTasks(); // Reload tasks
          setShowUpdateModal(false);
          setSelectedTask(null);
          setToast({
            message: 'Task status updated successfully',
            type: 'success',
          });
        } else {
          setToast({
            message: data.message || 'Failed to update task',
            type: 'error',
          });
        }
      } else {
        const error = await response.json();
        setToast({
          message: error.message || 'Failed to update task',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setToast({
        message: 'Error updating task',
        type: 'error',
      });
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this care task?')) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        setToast({
          message: 'Please log in to delete tasks',
          type: 'error',
        });
        return;
      }

      const response = await fetch(`${API_URL}/care-tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await loadTasks(); // Reload tasks
          setToast({
            message: 'Task deleted successfully',
            type: 'success',
          });
        } else {
          setToast({
            message: data.message || 'Failed to delete task',
            type: 'error',
          });
        }
      } else {
        const error = await response.json().catch(() => ({ message: 'Failed to delete task' }));
        setToast({
          message: error.message || 'Failed to delete task',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      setToast({
        message: 'Error deleting task',
        type: 'error',
      });
    }
  };

  // Get patient name
  const getPatientName = (patientId) => {
    const patient = patients.find((p) => 
      (p.id && p.id === patientId) || 
      (p.patient_id && p.patient_id === patientId)
    );
    if (patient) {
      return patient.patient_name || `${patient.firstName || patient.first_name} ${patient.lastName || patient.last_name}`;
    }
    return 'N/A';
  };

  // Get user name
  const getUserName = (userId) => {
    const user = users.find((u) => 
      (u.id && u.id === userId) || 
      (u.userId && u.userId === userId) || 
      (u.user_id && u.user_id === userId)
    );
    if (user) {
      return user.fullName || user.full_name || user.assignee_name || user.created_by_name || `${user.firstName || user.first_name} ${user.lastName || user.last_name}`;
    }
    return 'Unassigned';
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'in_progress':
        return '#007bff';
      case 'pending':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  // Check if task is overdue
  const isOverdue = (task) => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  // Show loading state while user is being fetched
  if (userLoading) {
    return (
      <div style={{ padding: '20px', paddingTop: '80px', textAlign: 'center' }}>
        <div style={{ color: '#6c757d', fontSize: '14px' }}>Loading...</div>
      </div>
    );
  }

  // Check access only after user is loaded
  if (!currentUser) {
    return (
      <div style={{ padding: '20px', paddingTop: '80px' }}>
        <div
          style={{
            padding: '16px',
            background: '#dc3545',
            color: 'white',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          Please log in to access this page
        </div>
      </div>
    );
  }

  const userRole = currentUser.role;
  if (!['admin', 'physician', 'case_manager', 'nurse'].includes(userRole)) {
    return (
      <div style={{ padding: '20px', paddingTop: '80px' }}>
        <div
          style={{
            padding: '16px',
            background: '#dc3545',
            color: 'white',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          Access denied. Your role ({userRole || 'unknown'}) does not have permission to access this page.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', paddingTop: '80px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2
            style={{
              margin: '0 0 4px 0',
              color: '#212529',
              fontSize: '24px',
              fontWeight: '600',
            }}
          >
            Care Tasks
          </h2>
          <p style={{ margin: '0', color: '#6c757d', fontSize: '14px' }}>
            Manage care coordination tasks
          </p>
        </div>
        <button
          onClick={handleShowAddModal}
          style={{
            padding: '8px 16px',
            background: '#0d6efd',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '400',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={16} />
          Create Task
        </button>
      </div>

      {/* Search and Filters */}
      <div
        style={{
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search
              size={18}
              color="#6c757d"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px 8px 40px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white',
              minWidth: '150px',
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white',
              minWidth: '150px',
            }}
          >
            <option value="all">All Types</option>
            <option value="follow_up">Follow-up</option>
            <option value="referral">Referral</option>
            <option value="counseling">Counseling</option>
            <option value="appointment">Appointment</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                  }}
                >
                  Task
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                  }}
                >
                  Patient
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                  }}
                >
                  Assigned To
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                  }}
                >
                  Due Date
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                    Loading tasks...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                    {tasks.length === 0 
                      ? 'No care tasks found. Check console for API response details.'
                      : `No tasks match your filters. Showing ${tasks.length} total task(s).`}
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const taskId = task.task_id || task.id;
                  const overdue = isOverdue(task);
                  const referral = task.referral_id
                    ? referrals.find((r) => (r.id && r.id === task.referral_id) || (r.referral_id && r.referral_id === task.referral_id))
                    : null;

                  return (
                    <tr
                      key={taskId}
                      style={{
                        borderBottom: '1px solid #dee2e6',
                        background: overdue ? '#fff3cd' : 'white',
                      }}
                    >
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                          {formatTaskDescription(task.task_description, referral)}
                        </div>
                        {referral && (
                          <small style={{ color: '#6c757d', fontSize: '12px' }}>
                            Related to referral from {referral.from_facility_name || 'Unknown Facility'} to {referral.to_facility_name || 'Unknown Facility'}
                          </small>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {task.patient_name || getPatientName(task.patient_id)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: '#d1ecf1',
                            color: '#0c5460',
                          }}
                        >
                          {task.task_type?.replace('_', ' ').toUpperCase() || task.task_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {task.assignee_name || getUserName(task.assignee_id)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {formatDate(task.due_date)}
                          {overdue && (
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '500',
                                backgroundColor: '#dc3545',
                                color: 'white',
                              }}
                            >
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: getStatusColor(task.status),
                            color: 'white',
                          }}
                        >
                          {task.status?.replace('_', ' ').toUpperCase() || task.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleViewTask(taskId)}
                            style={{
                              padding: '4px 8px',
                              background: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Eye size={14} />
                            View
                          </button>
                          {task.status !== 'completed' && (
                            <button
                              onClick={() => handleShowUpdateModal(taskId)}
                              style={{
                                padding: '4px 8px',
                                background: '#0d6efd',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Edit size={14} />
                              Update
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTask(taskId)}
                            style={{
                              padding: '4px 8px',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '600px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                Create Care Task
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} color="#6c757d" />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                Patient <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="">Select Patient</option>
                {patients.map((p) => (
                  <option key={p.patient_id || p.id} value={p.patient_id || p.id}>
                    {p.patient_name || `${p.firstName || p.first_name} ${p.lastName || p.last_name}`}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '500',
                    fontSize: '14px',
                  }}
                >
                  Task Type <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={formData.task_type}
                  onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select Type</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="referral">Referral</option>
                  <option value="counseling">Counseling</option>
                  <option value="appointment">Appointment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '500',
                    fontSize: '14px',
                  }}
                >
                  Assign To <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={formData.assignee_id}
                  onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select Assignee</option>
                  {users.map((u) => (
                    <option key={u.user_id || u.userId || u.id} value={u.user_id || u.userId || u.id}>
                      {u.full_name || u.fullName || `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`.trim() || u.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                Task Description <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                value={formData.task_description}
                onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
                rows="3"
                required
                placeholder="Enter task description..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                Related Referral (Optional)
              </label>
              <select
                value={formData.referral_id}
                onChange={(e) => setFormData({ ...formData, referral_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="">None</option>
                {referrals
                  .filter((r) => r.status === 'pending' || r.status === 'accepted')
                  .map((r) => (
                    <option key={r.referral_id || r.id} value={r.referral_id || r.id}>
                      {r.from_facility_name || 'Unknown'} → {r.to_facility_name || 'Unknown'} - {(r.referral_reason || r.reason || '').substring(0, 40)}...
                    </option>
                  ))}
              </select>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
              }}
            >
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                style={{
                  padding: '8px 16px',
                  background: '#0d6efd',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Task Modal */}
      {showViewModal && selectedTask && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowViewModal(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '600px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                Care Task Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} color="#6c757d" />
              </button>
            </div>

            {(() => {
              const task = selectedTask;
              const patient = patients.find((p) => (p.id && p.id === task.patient_id) || (p.patient_id && p.patient_id === task.patient_id));
              const assignee = users.find(
                (u) => (u.id && u.id === task.assignee_id) || (u.userId && u.userId === task.assignee_id) || (u.user_id && u.user_id === task.assignee_id)
              );
              const creator = users.find(
                (u) => (u.id && u.id === task.created_by) || (u.userId && u.userId === task.created_by) || (u.user_id && u.user_id === task.created_by)
              );
              const referral = task.referral_id ? referrals.find((r) => (r.id && r.id === task.referral_id) || (r.referral_id && r.referral_id === task.referral_id)) : null;

              return (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontWeight: '500',
                        fontSize: '14px',
                        color: '#6c757d',
                      }}
                    >
                      Patient
                    </label>
                      <input
                        type="text"
                        value={task.patient_name || getPatientName(task.patient_id)}
                        readOnly
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e9ecef',
                        borderRadius: '4px',
                        backgroundColor: '#f8f9fa',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '6px',
                          fontWeight: '500',
                          fontSize: '14px',
                          color: '#6c757d',
                        }}
                      >
                        Task Type
                      </label>
                      <input
                        type="text"
                        value={task.task_type?.replace('_', ' ') || task.task_type}
                        readOnly
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e9ecef',
                          borderRadius: '4px',
                          backgroundColor: '#f8f9fa',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '6px',
                          fontWeight: '500',
                          fontSize: '14px',
                          color: '#6c757d',
                        }}
                      >
                        Status
                      </label>
                      <input
                        type="text"
                        value={task.status?.replace('_', ' ') || task.status}
                        readOnly
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e9ecef',
                          borderRadius: '4px',
                          backgroundColor: '#f8f9fa',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontWeight: '500',
                        fontSize: '14px',
                        color: '#6c757d',
                      }}
                    >
                      Task Description
                    </label>
                    <textarea
                      rows="4"
                      value={formatTaskDescription(task.task_description, referral)}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e9ecef',
                        borderRadius: '4px',
                        backgroundColor: '#f8f9fa',
                        fontSize: '14px',
                        resize: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '6px',
                          fontWeight: '500',
                          fontSize: '14px',
                          color: '#6c757d',
                        }}
                      >
                        Assigned To
                      </label>
                      <input
                        type="text"
                        value={task.assignee_name || getUserName(task.assignee_id)}
                        readOnly
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e9ecef',
                          borderRadius: '4px',
                          backgroundColor: '#f8f9fa',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '6px',
                          fontWeight: '500',
                          fontSize: '14px',
                          color: '#6c757d',
                        }}
                      >
                        Due Date
                      </label>
                      <input
                        type="text"
                        value={formatDate(task.due_date)}
                        readOnly
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e9ecef',
                          borderRadius: '4px',
                          backgroundColor: '#f8f9fa',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  </div>

                  {referral && (
                    <div style={{ marginBottom: '16px' }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '6px',
                          fontWeight: '500',
                          fontSize: '14px',
                          color: '#6c757d',
                        }}
                      >
                        Related Referral
                      </label>
                      <input
                        type="text"
                        value={`${referral.from_facility_name || 'Unknown Facility'} → ${referral.to_facility_name || 'Unknown Facility'}: ${(referral.referral_reason || referral.reason || '').substring(0, 50)}...`}
                        readOnly
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e9ecef',
                          borderRadius: '4px',
                          backgroundColor: '#f8f9fa',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '6px',
                          fontWeight: '500',
                          fontSize: '14px',
                          color: '#6c757d',
                        }}
                      >
                        Created By
                      </label>
                      <input
                        type="text"
                        value={task.created_by_name || getUserName(task.created_by) || 'Unknown'}
                        readOnly
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e9ecef',
                          borderRadius: '4px',
                          backgroundColor: '#f8f9fa',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '6px',
                          fontWeight: '500',
                          fontSize: '14px',
                          color: '#6c757d',
                        }}
                      >
                        Created At
                      </label>
                      <input
                        type="text"
                        value={formatDateTime(task.created_at)}
                        readOnly
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e9ecef',
                          borderRadius: '4px',
                          backgroundColor: '#f8f9fa',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  </div>

                  {task.completed_at && (
                    <div style={{ marginBottom: '20px' }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '6px',
                          fontWeight: '500',
                          fontSize: '14px',
                          color: '#6c757d',
                        }}
                      >
                        Completed At
                      </label>
                      <input
                        type="text"
                        value={formatDateTime(task.completed_at)}
                        readOnly
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e9ecef',
                          borderRadius: '4px',
                          backgroundColor: '#f8f9fa',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '8px',
                    }}
                  >
                    <button
                      onClick={() => setShowViewModal(false)}
                      style={{
                        padding: '8px 16px',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      Close
                    </button>
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => {
                          setShowViewModal(false);
                          handleShowUpdateModal(task.task_id);
                        }}
                        style={{
                          padding: '8px 16px',
                          background: '#0d6efd',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        Update Status
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateModal && selectedTask && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowUpdateModal(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                Update Task Status
              </h2>
              <button
                onClick={() => setShowUpdateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} color="#6c757d" />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                Status <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
              }}
            >
              <button
                onClick={() => setShowUpdateModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTaskStatus}
                style={{
                  padding: '8px 16px',
                  background: '#0d6efd',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: toast.type === 'success' ? '#28a745' : toast.type === 'error' ? '#dc3545' : '#17a2b8',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            zIndex: 9999,
            animation: 'slideIn 0.3s ease',
          }}
        >
          <AlertCircle size={20} />
          <span style={{ fontSize: '14px' }}>{toast.message}</span>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default CareTasks;

