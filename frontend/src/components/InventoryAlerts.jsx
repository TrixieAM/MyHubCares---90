import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Filter } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const InventoryAlerts = ({ socket }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    alert_type: '',
    alert_level: '',
    acknowledged: '',
  });

  useEffect(() => {
    fetchAlerts();
  }, [filters]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') queryParams.append(key, value);
      });

      const response = await fetch(
        `${API_BASE_URL}/inventory/alerts?${queryParams.toString()}`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setAlerts(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/inventory/alerts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await response.json();

      if (data.success) {
        alert(`Generated ${data.data.alerts_created} alerts`);
        fetchAlerts();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error generating alerts:', error);
      alert('Failed to generate alerts: ' + error.message);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/inventory/alerts/${alertId}/acknowledge`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await response.json();

      if (data.success) {
        fetchAlerts();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      alert('Failed to acknowledge alert: ' + error.message);
    }
  };

  const getAlertLevelColor = (level) => {
    switch (level) {
      case 'critical':
        return { bg: '#dc3545', text: 'white' };
      case 'warning':
        return { bg: '#ffc107', text: '#333' };
      case 'info':
        return { bg: '#17a2b8', text: 'white' };
      default:
        return { bg: '#6c757d', text: 'white' };
    }
  };

  const getAlertTypeLabel = (type) => {
    switch (type) {
      case 'low_stock':
        return 'Low Stock';
      case 'expiring_soon':
        return 'Expiring Soon';
      case 'expired':
        return 'Expired';
      case 'overstock':
        return 'Overstock';
      default:
        return type;
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
              Inventory Alerts
            </h2>
            <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>
              Manage inventory alerts and notifications
            </p>
          </div>
          <button
            onClick={generateAlerts}
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
            <RefreshCw size={16} />
            Generate Alerts
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
              Alert Type
            </label>
            <select
              value={filters.alert_type}
              onChange={(e) => setFilters({ ...filters, alert_type: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            >
              <option value="">All Types</option>
              <option value="low_stock">Low Stock</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Alert Level
            </label>
            <select
              value={filters.alert_level}
              onChange={(e) => setFilters({ ...filters, alert_level: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            >
              <option value="">All Levels</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Status
            </label>
            <select
              value={filters.acknowledged}
              onChange={(e) => setFilters({ ...filters, acknowledged: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            >
              <option value="">All</option>
              <option value="false">Unacknowledged</option>
              <option value="true">Acknowledged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
            No alerts found
          </p>
        ) : (
          alerts.map((alert) => {
            const levelColor = getAlertLevelColor(alert.alert_level);
            return (
              <div
                key={alert.alert_id}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${levelColor.bg}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: levelColor.bg,
                          color: levelColor.text,
                        }}
                      >
                        {alert.alert_level.toUpperCase()}
                      </span>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          background: '#e9ecef',
                          color: '#495057',
                        }}
                      >
                        {getAlertTypeLabel(alert.alert_type)}
                      </span>
                      {alert.acknowledged === 1 && (
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: '#28a745',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle size={12} />
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>
                      {alert.medication_name}
                    </h3>
                    <p style={{ margin: '0 0 10px 0', color: '#6c757d', fontSize: '14px' }}>
                      {alert.message}
                    </p>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      <div>Facility: {alert.facility_name}</div>
                      <div>Created: {new Date(alert.created_at).toLocaleString()}</div>
                      {alert.acknowledged_by_name && (
                        <div>Acknowledged by: {alert.acknowledged_by_name}</div>
                      )}
                    </div>
                  </div>
                  {alert.acknowledged === 0 && (
                    <button
                      onClick={() => acknowledgeAlert(alert.alert_id)}
                      style={{
                        padding: '8px 16px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <CheckCircle size={16} />
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InventoryAlerts;

