import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Search,
  Filter,
  AlertCircle,
  User,
  Edit,
  Trash2,
  Eye,
  Activity,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Grid,
  List,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showArpaModal, setShowArpaModal] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Get token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Fetch patients from API
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      if (!token) {
        setToast({
          message: 'Please login to view patients',
          type: 'error',
        });
        return;
      }

      const response = await fetch(`${API_URL}/patients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Map API data to frontend format
        const mappedPatients = data.patients.map((patient) => ({
          id: patient.patient_id,
          firstName: patient.first_name,
          middleName: patient.middle_name || '',
          lastName: patient.last_name,
          suffix: patient.suffix || '',
          dateOfBirth: formatDate(patient.birth_date),
          age: calculateAge(patient.birth_date),
          gender: patient.sex,
          phone: patient.contact_phone,
          email: patient.email,
          address: patient.current_address
            ? JSON.parse(patient.current_address)
            : {
                city: patient.current_city,
                province: patient.current_province,
              },
          city: patient.current_city,
          uic: patient.uic,
          philhealthNo: patient.philhealth_no,
          civilStatus: patient.civil_status,
          nationality: patient.nationality,
          facilityName: patient.facility_name,
          riskLevel: 'LOW', // TODO: Calculate from actual data
          lastVisit: patient.updated_at
            ? formatDate(patient.updated_at)
            : 'N/A',
          nextAppointment: 'N/A', // TODO: Get from appointments table
          // Mock ARPA data for now
          arpaData: {
            riskLevel: 'LOW',
            compliancePercentage: 94,
            riskComponents: {
              missedMedications: 0,
              missedAppointments: 0,
              labCompliance: 10,
              timeSinceLastVisit: 20,
            },
            recommendations: 'Continue current treatment plan',
            riskTrend: [
              { month: 'May', value: 20 },
              { month: 'Jun', value: 25 },
              { month: 'Jul', value: 30 },
              { month: 'Aug', value: 25 },
              { month: 'Sep', value: 15 },
              { month: 'Oct', value: 10 },
            ],
          },
        }));

        setPatients(mappedPatients);
      } else {
        setToast({
          message: data.message || 'Failed to load patients',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setToast({
        message: 'Failed to load patients',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setModalType('view');
    setShowModal(true);
  };

  const handleAddPatient = () => {
    // Show alert
    alert('Please use the registration page to add new patients');

    // Navigate to registration page
    window.location.href = '/register'; // or use react-router's navigate('/register')
  };

  const handleEditPatient = (patient) => {
    setSelectedPatient({ ...patient });
    setModalType('edit');
    setShowModal(true);
  };

  const handleDeletePatient = async (patient) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${patient.firstName} ${patient.lastName}?`
      )
    ) {
      try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/patients/${patient.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setToast({
            message: 'Patient deleted successfully.',
            type: 'success',
          });
          fetchPatients(); // Refresh list
        } else {
          setToast({
            message: data.message || 'Failed to delete patient',
            type: 'error',
          });
        }
      } catch (error) {
        console.error('Error deleting patient:', error);
        setToast({
          message: 'Failed to delete patient',
          type: 'error',
        });
      }
    }
  };

  const handleArpaAssessment = (patient) => {
    setSelectedPatient(patient);
    setShowArpaModal(true);
  };

  const handleSavePatient = async () => {
    // Validate required fields
    if (!selectedPatient.phone || !selectedPatient.email) {
      setToast({
        message: 'Please fill in all required fields',
        type: 'error',
      });
      return;
    }

    try {
      const token = getAuthToken();

      const payload = {
        // Personal information
        first_name: selectedPatient.firstName,
        middle_name: selectedPatient.middleName,
        last_name: selectedPatient.lastName,
        suffix: selectedPatient.suffix,
        birth_date: selectedPatient.dateOfBirth,
        sex: selectedPatient.gender,
        civil_status: selectedPatient.civilStatus,
        nationality: selectedPatient.nationality,

        // Contact information
        contact_phone: selectedPatient.phone,
        email: selectedPatient.email,
        current_city: selectedPatient.city,
        current_province: selectedPatient.address?.province || '',
        philhealth_no: selectedPatient.philhealthNo,
        guardian_name: selectedPatient.guardianName || null,
        guardian_relationship: selectedPatient.guardianRelationship || null,
      };

      const response = await fetch(
        `${API_URL}/patients/${selectedPatient.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Patient updated successfully.',
          type: 'success',
        });
        setShowModal(false);
        fetchPatients(); // Refresh list
      } else {
        setToast({
          message: data.message || 'Failed to update patient',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      setToast({
        message: 'Failed to update patient',
        type: 'error',
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedPatient({
      ...selectedPatient,
      [name]: value,
    });
  };

  const getFilteredPatients = () => {
    let filtered = patients;

    if (searchTerm) {
      filtered = filtered.filter(
        (patient) =>
          `${patient.firstName} ${patient.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.phone?.includes(searchTerm) ||
          patient.uic?.includes(searchTerm)
      );
    }

    if (genderFilter !== 'all') {
      filtered = filtered.filter((patient) => {
        // Handle different gender formats
        const patientGender = patient.gender
          ? patient.gender.toLowerCase()
          : '';
        const filterGender = genderFilter.toLowerCase();

        // Check for exact match
        if (patientGender === filterGender) return true;

        // Check for abbreviated format (F/M vs Female/Male)
        if (filterGender === 'female' && patientGender === 'f') return true;
        if (filterGender === 'male' && patientGender === 'm') return true;

        return false;
      });
    }

    return filtered;
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'LOW':
        return '#28a745'; // Green
      case 'MEDIUM':
        return '#ffc107'; // Yellow
      case 'HIGH':
        return '#dc3545'; // Red
      default:
        return '#6c757d';
    }
  };

  const renderGridView = () => {
    const filteredPatients = getFilteredPatients();

    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '15px',
              borderRadius: '50%',
              background: 'white',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e9ecef',
                borderTop: '4px solid #D84040',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            ></div>
          </div>
          <p style={{ color: '#A31D1D', marginTop: '15px' }}>
            Loading patients...
          </p>
        </div>
      );
    }

    if (filteredPatients.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '15px',
              borderRadius: '50%',
              background: 'white',
              marginBottom: '15px',
            }}
          >
            <User size={40} color="#A31D1D" />
          </div>
          <p style={{ color: '#A31D1D' }}>No patients found</p>
        </div>
      );
    }

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            style={{
              background: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              border: '1px solid #e9ecef',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            }}
          >
            <div style={{ padding: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '15px',
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: '#F8F2DE',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: '15px',
                  }}
                >
                  <User size={24} color="#A31D1D" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      margin: 0,
                      color: '#A31D1D',
                      fontSize: '16px',
                      fontWeight: '600',
                    }}
                  >
                    {patient.firstName} {patient.lastName}
                  </h3>
                  <p
                    style={{
                      margin: '3px 0 0 0',
                      color: '#A31D1D',
                      fontSize: '14px',
                    }}
                  >
                    {patient.gender}, {patient.age} years
                  </p>
                </div>
                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: getRiskLevelColor(patient.riskLevel),
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  {patient.riskLevel}
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <Phone
                    size={14}
                    color="#A31D1D"
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '14px', color: '#A31D1D' }}>
                    {patient.phone}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <Mail
                    size={14}
                    color="#A31D1D"
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '14px', color: '#A31D1D' }}>
                    {patient.email}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <MapPin
                    size={14}
                    color="#A31D1D"
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '14px', color: '#A31D1D' }}>
                    {patient.city}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleViewPatient(patient)}
                    style={{
                      padding: '8px',
                      background: '#F8F2DE',
                      color: '#A31D1D',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}
                    title="View"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F8F2DE';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F8F2DE';
                    }}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleArpaAssessment(patient)}
                    style={{
                      padding: '8px',
                      background: '#F8F2DE',
                      color: '#A31D1D',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}
                    title="ARPA Assessment"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F8F2DE';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F8F2DE';
                    }}
                  >
                    <Activity size={16} />
                  </button>
                  <button
                    onClick={() => handleEditPatient(patient)}
                    style={{
                      padding: '8px',
                      background: '#F8F2DE',
                      color: '#A31D1D',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}
                    title="Edit"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F8F2DE';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F8F2DE';
                    }}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeletePatient(patient)}
                    style={{
                      padding: '8px',
                      background: '#F8F2DE',
                      color: '#A31D1D',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}
                    title="Delete"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F8F2DE';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F8F2DE';
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderListView = () => {
    const filteredPatients = getFilteredPatients();

    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '15px',
              borderRadius: '50%',
              background: 'white',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e9ecef',
                borderTop: '4px solid #D84040',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            ></div>
          </div>
          <p style={{ color: '#A31D1D', marginTop: '15px' }}>
            Loading patients...
          </p>
        </div>
      );
    }

    if (filteredPatients.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '15px',
              borderRadius: '50%',
              background: 'white',
              marginBottom: '15px',
            }}
          >
            <User size={40} color="#A31D1D" />
          </div>
          <p style={{ color: '#A31D1D' }}>No patients found</p>
        </div>
      );
    }

    return (
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e9ecef',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                background: '#F8F2DE',
                borderBottom: '2px solid #ECDCBF',
              }}
            >
              <th
                style={{
                  padding: '15px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#A31D1D',
                }}
              >
                Patient
              </th>
              <th
                style={{
                  padding: '15px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#A31D1D',
                }}
              >
                Contact
              </th>
              <th
                style={{
                  padding: '15px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#A31D1D',
                }}
              >
                Location
              </th>
              <th
                style={{
                  padding: '15px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#A31D1D',
                }}
              >
                Risk Level
              </th>
              <th
                style={{
                  padding: '15px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#A31D1D',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((patient, index) => (
              <tr
                key={patient.id}
                style={{
                  borderBottom:
                    index < filteredPatients.length - 1
                      ? '1px solid #e9ecef'
                      : 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F8F2DE';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
              >
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#F8F2DE',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: '12px',
                      }}
                    >
                      <User size={20} color="#A31D1D" />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#A31D1D',
                        }}
                      >
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#A31D1D' }}>
                        {patient.gender}, {patient.age} years
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div
                    style={{
                      fontSize: '14px',
                      color: '#A31D1D',
                      marginBottom: '4px',
                    }}
                  >
                    <Phone
                      size={12}
                      color="#A31D1D"
                      style={{
                        marginRight: '5px',
                        display: 'inline',
                        verticalAlign: 'middle',
                      }}
                    />
                    {patient.phone}
                  </div>
                  <div style={{ fontSize: '14px', color: '#555' }}>
                    <Mail
                      size={12}
                      color="#A31D1D"
                      style={{
                        marginRight: '5px',
                        display: 'inline',
                        verticalAlign: 'middle',
                      }}
                    />
                    {patient.email}
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#555' }}>
                    <MapPin
                      size={12}
                      color="#A31D1D"
                      style={{
                        marginRight: '5px',
                        display: 'inline',
                        verticalAlign: 'middle',
                      }}
                    />
                    {patient.city}
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: getRiskLevelColor(patient.riskLevel),
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      display: 'inline-block',
                    }}
                  >
                    {patient.riskLevel}
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <button
                      onClick={() => handleViewPatient(patient)}
                      style={{
                        padding: '6px',
                        background: '#F8F2DE',
                        color: '#A31D1D',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s',
                      }}
                      title="View"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F8F2DE';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F8F2DE';
                      }}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleArpaAssessment(patient)}
                      style={{
                        padding: '6px',
                        background: '#F8F2DE',
                        color: '#A31D1D',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s',
                      }}
                      title="ARPA Assessment"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F8F2DE';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F8F2DE';
                      }}
                    >
                      <Activity size={14} />
                    </button>
                    <button
                      onClick={() => handleEditPatient(patient)}
                      style={{
                        padding: '6px',
                        background: '#F8F2DE',
                        color: '#A31D1D',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s',
                      }}
                      title="Edit"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F8F2DE';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F8F2DE';
                      }}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeletePatient(patient)}
                      style={{
                        padding: '6px',
                        background: '#F8F2DE',
                        color: '#A31D1D',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s',
                      }}
                      title="Delete"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F8F2DE';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F8F2DE';
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPatientList = () => {
    if (viewMode === 'grid') {
      return renderGridView();
    } else {
      return renderListView();
    }
  };

  const renderPatientModal = () => {
    if (!selectedPatient) return null;

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
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #e9ecef',
              paddingBottom: '15px',
            }}
          >
            <h2 style={{ margin: 0, color: '#A31D1D', fontWeight: 'bold' }}>
              {modalType === 'view' ? 'Patient Details' : 'Edit Patient'}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <X size={24} color="#A31D1D" />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#A31D1D',
                }}
              >
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={selectedPatient.firstName}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#F8F2DE' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#A31D1D',
                }}
              >
                Middle Name
              </label>
              <input
                type="text"
                name="middleName"
                value={selectedPatient.middleName}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#F8F2DE' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#A31D1D',
                }}
              >
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={selectedPatient.lastName}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#F8F2DE' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#A31D1D',
                }}
              >
                Suffix
              </label>
              <input
                type="text"
                name="suffix"
                value={selectedPatient.suffix}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#F8F2DE' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#A31D1D',
                }}
              >
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={selectedPatient.dateOfBirth}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#F8F2DE' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#A31D1D',
                }}
              >
                Sex
              </label>
              <select
                name="gender"
                value={selectedPatient.gender}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#F8F2DE' : 'white',
                }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#A31D1D',
                }}
              >
                Civil Status
              </label>
              <select
                name="civilStatus"
                value={selectedPatient.civilStatus}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#F8F2DE' : 'white',
                }}
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#A31D1D',
                }}
              >
                Nationality
              </label>
              <input
                type="text"
                name="nationality"
                value={selectedPatient.nationality}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#F8F2DE' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#A31D1D',
                }}
              >
                Phone Number{' '}
                {modalType === 'edit' && (
                  <span style={{ color: '#A31D1D' }}>*</span>
                )}
              </label>
              <input
                type="tel"
                name="phone"
                value={selectedPatient.phone}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#F8F2DE' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#A31D1D',
                }}
              >
                Email{' '}
                {modalType === 'edit' && (
                  <span style={{ color: '#A31D1D' }}>*</span>
                )}
              </label>
              <input
                type="email"
                name="email"
                value={selectedPatient.email}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#F8F2DE' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#A31D1D',
                }}
              >
                Current City
              </label>
              <input
                type="text"
                name="city"
                value={selectedPatient.city}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#F8F2DE' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#A31D1D',
                }}
              >
                Province
              </label>
              <input
                type="text"
                name="province"
                value={selectedPatient.address?.province || ''}
                onChange={(e) => {
                  setSelectedPatient({
                    ...selectedPatient,
                    address: {
                      ...selectedPatient.address,
                      province: e.target.value,
                    },
                  });
                }}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#F8F2DE' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#A31D1D',
                }}
              >
                UIC
              </label>
              <input
                type="text"
                value={selectedPatient.uic}
                disabled={true}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: '#F8F2DE',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#A31D1D',
                }}
              >
                PhilHealth No.
              </label>
              <input
                type="text"
                name="philhealthNo"
                value={selectedPatient.philhealthNo || ''}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#F8F2DE' : 'white',
                }}
              />
            </div>
          </div>

          {modalType === 'view' && (
            <div style={{ marginTop: '20px' }}>
              <h3
                style={{
                  margin: '0 0 10px 0',
                  fontSize: '16px',
                  color: '#A31D1D',
                }}
              >
                Medical Information
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '15px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#A31D1D',
                    }}
                  >
                    Risk Level
                  </label>
                  <div
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      background: '#F8F2DE',
                      fontSize: '14px',
                    }}
                  >
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: getRiskLevelColor(
                          selectedPatient.riskLevel
                        ),
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {selectedPatient.riskLevel}
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#A31D1D',
                    }}
                  >
                    Last Visit
                  </label>
                  <div
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      background: '#F8F2DE',
                      fontSize: '14px',
                    }}
                  >
                    {selectedPatient.lastVisit}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#A31D1D',
                    }}
                  >
                    Facility
                  </label>
                  <div
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      background: '#F8F2DE',
                      fontSize: '14px',
                    }}
                  >
                    {selectedPatient.facilityName || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '20px',
              borderTop: '1px solid #e9ecef',
              paddingTop: '15px',
            }}
          >
            {modalType === 'view' ? (
              <>
                <button
                  onClick={() => {
                    setModalType('edit');
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#F8F2DE',
                    color: '#A31D1D',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '500',
                  }}
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#A31D1D',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#F8F2DE',
                    color: '#A31D1D',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePatient}
                  style={{
                    padding: '8px 16px',
                    background: '#D84040',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Update Patient
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderArpaModal = () => {
    if (!selectedPatient) return null;

    const { arpaData } = selectedPatient;

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
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #e9ecef',
              paddingBottom: '15px',
            }}
          >
            <h2 style={{ margin: 0, color: '#A31D1D', fontWeight: 'bold' }}>
              ARPA Risk Assessment - {selectedPatient.firstName}{' '}
              {selectedPatient.lastName}
            </h2>
            <button
              onClick={() => setShowArpaModal(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <X size={24} color="#A31D1D" />
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '30px',
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
            }}
          >
            <div>
              <h3
                style={{
                  margin: '0 0 10px 0',
                  fontSize: '18px',
                  color: getRiskLevelColor(arpaData.riskLevel),
                }}
              >
                Risk Level: {arpaData.riskLevel}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#A31D1D',
                  }}
                >
                  {arpaData.compliancePercentage}%
                </span>
                <span style={{ marginLeft: '10px', color: '#A31D1D' }}>
                  Compliance Rate
                </span>
              </div>
            </div>
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: `conic-gradient(
                  ${getRiskLevelColor(arpaData.riskLevel)} 0% ${
                  arpaData.compliancePercentage
                }%,
                  #e9ecef ${arpaData.compliancePercentage}% 100%
                )`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold',
                }}
              >
                {arpaData.compliancePercentage}%
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#A31D1D', fontWeight: 'bold' }}>
              Risk Components
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#A31D1D' }}>
                    Missed Medications
                  </span>
                  <span style={{ fontSize: '14px', color: '#A31D1D' }}>
                    {arpaData.riskComponents.missedMedications}/100
                  </span>
                </div>
                <div
                  style={{
                    height: '10px',
                    background: '#e9ecef',
                    borderRadius: '5px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${arpaData.riskComponents.missedMedications}%`,
                      background: getRiskLevelColor(arpaData.riskLevel),
                    }}
                  />
                </div>
              </div>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#A31D1D' }}>
                    Missed Appointments
                  </span>
                  <span style={{ fontSize: '14px', color: '#A31D1D' }}>
                    {arpaData.riskComponents.missedAppointments}/100
                  </span>
                </div>
                <div
                  style={{
                    height: '10px',
                    background: '#e9ecef',
                    borderRadius: '5px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${arpaData.riskComponents.missedAppointments}%`,
                      background: getRiskLevelColor(arpaData.riskLevel),
                    }}
                  />
                </div>
              </div>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#A31D1D' }}>
                    Lab Compliance
                  </span>
                  <span style={{ fontSize: '14px', color: '#A31D1D' }}>
                    {arpaData.riskComponents.labCompliance}/100
                  </span>
                </div>
                <div
                  style={{
                    height: '10px',
                    background: '#e9ecef',
                    borderRadius: '5px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${arpaData.riskComponents.labCompliance}%`,
                      background: getRiskLevelColor(arpaData.riskLevel),
                    }}
                  />
                </div>
              </div>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#A31D1D' }}>
                    Time Since Last Visit
                  </span>
                  <span style={{ fontSize: '14px', color: '#A31D1D' }}>
                    {arpaData.riskComponents.timeSinceLastVisit}/100
                  </span>
                </div>
                <div
                  style={{
                    height: '10px',
                    background: '#e9ecef',
                    borderRadius: '5px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${arpaData.riskComponents.timeSinceLastVisit}%`,
                      background: getRiskLevelColor(arpaData.riskLevel),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#A31D1D', fontWeight: 'bold' }}>
              Recommendations
            </h3>
            <div
              style={{
                padding: '15px',
                background: '#F8F2DE',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#A31D1D',
              }}
            >
              {arpaData.recommendations}
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#A31D1D', fontWeight: 'bold' }}>
              Risk Trend (Last 6 Months)
            </h3>
            <div
              style={{
                height: '200px',
                position: 'relative',
                  background: '#F8F2DE',
                  borderRadius: '8px',
                  padding: '10px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '10px',
                  height: 'calc(100% - 20px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#6c757d',
                }}
              >
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>

              <div
                style={{
                  height: '100%',
                  borderLeft: '1px solid #e9ecef',
                  borderBottom: '1px solid #e9ecef',
                  position: 'relative',
                  paddingLeft: '30px',
                  marginLeft: '20px',
                }}
              >
                {arpaData.riskTrend.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      left: `${index * 16.66}%`,
                      width: '10%',
                      height: `${item.value}%`,
                      background: getRiskLevelColor(arpaData.riskLevel),
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                ))}

                <div
                  style={{
                    position: 'absolute',
                    bottom: '-25px',
                    left: '0',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#A31D1D',
                  }}
                >
                  {arpaData.riskTrend.map((item, index) => (
                    <span
                      key={index}
                      style={{ width: '16.66%', textAlign: 'center' }}
                    >
                      {item.month}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '20px',
              borderTop: '1px solid #e9ecef',
              paddingTop: '15px',
            }}
          >
            <button
              onClick={() => setShowArpaModal(false)}
              style={{
                padding: '8px 16px',
                    background: '#ECDCBF',
                    color: '#A31D1D',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Close
            </button>
            <button
              style={{
                padding: '8px 16px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500',
              }}
            >
              <TrendingUp size={16} />
              Update Assessment
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: 'white',
        minHeight: '100vh',
        paddingTop: '100px',
      }}
    >
      {/* Header with Title */}
      <div style={{ 
        marginBottom: '30px', 
        background: 'linear-gradient(to right, #D84040, #A31D1D)', 
        padding: '30px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 15px rgba(216, 64, 64, 0.2)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>Patient Management</h2>
            <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>Manage patient records and information</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleAddPatient}
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
              Add New Patient
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={18}
            color="#A31D1D"
            style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 15px 10px 45px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              width: '100%',
              background: 'white',
              fontSize: '14px',
            }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter
            size={18}
            color="#A31D1D"
            style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            style={{
              padding: '10px 15px 10px 45px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              appearance: 'none',
              background: 'white',
              paddingRight: '30px',
              fontSize: '14px',
            }}
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div
          style={{
            display: 'flex',
            background: '#ECDCBF',
            borderRadius: '4px',
            padding: '2px',
          }}
        >
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '8px 12px',
              background: viewMode === 'grid' ? '#D84040' : 'transparent',
              color: viewMode === 'grid' ? 'white' : '#A31D1D',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
          >
            <Grid size={16} />
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 12px',
              background: viewMode === 'list' ? '#D84040' : 'transparent',
              color: viewMode === 'list' ? 'white' : '#A31D1D',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
          >
            <List size={16} />
            List
          </button>
        </div>
      </div>

      {renderPatientList()}

      {showModal && renderPatientModal()}

      {showArpaModal && renderArpaModal()}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor:
              toast.type === 'success'
                ? '#28a745'
                : toast.type === 'error'
                ? '#A31D1D'
                : '#D84040',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '4px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            animation: 'slideIn 0.3s ease',
            zIndex: 9999,
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
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Patients;
