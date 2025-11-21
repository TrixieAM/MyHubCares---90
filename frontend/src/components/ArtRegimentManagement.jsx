// web/src/pages/ARTRegimenManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Pill,
  Calendar,
  User,
  Clock,
  Activity,
} from 'lucide-react';

const ARTRegimenManagement = () => {
  const [regimens, setRegimens] = useState([]);
  const [patients, setPatients] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedRegimen, setSelectedRegimen] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'view', 'stop'
  const [toast, setToast] = useState(null);
  const [drugItems, setDrugItems] = useState([{}]);

  // Dummy data
  useEffect(() => {
    // Dummy patients
    const dummyPatients = [
      { id: 1, firstName: 'John', lastName: 'Doe' },
      { id: 2, firstName: 'Maria', lastName: 'Santos' },
      { id: 3, firstName: 'Carlos', lastName: 'Rodriguez' },
      { id: 4, firstName: 'Ana', lastName: 'Lopez' },
      { id: 5, firstName: 'Roberto', lastName: 'Garcia' },
    ];

    // Dummy inventory
    const dummyInventory = [
      { id: 1, drugName: 'Tenofovir/Lamivudine/Dolutegravir (TLD)' },
      { id: 2, drugName: 'Efavirenz 600mg' },
      { id: 3, drugName: 'Atazanavir 300mg' },
      { id: 4, drugName: 'Ritonavir 100mg' },
      { id: 5, drugName: 'Cotrimoxazole 960mg' },
    ];

    // Dummy regimens
    const dummyRegimens = [
      {
        id: 1,
        patientId: 1,
        startDate: '2025-01-15',
        stopDate: null,
        status: 'active',
        drugs: [
          {
            drugName: 'Tenofovir/Lamivudine/Dolutegravir (TLD)',
            dose: '1 tablet',
            pillsPerDay: 1,
            pillsDispensed: 30,
            pillsRemaining: 15,
            missedDoses: 2,
          },
        ],
        notes: 'Patient responding well to treatment',
        createdAt: '2025-01-15T10:00:00Z',
      },
      {
        id: 2,
        patientId: 2,
        startDate: '2025-02-20',
        stopDate: null,
        status: 'active',
        drugs: [
          {
            drugName: 'Efavirenz 600mg',
            dose: '1 tablet',
            pillsPerDay: 1,
            pillsDispensed: 30,
            pillsRemaining: 10,
            missedDoses: 1,
          },
          {
            drugName: 'Tenofovir/Lamivudine',
            dose: '1 tablet',
            pillsPerDay: 1,
            pillsDispensed: 30,
            pillsRemaining: 12,
            missedDoses: 0,
          },
        ],
        notes: 'Monthly refill',
        createdAt: '2025-02-20T14:30:00Z',
      },
      {
        id: 3,
        patientId: 3,
        startDate: '2024-12-10',
        stopDate: '2025-03-15',
        status: 'changed',
        drugs: [
          {
            drugName: 'Atazanavir 300mg',
            dose: '2 tablets',
            pillsPerDay: 2,
            pillsDispensed: 60,
            pillsRemaining: 0,
            missedDoses: 5,
          },
        ],
        notes: 'Changed to TLD due to side effects',
        stopReason: 'Adverse reaction',
        createdAt: '2024-12-10T09:00:00Z',
      },
    ];

    setPatients(dummyPatients);
    setInventory(dummyInventory);
    setRegimens(dummyRegimens);
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

  // Filter regimens
  const getFilteredRegimens = () => {
    let filtered = regimens;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((regimen) => {
        const patient = patients.find((p) => p.id === regimen.patientId);
        const patientName = patient
          ? `${patient.firstName} ${patient.lastName}`.toLowerCase()
          : '';
        return patientName.includes(searchTerm.toLowerCase());
      });
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((regimen) => regimen.status === filterStatus);
    }

    return filtered;
  };

  // Show add regimen modal
  const handleShowAddRegimenModal = () => {
    setSelectedRegimen(null);
    setModalMode('add');
    setDrugItems([{}]);
    setShowModal(true);
  };

  // Show view regimen modal
  const handleShowViewRegimenModal = (regimenId) => {
    const regimen = regimens.find((r) => r.id === regimenId);
    if (regimen) {
      setSelectedRegimen(regimen);
      setModalMode('view');
      setShowModal(true);
    }
  };

  // Show stop regimen modal
  const handleShowStopRegimenModal = (regimenId) => {
    const regimen = regimens.find((r) => r.id === regimenId);
    if (regimen) {
      setSelectedRegimen(regimen);
      setModalMode('stop');
      setShowModal(true);
    }
  };

  // Add drug field
  const handleAddDrugField = () => {
    setDrugItems([...drugItems, {}]);
  };

  // Remove drug field
  const handleRemoveDrugField = (index) => {
    const newDrugItems = [...drugItems];
    newDrugItems.splice(index, 1);
    setDrugItems(newDrugItems);
  };

  // Add regimen
  const handleAddRegimen = (formData) => {
    const newRegimen = {
      id: regimens.length > 0 ? Math.max(...regimens.map((r) => r.id)) + 1 : 1,
      patientId: parseInt(formData.patientId),
      startDate: formData.startDate,
      stopDate: null,
      status: 'active',
      drugs: formData.drugs,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    setRegimens([...regimens, newRegimen]);
    setToast({
      message: 'ART regimen started successfully',
      type: 'success',
    });
    setShowModal(false);
  };

  // Stop regimen
  const handleStopRegimen = (formData) => {
    const updatedRegimens = regimens.map((regimen) =>
      regimen.id === selectedRegimen.id
        ? {
            ...regimen,
            status: formData.action,
            stopDate: formData.stopDate,
            stopReason: formData.stopReason,
            updatedAt: new Date().toISOString(),
          }
        : regimen
    );

    setRegimens(updatedRegimens);
    setToast({
      message: 'ART regimen updated successfully',
      type: 'success',
    });
    setShowModal(false);
  };

  // Calculate days on ART
  const calculateDaysOnART = (startDate, stopDate) => {
    const start = new Date(startDate);
    const end = stopDate ? new Date(stopDate) : new Date();
    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
  };

  // Render regimen list
  const renderRegimenList = () => {
    const filteredRegimens = getFilteredRegimens();

    if (filteredRegimens.length === 0) {
      return (
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          No ART regimens found
        </p>
      );
    }

    return filteredRegimens.map((regimen) => {
      const patient = patients.find((p) => p.id === regimen.patientId);
      const daysOnART = calculateDaysOnART(regimen.startDate, regimen.stopDate);

      let statusColor = '#28a745';
      if (regimen.status === 'stopped') statusColor = '#dc3545';
      if (regimen.status === 'changed') statusColor = '#ffc107';

      return (
        <div
          key={regimen.id}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '15px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: `4px solid ${statusColor}`,
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
                  margin: '0 0 10px 0',
                  color: '#333',
                  fontSize: '18px',
                }}
              >
                {patient ? `${patient.firstName} ${patient.lastName}` : 'N/A'}
              </h3>
              <div
                style={{
                  fontSize: '14px',
                  color: '#6c757d',
                  marginBottom: '10px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '15px',
                }}
              >
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Calendar size={14} />
                  Started: {new Date(regimen.startDate).toLocaleDateString()}
                </span>
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Clock size={14} />
                  {daysOnART} days on ART
                </span>
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Pill size={14} />
                  {regimen.drugs ? regimen.drugs.length : 0} medications
                </span>
              </div>
              {regimen.notes && (
                <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
                  <strong>Notes:</strong> {regimen.notes}
                </p>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '10px',
                marginLeft: '20px',
              }}
            >
              <div style={{ display: 'flex', gap: '10px' }}>
                <span
                  style={{
                    background: statusColor,
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'capitalize',
                  }}
                >
                  {regimen.status}
                </span>
                <button
                  onClick={() => handleShowViewRegimenModal(regimen.id)}
                  style={{
                    padding: '6px 12px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  View
                </button>
                {regimen.status === 'active' && (
                  <button
                    onClick={() => handleShowStopRegimenModal(regimen.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#ffc107',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Stop/Change
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    });
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
            <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>ART Regimen Management</h2>
            <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>Manage antiretroviral therapy regimens and adherence</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleShowAddRegimenModal}
              style={{
                padding: '10px 16px',
                background: '#ECDCBF',
                color: '#A31D1D',
                border: 'none',
                borderRadius: '12px',
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
              Start New Regimen
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter - Now in 2 rows */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <Search
            size={18}
            color="#6c757d"
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <input
            type="text"
            placeholder="Search regimens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px 8px 36px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              width: '100%',
            }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter
            size={18}
            color="#6c757d"
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 12px 8px 36px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              appearance: 'none',
              width: '100%',
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="stopped">Stopped</option>
            <option value="changed">Changed</option>
          </select>
        </div>
      </div>

      {/* Regimen List */}
      <div style={{ width: '100%' }}>{renderRegimenList()}</div>

      {/* Modal */}
      {showModal && (
        <RegimenModal
          mode={modalMode}
          regimen={selectedRegimen}
          patients={patients}
          inventory={inventory}
          drugItems={drugItems}
          onClose={() => setShowModal(false)}
          onAdd={handleAddRegimen}
          onStop={handleStopRegimen}
          onAddDrug={handleAddDrugField}
          onRemoveDrug={handleRemoveDrugField}
        />
      )}

      {/* Toast Notification */}
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
                ? '#dc3545'
                : '#17a2b8',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            animation: 'slideIn 0.3s ease',
            zIndex: 9999,
          }}
        >
          {toast.type === 'success' ? (
            <Check size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span style={{ fontSize: '14px' }}>{toast.message}</span>
        </div>
      )}

      {/* Add keyframes for animation */}
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

const RegimenModal = ({
  mode,
  regimen,
  patients,
  inventory,
  drugItems,
  onClose,
  onAdd,
  onStop,
  onAddDrug,
  onRemoveDrug,
}) => {
  const [formData, setFormData] = useState(
    regimen || {
      patientId: '',
      startDate: new Date().toISOString().split('T')[0],
      drugs: [{}],
      notes: '',
    }
  );

  const [stopFormData, setStopFormData] = useState({
    action: 'stopped',
    stopDate: new Date().toISOString().split('T')[0],
    stopReason: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'add') {
      // Collect drug data
      const drugElements = document.querySelectorAll('.drug-item');
      const drugs = [];

      drugElements.forEach((item) => {
        const drugName = item.querySelector('.drugName')?.value;
        const dose = item.querySelector('.dose')?.value;
        const pillsPerDay = item.querySelector('.pillsPerDay')?.value;
        const pillsDispensed = item.querySelector('.pillsDispensed')?.value;

        if (drugName && dose && pillsPerDay) {
          drugs.push({
            drugName,
            dose,
            pillsPerDay: parseInt(pillsPerDay),
            pillsDispensed: parseInt(pillsDispensed) || 0,
            pillsRemaining: parseInt(pillsDispensed) || 0,
            missedDoses: 0,
          });
        }
      });

      onAdd({
        ...formData,
        drugs,
      });
    } else if (mode === 'stop') {
      onStop(stopFormData);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleStopChange = (e) => {
    setStopFormData({
      ...stopFormData,
      [e.target.name]: e.target.value,
    });
  };

  if (mode === 'view') {
    const patient = patients.find((p) => p.id === regimen.patientId);

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
            maxHeight: 'calc(100vh - 104px)',
            overflow: 'auto',
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
            <h2 style={{ margin: 0 }}>ART Regimen Details</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '4px',
              }}
            >
              <X size={24} color="#6c757d" />
            </button>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
                color: '#6c757d',
              }}
            >
              Patient Name
            </label>
            <input
              type="text"
              value={
                patient ? `${patient.firstName} ${patient.lastName}` : 'N/A'
              }
              readOnly
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Start Date
              </label>
              <input
                type="date"
                value={regimen.startDate}
                readOnly
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Status
              </label>
              <input
                type="text"
                value={regimen.status}
                readOnly
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                  textTransform: 'capitalize',
                }}
              />
            </div>
          </div>

          {regimen.stopDate && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#6c757d',
                  }}
                >
                  Stop Date
                </label>
                <input
                  type="date"
                  value={regimen.stopDate}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#6c757d',
                  }}
                >
                  Stop Reason
                </label>
                <input
                  type="text"
                  value={regimen.stopReason || 'N/A'}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                  }}
                />
              </div>
            </div>
          )}

          <h4 style={{ margin: '20px 0 10px 0' }}>Medications</h4>
          {regimen.drugs.map((drug, index) => (
            <div
              key={index}
              style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '10px',
              }}
            >
              <h5 style={{ margin: '0 0 10px 0' }}>
                {index + 1}. {drug.drugName}
              </h5>
              <div
                style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: 'bold',
                      color: '#6c757d',
                    }}
                  >
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={drug.dose}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: 'bold',
                      color: '#6c757d',
                    }}
                  >
                    Pills/Day
                  </label>
                  <input
                    type="text"
                    value={drug.pillsPerDay}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: 'bold',
                      color: '#6c757d',
                    }}
                  >
                    Pills Remaining
                  </label>
                  <input
                    type="text"
                    value={drug.pillsRemaining || 0}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: 'bold',
                      color: '#6c757d',
                    }}
                  >
                    Missed Doses
                  </label>
                  <input
                    type="text"
                    value={drug.missedDoses || 0}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          {regimen.notes && (
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Clinical Notes
              </label>
              <textarea
                value={regimen.notes}
                readOnly
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              />
            </div>
          )}

          <div
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
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
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'stop') {
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
            maxWidth: '500px',
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
            <h2 style={{ margin: 0 }}>Stop/Change ART Regimen</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '4px',
              }}
            >
              <X size={24} color="#6c757d" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Action <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="action"
                value={stopFormData.action}
                onChange={handleStopChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              >
                <option value="stopped">Stop Regimen</option>
                <option value="changed">Change Regimen</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Date <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                name="stopDate"
                value={stopFormData.stopDate}
                onChange={handleStopChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Reason <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                name="stopReason"
                value={stopFormData.stopReason}
                onChange={handleStopChange}
                required
                rows="3"
                placeholder="Enter reason for stopping/changing regimen..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
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
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
          maxHeight: 'calc(100vh - 104px)',
          overflow: 'auto',
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
          <h2 style={{ margin: 0 }}>Start ART Regimen</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '4px',
            }}
          >
            <X size={24} color="#6c757d" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              Patient <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            >
              <option value="">Select Patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              Start Date <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            />
          </div>

          <h4 style={{ margin: '20px 0 10px 0' }}>ART Medications</h4>
          <div id="drugsContainer">
            {drugItems.map((_, index) => (
              <div
                key={index}
                className="drug-item"
                style={{
                  background: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  position: 'relative',
                }}
              >
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => onRemoveDrug(index)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '5px',
                      borderRadius: '4px',
                    }}
                  >
                    <X size={16} color="#dc3545" />
                  </button>
                )}
                <div style={{ marginBottom: '15px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: 'bold',
                    }}
                  >
                    Drug Name <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    className="drugName"
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                    }}
                  >
                    <option value="">Select Drug</option>
                    {inventory.map((item) => (
                      <option key={item.id} value={item.drugName}>
                        {item.drugName}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '5px',
                        fontWeight: 'bold',
                      }}
                    >
                      Dosage <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="dose"
                      placeholder="e.g., 1 tablet"
                      required
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '5px',
                        fontWeight: 'bold',
                      }}
                    >
                      Pills per Day <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="number"
                      className="pillsPerDay"
                      min="1"
                      defaultValue="1"
                      required
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: 'bold',
                    }}
                  >
                    Initial Pills Dispensed
                  </label>
                  <input
                    type="number"
                    className="pillsDispensed"
                    min="0"
                    defaultValue="30"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onAddDrug}
            style={{
              padding: '8px 16px',
              background: '#f8f9fa',
              color: '#007bff',
              border: '1px solid #007bff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '20px',
            }}
          >
            + Add Another Drug
          </button>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              Clinical Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Enter regimen notes..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            />
          </div>

          <div
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
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
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Start Regimen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ARTRegimenManagement;