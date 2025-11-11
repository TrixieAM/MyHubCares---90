// web/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  People as PeopleIcon,
  EventAvailable as AppointmentIcon,
  Warning as WarningIcon,
  Medication as PrescriptionIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

const Dashboard = ({ socket }) => {
  const [stats, setStats] = useState({
    totalPatients: 3,
    todayAppointments: 0,
    lowStockAlerts: 0,
    monthlyPrescriptions: 0
  });

  const [patientRegistrationData, setPatientRegistrationData] = useState([
    { name: 'Jan', patients: 2 },
    { name: 'Feb', patients: 3 },
    { name: 'Mar', patients: 5 },
    { name: 'Apr', patients: 4 },
    { name: 'May', patients: 6 },
    { name: 'Jun', patients: 8 }
  ]);

  const [monthlyAppointmentsData, setMonthlyAppointmentsData] = useState([
    { name: 'Jan', appointments: 10 },
    { name: 'Feb', appointments: 15 },
    { name: 'Mar', appointments: 12 },
    { name: 'Apr', appointments: 18 },
    { name: 'May', appointments: 14 },
    { name: 'Jun', appointments: 20 }
  ]);

  const [riskDistributionData, setRiskDistributionData] = useState([
    { name: 'Low', value: 60, color: '#4caf50' },
    { name: 'Medium', value: 30, color: '#ff9800' },
    { name: 'High', value: 10, color: '#f44336' }
  ]);

  const [monthlyPrescriptionsData, setMonthlyPrescriptionsData] = useState([
    { name: 'Jan', prescriptions: 5 },
    { name: 'Feb', prescriptions: 8 },
    { name: 'Mar', prescriptions: 7 },
    { name: 'Apr', prescriptions: 10 },
    { name: 'May', prescriptions: 9 },
    { name: 'Jun', prescriptions: 12 }
  ]);

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Simulate receiving real-time alerts
    if (socket) {
      socket.on('systemAlert', (alert) => {
        setAlerts(prev => [alert, ...prev].slice(0, 5)); // Keep only the latest 5 alerts
      });
    }

    return () => {
      if (socket) {
        socket.off('systemAlert');
      }
    };
  }, [socket]);

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center">
          <Box sx={{ mr: 2, color }}>
            {icon}
          </Box>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={<PeopleIcon fontSize="large" />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            icon={<AppointmentIcon fontSize="large" />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Alerts"
            value={stats.lowStockAlerts}
            icon={<WarningIcon fontSize="large" />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Prescriptions"
            value={stats.monthlyPrescriptions}
            icon={<PrescriptionIcon fontSize="large" />}
            color="#9c27b0"
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Patient Registration Trend
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={patientRegistrationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="patients" stroke="#1976d2" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Appointments
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyAppointmentsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="appointments" fill="#4caf50" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Risk Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Prescriptions
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyPrescriptionsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="prescriptions" stroke="#9c27b0" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* System Alerts */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Alerts
            </Typography>
            {alerts.length === 0 ? (
              <Alert severity="info">
                <AlertTitle>No alerts</AlertTitle>
                All systems are running normally.
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alerts.map((alert, index) => (
                      <TableRow key={index}>
                        <TableCell>{alert.time}</TableCell>
                        <TableCell>
                          <Alert severity={alert.severity} sx={{ py: 0 }}>
                            {alert.type}
                          </Alert>
                        </TableCell>
                        <TableCell>{alert.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;