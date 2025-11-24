import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Search, Filter, AlertCircle, Edit, Package } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [restockingItem, setRestockingItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [medications, setMedications] = useState([]);

  useEffect(() => {
    fetchInventory();
    fetchMedications();
  }, []);
  

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/inventory`);
      const data = await response.json();

      if (data.success) {
        setInventory(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setToast({
        message: 'Failed to fetch inventory: ' + error.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMedications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/medications`);
      const data = await response.json();

      if (data.success) {
        setMedications(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
      setToast({
        message: 'Failed to fetch medications: ' + error.message,
        type: 'error',
      });
    }
  };

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleShowAddItemModal = () => {
    setShowModal(true);
  };

  const handleAddItem = async (itemData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(itemData),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Inventory item added successfully',
          type: 'success',
        });
        setShowModal(false);
        fetchInventory(); // Refresh inventory list
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error adding inventory item:', error);
      setToast({
        message: 'Failed to add inventory item: ' + error.message,
        type: 'error',
      });
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleUpdateItem = async (itemData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/inventory/${editingItem.inventory_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(itemData),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Inventory item updated successfully',
          type: 'success',
        });
        setShowEditModal(false);
        setEditingItem(null);
        fetchInventory(); // Refresh inventory list
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error updating inventory item:', error);
      setToast({
        message: 'Failed to update inventory item: ' + error.message,
        type: 'error',
      });
    }
  };

  const handleRestockItem = (item) => {
    setRestockingItem(item);
    setShowRestockModal(true);
  };

  const handleRestock = async (quantity) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/inventory/${restockingItem.inventory_id}/restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ quantity: parseInt(quantity) }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Inventory item restocked successfully',
          type: 'success',
        });
        setShowRestockModal(false);
        setRestockingItem(null);
        fetchInventory(); // Refresh inventory list
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error restocking inventory item:', error);
      setToast({
        message: 'Failed to restock inventory item: ' + error.message,
        type: 'error',
      });
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/inventory/${itemId}`, {
          method: 'DELETE',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        const data = await response.json();

        if (data.success) {
          setToast({
            message: 'Inventory item deleted successfully',
            type: 'success',
          });
          fetchInventory(); // Refresh inventory list
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        setToast({
          message: 'Failed to delete inventory item: ' + error.message,
          type: 'error',
        });
      }
    }
  };


  const getFilteredInventory = () => {
    let filtered = inventory;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.medication_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.facility_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType === 'low') {
      filtered = filtered.filter(
        (item) => item.quantity_on_hand <= item.reorder_level
      );
    } else if (filterType === 'expiring') {
      filtered = filtered.filter((item) => {
        const expiryDate = new Date(item.expiry_date);
        const monthsUntilExpiry =
          (expiryDate - new Date()) / (1000 * 60 * 60 * 24 * 30);
        return monthsUntilExpiry < 3;
      });
    }

    return filtered;
  };

  const renderInventoryGrid = () => {
    const filteredInventory = getFilteredInventory();

    if (loading) {
      return (
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          Loading inventory...
        </p>
      );
    }

    if (filteredInventory.length === 0) {
      return (
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          No inventory items found
        </p>
      );
    }

    return filteredInventory.map((item) => {
      const isLowStock = item.quantity_on_hand <= item.reorder_level;
      const expiryDate = new Date(item.expiry_date);
      const monthsUntilExpiry =
        (expiryDate - new Date()) / (1000 * 60 * 60 * 24 * 30);
      const isExpiringSoon = monthsUntilExpiry < 3;

      return (
        <div
          key={item.inventory_id}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '15px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: isLowStock ? '1px solid #dc3545' : 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '10px',
            }}
          >
            <h3 style={{ margin: 0, color: '#333', fontSize: '16px' }}>
              {item.medication_name}
            </h3>
            <div style={{ display: 'flex', gap: '5px' }}>
              {isLowStock && (
                <span
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <AlertCircle size={12} />
                  LOW STOCK
                </span>
              )}
              {isExpiringSoon && (
                <span
                  style={{
                    background: '#ffc107',
                    color: '#333',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  EXPIRING SOON
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: isLowStock ? '#dc3545' : '#007bff',
              marginBottom: '10px',
            }}
          >
            {item.quantity_on_hand} {item.unit}
          </div>

          <div
            style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}
          >
            <strong>Reorder Level:</strong> {item.reorder_level} {item.unit}
          </div>

          <div
            style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}
          >
            <strong>Expiry:</strong>{' '}
            {new Date(item.expiry_date).toLocaleDateString()}
          </div>

          <div
            style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}
          >
            <strong>Facility:</strong> {item.facility_name}
          </div>

          <div
            style={{ fontSize: '14px', color: '#6c757d', marginBottom: '15px' }}
          >
            <strong>Supplier:</strong> {item.supplier}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleEditItem(item)}
              style={{
                padding: '6px 12px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Edit size={14} />
              Edit
            </button>
            <button
              onClick={() => handleRestockItem(item)}
              style={{
                padding: '6px 12px',
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Package size={14} />
              Restock
            </button>
            <button
              onClick={() => handleDeleteItem(item.inventory_id)}
              style={{
                padding: '6px 12px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Delete
            </button>
          </div>
        </div>
      );
    });
  };

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh', paddingTop: '100px' }}>
      {/* Header with Title - Consistent with Patients.jsx */}
      <div style={{ 
        marginBottom: '30px', 
        background: 'linear-gradient(to right, #D84040, #A31D1D)', 
        padding: '30px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 15px rgba(216, 64, 64, 0.2)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>Inventory Management</h2>
            <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>Manage medication stock and supplies</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleShowAddItemModal}
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
              Add New Item
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
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
            placeholder="Search inventory..."
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '8px 12px 8px 36px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              appearance: 'none',
            }}
          >
            <option value="all">All Items</option>
            <option value="low">Low Stock</option>
            <option value="expiring">Expiring Soon</option>
          </select>
        </div>
      </div>

      {/* Inventory Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '20px',
        }}
      >
        {renderInventoryGrid()}
      </div>

      {/* Edit Item Modal */}
      {showEditModal && editingItem && (
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
              <h2 style={{ margin: 0 }}>Edit Inventory Item</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
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

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const itemData = {
                  quantity_on_hand: editingItem.quantity_on_hand, // Keep current value, not editable
                  unit: formData.get('unit'),
                  expiry_date: formData.get('expiry_date'),
                  reorder_level: formData.get('reorder_level'),
                  supplier: formData.get('supplier'),
                };
                handleUpdateItem(itemData);
              }}
            >
              <div style={{ marginBottom: '15px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                  }}
                >
                  Drug Name
                </label>
                <input
                  type="text"
                  value={editingItem.medication_name}
                  disabled
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    background: '#e9ecef',
                    color: '#6c757d',
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
                    }}
                  >
                    Stock Quantity
                  </label>
                  <input
                    type="text"
                    value={`${editingItem.quantity_on_hand} ${editingItem.unit}`}
                    disabled
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      background: '#e9ecef',
                      color: '#6c757d',
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
                    Unit <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    name="unit"
                    required
                    defaultValue={editingItem.unit}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                    }}
                  >
                    <option value="tablets">Tablets</option>
                    <option value="capsules">Capsules</option>
                    <option value="bottles">Bottles</option>
                    <option value="vials">Vials</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: 'bold',
                    }}
                  >
                    Expiry Date <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="expiry_date"
                    required
                    defaultValue={editingItem.expiry_date ? editingItem.expiry_date.split('T')[0] : ''}
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
                    Reorder Level <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="reorder_level"
                    required
                    min="0"
                    defaultValue={editingItem.reorder_level}
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
                  Supplier <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  name="supplier"
                  required
                  defaultValue={editingItem.supplier}
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
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
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
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Update Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Item Modal */}
      {showRestockModal && restockingItem && (
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
              <h2 style={{ margin: 0 }}>Restock Item</h2>
              <button
                onClick={() => {
                  setShowRestockModal(false);
                  setRestockingItem(null);
                }}
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

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const quantity = formData.get('quantity_to_add');
                handleRestock(quantity);
              }}
            >
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                  }}
                >
                  Drug Name
                </label>
                <input
                  type="text"
                  value={restockingItem.medication_name}
                  disabled
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    background: '#e9ecef',
                    color: '#6c757d',
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
                  Current Stock
                </label>
                <input
                  type="text"
                  value={`${restockingItem.quantity_on_hand} ${restockingItem.unit}`}
                  disabled
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    background: '#e9ecef',
                    color: '#6c757d',
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
                  Quantity to Add <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="number"
                  name="quantity_to_add"
                  required
                  min="1"
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
                  onClick={() => {
                    setShowRestockModal(false);
                    setRestockingItem(null);
                  }}
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
                  Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showModal && (
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
              <h2 style={{ margin: 0 }}>Add Inventory Item</h2>
              <button
                onClick={() => setShowModal(false)}
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

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const itemData = {
                  medication_id: formData.get('medication_id'),
                  quantity_on_hand: parseInt(formData.get('quantity_on_hand')),
                  unit: formData.get('unit'),
                  expiry_date: formData.get('expiry_date') || null,
                  reorder_level: parseInt(formData.get('reorder_level')),
                  supplier: formData.get('supplier') || null,
                  batch_number: formData.get('batch_number') || null,
                  cost_per_unit: formData.get('cost_per_unit')
                    ? parseFloat(formData.get('cost_per_unit'))
                    : null,
                };
                handleAddItem(itemData);
              }}
            >
              <div style={{ marginBottom: '15px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                  }}
                >
                  Medication <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  name="medication_id"
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                  }}
                >
                  <option value="">Select a medication</option>
                  {medications
                    .filter((med) => med.active !== false)
                    .map((med) => (
                      <option key={med.medication_id} value={med.medication_id}>
                        {med.medication_name}
                        {med.generic_name ? ` (${med.generic_name})` : ''}
                        {med.strength ? ` - ${med.strength}` : ''}
                        {med.form ? ` [${med.form}]` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: 'bold',
                    }}
                  >
                    Stock Quantity <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity_on_hand"
                    required
                    min="0"
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
                    Unit <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    name="unit"
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                    }}
                  >
                    <option value="tablets">Tablets</option>
                    <option value="capsules">Capsules</option>
                    <option value="bottles">Bottles</option>
                    <option value="vials">Vials</option>
                  </select>
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
                  Batch Number
                </label>
                <input
                  type="text"
                  name="batch_number"
                  placeholder="Optional batch number"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
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
                    }}
                  >
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiry_date"
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
                    Reorder Level <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="reorder_level"
                    required
                    min="0"
                    defaultValue="0"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: 'bold',
                    }}
                  >
                    Supplier
                  </label>
                  <input
                    type="text"
                    name="supplier"
                    placeholder="Optional supplier name"
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
                    Cost per Unit
                  </label>
                  <input
                    type="number"
                    name="cost_per_unit"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>

              <div
                style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  Add Item
                </button>
              </div>
            </form>
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

export default Inventory;