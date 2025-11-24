import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Star, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../config/api.js';

const SurveyMetrics = ({ socket }) => {
  const [metrics, setMetrics] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [filters, setFilters] = useState({
    facility_id: '',
    period_start: '',
    period_end: '',
  });

  useEffect(() => {
    fetchFacilities();
    fetchSummary();
    fetchMetrics();
  }, []);

  const fetchFacilities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/facilities?is_active=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFacilities(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = new URL(`${API_BASE_URL}/survey-metrics/summary`);
      if (filters.facility_id) {
        url.searchParams.append('facility_id', filters.facility_id);
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSummary(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = new URL(`${API_BASE_URL}/survey-metrics`);
      
      if (filters.facility_id) {
        url.searchParams.append('facility_id', filters.facility_id);
      }
      if (filters.period_start) {
        url.searchParams.append('period_start', filters.period_start);
      }
      if (filters.period_end) {
        url.searchParams.append('period_end', filters.period_end);
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMetrics(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = async () => {
    if (!filters.period_start || !filters.period_end) {
      alert('Please select both start and end dates');
      return;
    }

    try {
      setCalculating(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/survey-metrics/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          facility_id: filters.facility_id || null,
          period_start: filters.period_start,
          period_end: filters.period_end,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Metrics calculated successfully!');
        fetchMetrics();
        fetchSummary();
      } else {
        alert(data.message || 'Failed to calculate metrics');
      }
    } catch (error) {
      console.error('Error calculating metrics:', error);
      alert('Failed to calculate metrics');
    } finally {
      setCalculating(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = () => {
    fetchMetrics();
    fetchSummary();
  };

  const getSatisfactionColor = (value) => {
    if (value >= 4) return '#28a745';
    if (value >= 3) return '#ffc107';
    return '#dc3545';
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = '#D84040' }) => (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        flex: 1,
        minWidth: '200px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div
          style={{
            background: `${color}20`,
            borderRadius: '8px',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={24} color={color} />
        </div>
        <h3 style={{ margin: 0, fontSize: '14px', color: '#666', fontWeight: '500' }}>{title}</h3>
      </div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
        {value !== null && value !== undefined ? (
          typeof value === 'number' ? (
            value.toFixed(2)
          ) : (
            value
          )
        ) : (
          'N/A'
        )}
      </div>
      {subtitle && <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>{subtitle}</p>}
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <BarChart3 size={28} color="#D84040" />
          <h2 style={{ margin: 0, color: '#333', fontSize: '28px' }}>Survey Metrics & Analytics</h2>
        </div>
        <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
          View patient satisfaction metrics and trends
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>Filters</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Facility
            </label>
            <select
              value={filters.facility_id}
              onChange={(e) => handleFilterChange('facility_id', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="">All Facilities</option>
              {facilities.map((facility) => (
                <option key={facility.facility_id} value={facility.facility_id}>
                  {facility.facility_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Start Date
            </label>
            <input
              type="date"
              value={filters.period_start}
              onChange={(e) => handleFilterChange('period_start', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              End Date
            </label>
            <input
              type="date"
              value={filters.period_end}
              onChange={(e) => handleFilterChange('period_end', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={applyFilters}
              style={{
                background: '#D84040',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Apply Filters
            </button>
            <button
              onClick={calculateMetrics}
              disabled={calculating || !filters.period_start || !filters.period_end}
              style={{
                background: calculating || !filters.period_start || !filters.period_end ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: calculating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {calculating ? 'Calculating...' : 'Calculate Metrics'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {summary && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Overall Statistics</h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <StatCard
              icon={Users}
              title="Total Responses"
              value={summary.statistics?.total_responses || 0}
              color="#D84040"
            />
            <StatCard
              icon={Star}
              title="Avg. Overall Satisfaction"
              value={summary.statistics?.avg_overall || null}
              subtitle="Out of 5"
              color={getSatisfactionColor(summary.statistics?.avg_overall || 0)}
            />
            <StatCard
              icon={Star}
              title="Avg. Staff Rating"
              value={summary.statistics?.avg_staff || null}
              subtitle="Out of 5"
              color="#ffc107"
            />
            <StatCard
              icon={Star}
              title="Avg. Wait Time"
              value={summary.statistics?.avg_wait || null}
              subtitle="Out of 5"
              color="#17a2b8"
            />
            <StatCard
              icon={Star}
              title="Avg. Cleanliness"
              value={summary.statistics?.avg_cleanliness || null}
              subtitle="Out of 5"
              color="#28a745"
            />
            <StatCard
              icon={TrendingUp}
              title="Recommendation Rate"
              value={summary.statistics?.recommendation_rate != null ? `${Number(summary.statistics.recommendation_rate).toFixed(1)}%` : null}
              color="#6f42c1"
            />
          </div>
        </div>
      )}

      {/* Metrics Table */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>Calculated Metrics</h3>
        {loading ? (
          <p>Loading metrics...</p>
        ) : metrics.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
            No metrics found. Calculate metrics for a specific period to see results.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                    Period
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                    Facility
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                    Responses
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                    Avg. Overall
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                    Avg. Staff
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                    Avg. Wait
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                    Avg. Cleanliness
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                    Recommendation %
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                    Calculated
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => (
                  <tr key={metric.metric_id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {new Date(metric.period_start).toLocaleDateString()} -{' '}
                      {new Date(metric.period_end).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {metric.facility_name || 'System-wide'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                      {metric.total_responses}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                      {metric.average_overall ? metric.average_overall.toFixed(2) : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                      {metric.average_staff ? metric.average_staff.toFixed(2) : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                      {metric.average_wait ? metric.average_wait.toFixed(2) : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                      {metric.average_cleanliness ? metric.average_cleanliness.toFixed(2) : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                      {metric.recommendation_rate != null ? `${Number(metric.recommendation_rate).toFixed(1)}%` : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {new Date(metric.calculated_at).toLocaleString()}
                    </td>
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

export default SurveyMetrics;

