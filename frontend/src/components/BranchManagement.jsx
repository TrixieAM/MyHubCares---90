// web/src/components/BranchManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Search,
  AlertCircle,
  Edit,
  Trash2,
  Building,
  MapPin,
  Phone,
  ChevronDown,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [regions, setRegions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch branches from API
  const fetchBranches = async () => {
    try {
      setLoading(true);
      // Remove is_active filter to fetch all records
      const response = await fetch(`${API_URL}/facilities`);
      const data = await response.json();
      if (data.success) {
        const mappedBranches = data.data.map((facility) => ({
          id: facility.facility_id,
          branchName: facility.facility_name,
          facilityType: facility.facility_type,
          address: facility.address,
          regionId: facility.region_id,
          regionName: facility.region_name,
          regionCode: facility.region_code,
          contactPerson: facility.contact_person,
          contactNumber: facility.contact_number,
          email: facility.email,
          isActive: facility.is_active === 1 ? 'Active' : 'Inactive', // Display as text
          createdAt: facility.created_at,
          updatedAt: facility.updated_at,
        }));

        setBranches(mappedBranches);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setToast({
        message: 'Failed to load branches',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch regions from API
  const fetchRegions = async () => {
    try {
      const response = await fetch(`${API_URL}/regions?is_active=1`);
      const data = await response.json();
      if (data.success) {
        const mappedRegions = data.data.map((region) => ({
          id: region.region_id,
          name: region.region_name,
          code: region.region_code,
          isActive: region.is_active,
        }));
        setRegions(mappedRegions);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
      setToast({
        message: 'Failed to load regions',
        type: 'error',
      });
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchRegions();
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

  const handleAddBranch = () => {
    setSelectedBranch({
      id: null,
      branchName: '',
      facilityType: 'branch',
      address: {
        street: '',
        city: '',
        province: '',
      },
      regionId: '',
      regionName: '',
      regionCode: '',
      contactPerson: '',
      contactNumber: '',
      email: '',
      isActive: true,
    });
    setModalType('add');
    setShowModal(true);
  };

  const handleEditBranch = (branch) => {
    setSelectedBranch({
      id: branch.id,
      branchName: branch.branchName,
      facilityType: branch.facilityType,
      address: branch.address,
      regionId: branch.regionId,
      regionName: branch.regionName,
      regionCode: branch.regionCode,
      contactPerson: branch.contactPerson,
      contactNumber: branch.contactNumber,
      email: branch.email,
      isActive: branch.isActive,
    });
    setModalType('edit');
    setShowModal(true);
  };

  const handleDeleteBranch = async (branch) => {
    if (
      window.confirm(`Are you sure you want to delete ${branch.branchName}?`)
    ) {
      try {
        const response = await fetch(`${API_URL}/facilities/${branch.id}`, {
          method: 'DELETE',
        });
        const data = await response.json();

        if (data.success) {
          setToast({
            message: 'Branch deleted successfully.',
            type: 'success',
          });
          fetchBranches(); // Refresh list
        } else {
          setToast({
            message: data.message || 'Failed to delete branch',
            type: 'error',
          });
        }
      } catch (error) {
        console.error('Error deleting branch:', error);
        setToast({
          message: 'Failed to delete branch',
          type: 'error',
        });
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setSelectedBranch({
        ...selectedBranch,
        address: {
          ...selectedBranch.address,
          [addressField]: value,
        },
      });
    } else {
      setSelectedBranch({
        ...selectedBranch,
        [name]: value,
      });
    }
  };

  const getFilteredBranches = () => {
    if (!searchTerm) return branches;
    return branches.filter(
      (branch) =>
        branch.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.contactPerson
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        branch.contactNumber?.includes(searchTerm) ||
        branch.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const renderBranchList = () => {
    const filteredBranches = getFilteredBranches();

    if (loading) {
      return (
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '40px' }}>
          Loading branches...
        </p>
      );
    }

    if (filteredBranches.length === 0) {
      return (
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '40px' }}>
          No branches found
        </p>
      );
    }

    return (
      <div
        style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                background: '#f8f9fa',
                borderBottom: '2px solid #dee2e6',
              }}
            >
              <th
                style={{
                  padding: '15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#495057',
                }}
              >
                MYHUBCARES BRANCH
              </th>
              <th
                style={{
                  padding: '15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#495057',
                }}
              >
                ADDRESS
              </th>
              <th
                style={{
                  padding: '15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#495057',
                }}
              >
                REGION
              </th>
              <th
                style={{
                  padding: '15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#495057',
                }}
              >
                CONTACT PERSON
              </th>
              <th
                style={{
                  padding: '15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#495057',
                }}
              >
                CONTACT NUMBER
              </th>
              <th
                style={{
                  padding: '15px',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#495057',
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: '15px',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#495057',
                }}
              >
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredBranches.map((branch) => (
              <tr key={branch.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Building
                      size={20}
                      color="#007bff"
                      style={{ marginRight: '10px' }}
                    />
                    <div>
                      <div style={{ fontWeight: '500', color: '#333' }}>
                        {branch.branchName}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#6c757d',
                          marginTop: '2px',
                        }}
                      >
                        {branch.facilityType}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <MapPin
                      size={16}
                      color="#6c757d"
                      style={{ marginRight: '8px', marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontSize: '14px', color: '#333' }}>
                        {branch.address?.street}
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#6c757d',
                          marginTop: '2px',
                        }}
                      >
                        {branch.address?.city}, {branch.address?.province}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#333' }}>
                    {branch.regionName || '-'}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6c757d',
                      marginTop: '2px',
                    }}
                  >
                    {branch.regionCode || ''}
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#333' }}>
                    {branch.contactPerson || '-'}
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Phone
                      size={14}
                      color="#6c757d"
                      style={{ marginRight: '5px' }}
                    />
                    <span style={{ fontSize: '14px', color: '#333' }}>
                      {branch.contactNumber || '-'}
                    </span>
                  </div>
                </td>
                <td
                  style={{
                    textAlign: 'center',
                    fontWeight: '500',
                    color: branch.isActive === 'Active' ? '#28a745' : '#dc3545',
                    padding: '8px 0',
                  }}
                >
                  {branch.isActive}
                </td>
                <td style={{ padding: '15px' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: '5px',
                      justifyContent: 'center',
                    }}
                  >
                    <button
                      onClick={() => handleEditBranch(branch)}
                      style={{
                        padding: '6px 12px',
                        background: '#ffc107',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Edit"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(branch)}
                      style={{
                        padding: '6px 12px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginLeft: '5px',
                      }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                      Delete
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

  const renderBranchModal = () => {
    if (!selectedBranch) return null;

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
              {modalType === 'add' ? 'Add New Branch' : 'Edit Branch'}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px',
              }}
            >
              <X size={24} color="#6c757d" />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
            }}
          >
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Branch Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="branchName"
                value={selectedBranch.branchName}
                onChange={handleInputChange}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                }}
                placeholder="e.g., My Hub Cares Ortigas Main"
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Facility Type <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="facilityType"
                value={selectedBranch.facilityType}
                onChange={handleInputChange}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                }}
              >
                <option value="main">Main</option>
                <option value="branch">Branch</option>
                <option value="satellite">Satellite</option>
                <option value="external">External</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Region
              </label>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowRegionDropdown(!showRegionDropdown)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    width: '100%',
                    fontSize: '14px',
                    background: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <span>
                    {selectedBranch.regionId
                      ? regions.find((r) => r.id === selectedBranch.regionId)
                          ?.name || 'Select Region'
                      : 'Select Region'}
                  </span>
                  <ChevronDown size={16} />
                </button>
                {showRegionDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      marginTop: '2px',
                      maxHeight: '200px',
                      overflow: 'auto',
                      zIndex: 10,
                    }}
                  >
                    {regions.map((region) => (
                      <div
                        key={region.id}
                        onClick={() => {
                          setSelectedBranch({
                            ...selectedBranch,
                            regionId: region.id,
                            regionName: region.name,
                            regionCode: region.code,
                          });
                          setShowRegionDropdown(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                        onMouseEnter={(e) =>
                          (e.target.style.background = '#f8f9fa')
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.background = 'white')
                        }
                      >
                        {region.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Street Address
              </label>
              <input
                type="text"
                name="address.street"
                value={selectedBranch.address?.street || ''}
                onChange={handleInputChange}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                }}
                placeholder="e.g., Unit 1202, 16th Floor, One San Miguel Avenue"
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                City
              </label>
              <input
                type="text"
                name="address.city"
                value={selectedBranch.address?.city || ''}
                onChange={handleInputChange}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                }}
                placeholder="e.g., Pasig City"
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Province
              </label>
              <input
                type="text"
                name="address.province"
                value={selectedBranch.address?.province || ''}
                onChange={handleInputChange}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                }}
                placeholder="e.g., Metro Manila"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                value={selectedBranch.contactPerson || ''}
                onChange={handleInputChange}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                }}
                placeholder="e.g., Juan Dela Cruz"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Contact Number
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={selectedBranch.contactNumber || ''}
                onChange={handleInputChange}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                }}
                placeholder="e.g., +63 2 1234 5678"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                value={selectedBranch.email || ''}
                onChange={handleInputChange}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                }}
                placeholder="e.g., branch@myhubcares.com"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Status
              </label>
              <select
                name="isActive"
                value={selectedBranch.isActive}
                onChange={(e) =>
                  setSelectedBranch({
                    ...selectedBranch,
                    isActive: e.target.value,
                  })
                }
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                }}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '20px',
            }}
          >
            <button
              onClick={() => setShowModal(false)}
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
              onClick={handleSaveBranch}
              style={{
                padding: '8px 16px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {modalType === 'add' ? 'Add Branch' : 'Update Branch'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', paddingTop: '100px' }}>
      <div
        style={{
          marginBottom: '30px',
          background: 'linear-gradient(to right, #D84040, #A31D1D)',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(216, 64, 64, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>🏢 MyHubCares Branch Management</h2>
            <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>Manage MyHubCares clinic branches and locations</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleAddBranch}
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
                gap: '5px',
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
              Add New Branch
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
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
            placeholder="Search branches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px 8px 36px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              width: '100%',
              fontSize: '14px',
            }}
          />
        </div>
      </div>

      {renderBranchList()}

      {showModal && renderBranchModal()}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            backgroundColor:
              toast.type === 'success'
                ? '#4caf50'
                : toast.type === 'error'
                ? '#f44336'
                : '#1976d2',
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

export default BranchManagement;