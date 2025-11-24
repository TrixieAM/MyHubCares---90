import React, { useState, useEffect } from 'react';
import { Plus, Eye, CheckCircle, X, Package, Search, Filter } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const InventoryOrders = ({ socket }) => {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medications, setMedications] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({ status: '', supplier_id: '' });

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchMedications();
    fetchFacilities();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.supplier_id) queryParams.append('supplier_id', filters.supplier_id);

      const response = await fetch(
        `${API_BASE_URL}/inventory/orders?${queryParams.toString()}`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/inventory/suppliers`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await response.json();
      if (data.success) setSuppliers(data.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchMedications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/medications`);
      const data = await response.json();
      if (data.success) setMedications(data.data);
    } catch (error) {
      console.error('Error fetching medications:', error);
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/facilities`);
      const data = await response.json();
      if (data.success) setFacilities(data.data);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'received':
        return { bg: '#28a745', text: 'white' };
      case 'in_transit':
        return { bg: '#17a2b8', text: 'white' };
      case 'ordered':
        return { bg: '#007bff', text: 'white' };
      case 'pending':
        return { bg: '#ffc107', text: '#333' };
      case 'cancelled':
        return { bg: '#dc3545', text: 'white' };
      default:
        return { bg: '#6c757d', text: 'white' };
    }
  };

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
              Purchase Orders
            </h2>
            <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>
              Manage inventory purchase orders
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
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
            Create Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="ordered">Ordered</option>
              <option value="in_transit">In Transit</option>
              <option value="received">Received</option>
              <option value="partial">Partial</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Supplier
            </label>
            <select
              value={filters.supplier_id}
              onChange={(e) => setFilters({ ...filters, supplier_id: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            >
              <option value="">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier.supplier_id} value={supplier.supplier_id}>
                  {supplier.supplier_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
            No orders found
          </p>
        ) : (
          orders.map((order) => {
            const statusColor = getStatusColor(order.status);
            return (
              <div
                key={order.order_id}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                        Order #{order.order_id.substring(0, 8)}
                      </h3>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: statusColor.bg,
                          color: statusColor.text,
                        }}
                      >
                        {order.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>
                      <div>Supplier: {order.supplier_name}</div>
                      <div>Facility: {order.facility_name}</div>
                      <div>Order Date: {new Date(order.order_date).toLocaleDateString()}</div>
                      {order.expected_delivery_date && (
                        <div>Expected Delivery: {new Date(order.expected_delivery_date).toLocaleDateString()}</div>
                      )}
                      {order.total_cost && (
                        <div style={{ fontWeight: 'bold', color: '#333', marginTop: '5px' }}>
                          Total Cost: ₱{parseFloat(order.total_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`${API_BASE_URL}/inventory/orders/${order.order_id}`, {
                          headers: {
                            ...(token && { Authorization: `Bearer ${token}` }),
                          },
                        });
                        const data = await response.json();
                        if (data.success) {
                          setSelectedOrder(data.data);
                          setShowModal(true);
                        }
                      } catch (error) {
                        console.error('Error fetching order details:', error);
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Order Details Modal - Simplified for now */}
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
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>
                {selectedOrder ? 'Order Details' : 'Create Purchase Order'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedOrder(null);
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
            <p style={{ color: '#6c757d' }}>
              {selectedOrder
                ? 'Order details view - Full implementation would show order items and allow receiving'
                : 'Create order form - Full implementation would allow adding items and creating order'}
            </p>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '20px' }}>
              Note: Full order creation and receiving functionality requires additional form implementation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryOrders;

