import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Package, ArrowUp, ArrowDown } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const InventoryTransactions = ({ socket }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    inventory_id: '',
    facility_id: '',
    transaction_type: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(
        `${API_BASE_URL}/inventory/transactions?${queryParams.toString()}`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setTransactions(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'restock':
        return <ArrowUp size={16} className="text-green-600" />;
      case 'dispense':
        return <ArrowDown size={16} className="text-red-600" />;
      default:
        return <Package size={16} className="text-blue-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'restock':
        return 'bg-green-100 text-green-800';
      case 'dispense':
        return 'bg-red-100 text-red-800';
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
          Inventory Transactions
        </h2>
        <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>
          View all inventory movement history
        </p>
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
              Transaction Type
            </label>
            <select
              value={filters.transaction_type}
              onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            >
              <option value="">All Types</option>
              <option value="restock">Restock</option>
              <option value="dispense">Dispense</option>
              <option value="adjustment">Adjustment</option>
              <option value="transfer">Transfer</option>
              <option value="expired">Expired</option>
              <option value="damaged">Damaged</option>
              <option value="return">Return</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Start Date
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              End Date
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
            No transactions found
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Medication</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Facility</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Before</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Change</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>After</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Performed By</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.transaction_id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px' }}>
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        className={getTransactionColor(transaction.transaction_type)}
                      >
                        {getTransactionIcon(transaction.transaction_type)}
                        {transaction.transaction_type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{transaction.medication_name}</td>
                    <td style={{ padding: '12px' }}>{transaction.facility_name}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {transaction.quantity_before}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right',
                      color: transaction.quantity_change > 0 ? '#28a745' : '#dc3545',
                      fontWeight: 'bold'
                    }}>
                      {transaction.quantity_change > 0 ? '+' : ''}{transaction.quantity_change}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                      {transaction.quantity_after}
                    </td>
                    <td style={{ padding: '12px' }}>{transaction.performed_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryTransactions;

