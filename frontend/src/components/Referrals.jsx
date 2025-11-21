// web/src/pages/Referrals.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Referrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Load referrals from API
  const loadReferrals = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setReferrals([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter.toLowerCase());
      }

      const response = await fetch(`${API_URL}/referrals?${params.toString()}`, {
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
    } finally {
      setLoading(false);
    }
  };

  // Load patients
  const loadPatients = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/patients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPatients(data.patients || []);
        }
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  // Load facilities
  const loadFacilities = async () => {
    try {
      const token = getAuthToken();
      
      // Build headers - facilities route doesn't require auth, but we'll send token if available
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/facilities?is_active=1`, {
        headers: headers,
      });

      console.log('Facilities fetch response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch facilities:', response.status, response.statusText);
        console.error('Error response body:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.error('Error details:', errorData);
        } catch (e) {
          console.error('Could not parse error response as JSON');
        }
        return;
      }

      const data = await response.json();
      console.log('Facilities API response:', data);
      console.log('Response structure check:', {
        hasSuccess: 'success' in data,
        successValue: data.success,
        hasData: 'data' in data,
        dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
        dataLength: Array.isArray(data.data) ? data.data.length : 'N/A',
      });
      
      if (data.success && Array.isArray(data.data)) {
        // API returns { success: true, data: [...] }
        const facilitiesList = data.data || [];
        console.log('Loaded facilities:', facilitiesList.length);
        console.log('First facility sample:', facilitiesList[0]);
        setFacilities(facilitiesList);
      } else if (data.success && Array.isArray(data.facilities)) {
        // Fallback: in case API returns { success: true, facilities: [...] }
        console.log('Using fallback: facilities property');
        setFacilities(data.facilities || []);
      } else {
        console.error('API returned unexpected structure:', data);
        setFacilities([]);
      }
    } catch (error) {
      console.error('Error loading facilities:', error);
      console.error('Error stack:', error.stack);
      setFacilities([]);
    }
  };

  useEffect(() => {
    loadReferrals();
    loadPatients();
    loadFacilities();
  }, [statusFilter]);

  const handleViewDetails = (referral) => {
    setSelectedReferral(referral);
    setShowDetailsModal(true);
  };

  const handleCreateReferral = () => {
    setShowCreateModal(true);
  };

  const renderReferralList = () => {
    let filtered = referrals;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((r) => {
        const patientName = (r.patient_name || '').toLowerCase();
        const reason = (r.referral_reason || '').toLowerCase();
        return patientName.includes(searchTerm.toLowerCase()) || reason.includes(searchTerm.toLowerCase());
      });
    }

    if (loading) {
      return (
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          Loading referrals...
        </p>
      );
    }

    if (filtered.length === 0) {
      return (
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          No referrals found
        </p>
      );
    }

    return filtered.map((referral) => (
      <div
        key={referral.referral_id || referral.id}
        style={{
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: '0 0 8px 0',
                color: '#212529',
                fontSize: '18px',
                fontWeight: '500',
              }}
            >
              {referral.patient_name || 'N/A'}
            </h3>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '6px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ color: '#0d6efd', fontSize: '14px' }}>
                From: {referral.from_facility_name || 'N/A'}
              </div>
              <div style={{ color: '#0d6efd', fontSize: '14px' }}>
                To: {referral.to_facility_name || 'N/A'}
              </div>
              <div style={{ color: '#6c757d', fontSize: '14px' }}>
                📅 {referral.referred_at ? new Date(referral.referred_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div
              style={{
                marginBottom: '10px',
                color: '#495057',
                fontSize: '14px',
              }}
            >
              Reason: {referral.referral_reason || 'N/A'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: '#d1e7dd',
                color: '#0f5132',
              }}
            >
              {referral.status?.toUpperCase() || 'PENDING'}
            </span>
            <button
              onClick={() => handleViewDetails(referral)}
              style={{
                padding: '6px 12px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '400',
              }}
            >
              View
            </button>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'white', 
      minHeight: '100vh', 
      paddingTop: '100px' 
    }}>
      <div style={{ 
        marginBottom: '30px', 
        background: 'linear-gradient(to right, #D84040, #A31D1D)', 
        padding: '30px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 15px rgba(216, 64, 64, 0.2)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>Patient Referrals</h2>
            <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>Manage patient referrals and care coordination</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreateReferral}
              style={{
                padding: '10px 16px',
                background: '#ECDCBF',
                color: '#A31D1D',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#F8F2DE';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#ECDCBF';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <Plus size={16} />
              Create Referral
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
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
            placeholder="Search referrals..."
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
        <div style={{ position: 'relative' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              appearance: 'none',
              fontSize: '14px',
              backgroundColor: 'white',
              paddingRight: '30px',
              width: '100%',
            }}
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div>{renderReferralList()}</div>

      {/* Create Referral Modal */}
      {showCreateModal && (
        <CreateReferralModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadReferrals();
          }}
          patients={patients}
          facilities={facilities}
        />
      )}

      {/* Referral Details Modal */}
      {showDetailsModal && (
        <ReferralDetailsModal
          referral={selectedReferral}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};

const CreateReferralModal = ({ onClose, onSuccess, patients = [], facilities = [] }) => {
  const [formData, setFormData] = useState({
    patient_id: '',
    from_facility_id: '',
    to_facility_id: '',
    referral_reason: '',
    urgency: 'routine',
    clinical_notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug: Log facilities when modal opens
  React.useEffect(() => {
    console.log('CreateReferralModal - Facilities received:', facilities.length, facilities);
  }, [facilities]);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.patient_id || !formData.from_facility_id || !formData.to_facility_id || !formData.referral_reason) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        setError('Please log in to create referrals');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/referrals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: formData.patient_id,
          from_facility_id: formData.from_facility_id,
          to_facility_id: formData.to_facility_id,
          referral_reason: formData.referral_reason,
          urgency: formData.urgency,
          clinical_notes: formData.clinical_notes || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onSuccess();
        } else {
          setError(data.message || 'Failed to create referral');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create referral');
      }
    } catch (err) {
      console.error('Error creating referral:', err);
      setError('Error creating referral');
    } finally {
      setLoading(false);
    }
  };

  return (
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
    >
      <div
        style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
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
            Create Patient Referral
          </h2>
          <button
            onClick={onClose}
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

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
              {error}
            </div>
          )}
          {facilities.length === 0 && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '14px' }}>
              ⚠️ No facilities available. Please ensure facilities are added to system.
            </div>
          )}
          {facilities.length > 0 && (
            <div style={{ marginBottom: '16px', padding: '8px 12px', background: '#d1e7dd', color: '#0f5132', borderRadius: '4px', fontSize: '14px' }}>
              ✓ {facilities.length} {facilities.length === 1 ? 'branch' : 'branches'} available
            </div>
          )}
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
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.patient_id || p.id} value={p.patient_id || p.id}>
                  {p.patient_name || `${p.first_name || p.firstName} ${p.last_name || p.lastName}`}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ marginBottom: '16px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                From MyHubCares Branch <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={formData.from_facility_id}
                onChange={(e) => setFormData({ ...formData, from_facility_id: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="">Select branch</option>
                {facilities.length === 0 ? (
                  <option value="" disabled>No branches available</option>
                ) : (
                  facilities.map((f) => (
                    <option key={f.facility_id || f.id} value={f.facility_id || f.id}>
                      {f.facility_name || f.name || 'Unnamed Branch'}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div style={{ marginBottom: '16px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                To MyHubCares Branch <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={formData.to_facility_id}
                onChange={(e) => setFormData({ ...formData, to_facility_id: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="">Select branch</option>
                {facilities.length === 0 ? (
                  <option value="" disabled>No branches available</option>
                ) : (
                  facilities.map((f) => (
                    <option key={f.facility_id || f.id} value={f.facility_id || f.id}>
                      {f.facility_name || f.name || 'Unnamed Branch'}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ marginBottom: '16px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                Referral Date
              </label>
              <input
                type="date"
                value={formData.referral_date || new Date().toISOString().split('T')[0]}
                readOnly
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#f8f9fa',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                Urgency Level
              </label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
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
              Reason for Referral <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              rows="3"
              value={formData.referral_reason}
              onChange={(e) => setFormData({ ...formData, referral_reason: e.target.value })}
              required
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

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500',
                fontSize: '14px',
              }}
            >
              Additional Notes (Clinical Notes)
            </label>
            <textarea
              rows="3"
              value={formData.clinical_notes}
              onChange={(e) => setFormData({ ...formData, clinical_notes: e.target.value })}
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

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
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
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: loading ? '#6c757d' : '#0d6efd',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              {loading ? 'Creating...' : 'Create Referral'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReferralDetailsModal = ({ referral, onClose }) => {
  return (
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
    >
      <div
        style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
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
            Referral Details
          </h2>
          <button
            onClick={onClose}
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

        <div>
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
              Patient Name
            </label>
            <div
              style={{
                padding: '8px 12px',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
                fontSize: '14px',
              }}
            >
              {referral.patient_name || 'N/A'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ marginBottom: '16px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#6c757d',
                }}
              >
                From MyHubCares Branch
              </label>
              <div
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                  fontSize: '14px',
                }}
              >
                {referral.from_facility_name || 'N/A'}
              </div>
            </div>

            <div style={{ marginBottom: '16px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#6c757d',
                }}
              >
                To MyHubCares Branch
              </label>
              <div
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                  fontSize: '14px',
                }}
              >
                {referral.to_facility_name || 'N/A'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ marginBottom: '16px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#6c757d',
                }}
              >
                Referral Date
              </label>
              <div
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                  fontSize: '14px',
                }}
              >
                📅 {referral.referred_at ? new Date(referral.referred_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>

            <div style={{ marginBottom: '16px', flex: 1 }}>
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
              <div
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                  fontSize: '14px',
                }}
              >
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: '#d1e7dd',
                    color: '#0f5132',
                  }}
                >
                  {referral.status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
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
              Urgency Level
            </label>
            <div
              style={{
                padding: '8px 12px',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
                fontSize: '14px',
              }}
            >
              {referral.urgency ? referral.urgency.charAt(0).toUpperCase() + referral.urgency.slice(1) : 'N/A'}
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
              Reason for Referral
            </label>
            <div
              style={{
                padding: '8px 12px',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
                fontSize: '14px',
                minHeight: '60px',
              }}
            >
              {referral.referral_reason || 'N/A'}
            </div>
          </div>

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
              Additional Notes (Clinical Notes)
            </label>
            <div
              style={{
                padding: '8px 12px',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
                fontSize: '14px',
                minHeight: '60px',
              }}
            >
              {referral.clinical_notes || 'N/A'}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referrals;