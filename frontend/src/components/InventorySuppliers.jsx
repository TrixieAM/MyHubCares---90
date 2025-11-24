import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Check } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const InventorySuppliers = ({ socket }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/inventory/suppliers`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await response.json();

      if (data.success) {
        setSuppliers(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setToast({ message: 'Failed to fetch suppliers: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const supplierData = {
      supplier_name: formData.get('supplier_name'),
      contact_person: formData.get('contact_person') || null,
      contact_phone: formData.get('contact_phone') || null,
      contact_email: formData.get('contact_email') || null,
      payment_terms: formData.get('payment_terms') || null,
      is_active: formData.get('is_active') === 'true',
    };

    try {
      const token = localStorage.getItem('token');
      const url = editingSupplier
        ? `${API_BASE_URL}/inventory/suppliers/${editingSupplier.supplier_id}`
        : `${API_BASE_URL}/inventory/suppliers`;
      const method = editingSupplier ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(supplierData),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: editingSupplier ? 'Supplier updated successfully' : 'Supplier created successfully',
          type: 'success',
        });
        setShowModal(false);
        setEditingSupplier(null);
        fetchSuppliers();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      setToast({ message: 'Failed to save supplier: ' + error.message, type: 'error' });
    }
  };

  const handleDelete = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/inventory/suppliers/${supplierId}`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();

      if (data.success) {
        setToast({ message: 'Supplier deleted successfully', type: 'success' });
        fetchSuppliers();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      setToast({ message: 'Failed to delete supplier: ' + error.message, type: 'error' });
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.contact_email && supplier.contact_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh', paddingTop: '100px' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '30px', 
        background: 'linear-gradient(to right, #D84040, #A31D1D)', 
        padding: '30px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 15px rgba(216, 64, 64, 0.2)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
              Suppliers Management
            </h2>
            <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>
              Manage inventory suppliers and vendors
            </p>
          </div>
          <button
            onClick={() => {
              setEditingSupplier(null);
              setShowModal(true);
            }}
            style={{
              padding: '10px 16px',
              background: '#ECDCBF',
              color: '#A31D1D',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Plus size={16} />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
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
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px 8px 36px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '400px',
            }}
          />
        </div>
      </div>

      {/* Suppliers List */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>Loading suppliers...</p>
        ) : filteredSuppliers.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
            No suppliers found
          </p>
        ) : (
          filteredSuppliers.map((supplier) => (
            <div
              key={supplier.supplier_id}
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                    {supplier.supplier_name}
                  </h3>
                  {supplier.is_active === 0 && (
                    <span style={{ padding: '2px 8px', background: '#dc3545', color: 'white', borderRadius: '4px', fontSize: '12px' }}>
                      Inactive
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>
                  {supplier.contact_person && <div>Contact: {supplier.contact_person}</div>}
                  {supplier.contact_phone && <div>Phone: {supplier.contact_phone}</div>}
                  {supplier.contact_email && <div>Email: {supplier.contact_email}</div>}
                  {supplier.payment_terms && <div>Payment Terms: {supplier.payment_terms}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setEditingSupplier(supplier);
                    setShowModal(true);
                  }}
                  style={{
                    padding: '8px 12px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(supplier.supplier_id)}
                  style={{
                    padding: '8px 12px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
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
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>
                {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingSupplier(null);
                }}
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

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Supplier Name <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  name="supplier_name"
                  required
                  defaultValue={editingSupplier?.supplier_name}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contact_person"
                  defaultValue={editingSupplier?.contact_person}
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
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Phone
                  </label>
                  <input
                    type="text"
                    name="contact_phone"
                    defaultValue={editingSupplier?.contact_phone}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    defaultValue={editingSupplier?.contact_email}
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
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Payment Terms
                </label>
                <input
                  type="text"
                  name="payment_terms"
                  placeholder="e.g., Net 30, COD"
                  defaultValue={editingSupplier?.payment_terms}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                  }}
                />
              </div>

              {editingSupplier && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Status
                  </label>
                  <select
                    name="is_active"
                    defaultValue={editingSupplier.is_active ? 'true' : 'false'}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                    }}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSupplier(null);
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
                  {editingSupplier ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: toast.type === 'success' ? '#28a745' : '#dc3545',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 9999,
          }}
        >
          {toast.type === 'success' ? <Check size={20} /> : <X size={20} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default InventorySuppliers;

