// web/src/components/Sidebar.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  Inventory as InventoryIcon,
  Description as DescriptionIcon,
  Medication as MedicationIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  CheckCircle as CheckIcon,
  MedicalServices as MedicalServicesIcon,
  LocalHospital as HospitalIcon,
  Science as ScienceIcon,
  Assignment as AssignmentIcon,
  ManageAccounts as ManageAccountsIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  ListAlt as ListAltIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  School as SchoolIcon,
  RateReview as RateReviewIcon,
  BarChart as BarChartIcon,
  ExpandLess,
  ExpandMore,
  SwapHoriz as TransactionsIcon,
  Warning as AlertsIcon,
  LocalShipping as SuppliersIcon,
  ShoppingCart as OrdersIcon,
} from '@mui/icons-material';
import { Collapse } from '@mui/material';
import { PillIcon } from 'lucide-react';

const drawerWidth = 240;

// Define menu items with role-based access (removed Medication)
const allMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['admin', 'physician', 'nurse', 'case_manager', 'lab_personnel', 'patient'] },
  { text: 'Patients', icon: <PersonIcon />, path: '/patient', roles: ['admin', 'physician', 'nurse', 'case_manager'] },
  { text: 'Appointments', icon: <CalendarIcon />, path: '/appointments', roles: ['admin', 'physician', 'nurse', 'case_manager'] },
  { text: 'My Appointments', icon: <CalendarIcon />, path: '/my-appointments', roles: ['patient'] },
  { text: 'Profile', icon: <PersonIcon />, path: '/profile', roles: ['patient'] },
  { text: 'Clinical Visit', icon: <MedicalServicesIcon />, path: '/clinical-visit', roles: ['admin', 'physician', 'nurse', 'case_manager'] },
  { text: 'Medications', icon: <PillIcon />, path: '/medications', roles: ['admin', 'physician', 'nurse', 'case_manager'] },
  { text: 'Prescriptions', icon: <DescriptionIcon />, path: '/prescriptions', roles: ['admin', 'physician', 'nurse', 'case_manager'] },
  { text: 'Medication Reminder', icon: <MedicationIcon />, path: '/medication-adherence', roles: ['admin', 'physician', 'nurse', 'case_manager', 'patient'] },
  { text: 'ART Regimens', icon: <MedicationIcon />, path: '/art-regimen', roles: ['admin', 'physician', 'nurse', 'case_manager'] },
  { text: 'Education', icon: <SchoolIcon />, path: '/education', roles: ['admin', 'physician', 'nurse', 'case_manager', 'patient'] },
  { text: 'Patient Survey', icon: <RateReviewIcon />, path: '/patient-survey', roles: ['patient'] },
  { text: 'Survey Metrics', icon: <BarChartIcon />, path: '/survey-metrics', roles: ['admin', 'physician', 'case_manager'] },
  { text: 'Lab Test', icon: <ScienceIcon />, path: '/lab-test', roles: ['admin', 'physician', 'nurse', 'lab_personnel'] },
  { text: 'HTS Sessions', icon: <AssignmentIcon />, path: '/hts-sessions', roles: ['admin', 'physician', 'nurse', 'case_manager'] },
  { text: 'Counseling Sessions', icon: <PeopleIcon />, path: '/counseling', roles: ['admin', 'physician', 'nurse', 'case_manager'] },
  { text: 'Referrals', icon: <HospitalIcon />, path: '/referrals', roles: ['admin', 'physician', 'nurse', 'case_manager'] },
  { text: 'Care Tasks', icon: <ListAltIcon />, path: '/care-tasks', roles: ['admin', 'case_manager'] },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/reports', roles: ['admin', 'physician'] },
  { text: 'Audit Trail', icon: <HistoryIcon />, path: '/audit-trail', roles: ['admin', 'physician', 'nurse', 'case_manager', 'lab_personnel'] },
  { text: 'Branch', icon: <BusinessIcon />, path: '/branch-management', roles: ['admin'] },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings', roles: ['admin', 'physician', 'nurse', 'case_manager', 'lab_personnel', 'patient'] },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = React.useState(null);
  const [inventoryOpen, setInventoryOpen] = React.useState(false);

  React.useEffect(() => {
    // Get user role from localStorage or API
    const getUserRole = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserRole(user.role);
        } else {
          // Try to fetch from API
          const token = localStorage.getItem('token');
          if (token) {
            const response = await fetch('http://localhost:5000/api/auth/me', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                setUserRole(data.user.role);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error getting user role:', error);
      }
    };
    getUserRole();
  }, []);

  // Filter menu items based on user role (exclude patient for inventory dropdown)
  const menuItems = userRole
    ? allMenuItems.filter((item) => item.roles.includes(userRole))
    : [];

  // Check if inventory dropdown should be shown (all roles except patient)
  const showInventoryDropdown = userRole && userRole !== 'patient';

  // Inventory submenu items
  const inventorySubItems = [
    { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Transactions', icon: <TransactionsIcon />, path: '/inventory/transactions' },
    { text: 'Alerts', icon: <AlertsIcon />, path: '/inventory/alerts' },
    { text: 'Suppliers', icon: <SuppliersIcon />, path: '/inventory/suppliers' },
    { text: 'Purchase Orders', icon: <OrdersIcon />, path: '/inventory/orders' },
  ];

  // Check if any inventory submenu item is active
  const isInventoryActive = inventorySubItems.some(item => location.pathname === item.path);

  // Auto-open inventory dropdown if on inventory page
  React.useEffect(() => {
    if (isInventoryActive) {
      setInventoryOpen(true);
    }
  }, [isInventoryActive]);

  const handleLogout = () => {
    // Clear any authentication tokens and user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to home page
    navigate('/');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: 'white',
          color: '#333333',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e5e7eb',
        },
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ color: '#B82132', fontWeight: 600 }}
        >
          My Hub Cares
        </Typography>
      </Toolbar>
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        <List>
          {menuItems.length === 0 ? (
            <ListItem>
              <ListItemText primary="Loading..." />
            </ListItem>
          ) : (
            <>
              {menuItems.map((item) => {
                // Skip the inventory item if we're showing the dropdown
                if (showInventoryDropdown && item.text === 'Inventory') {
                  return null;
                }
                
                return (
                  <ListItem
                    button
                    key={item.text}
                    onClick={() => navigate(item.path)}
                    selected={location.pathname === item.path}
                    sx={{
                      borderRadius: 1,
                      mx: 1,
                      my: 0.5,
                      borderLeft:
                        location.pathname === item.path
                          ? '4px solid #B82132'
                          : '4px solid transparent',
                      transition: 'all 0.2s ease-in-out',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(184, 33, 50, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(184, 33, 50, 0.15)',
                        },
                        '& .MuiListItemIcon-root': {
                          color: '#B82132',
                        },
                        '& .MuiListItemText-primary': {
                          color: '#B82132',
                          fontWeight: 500,
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(184, 33, 50, 0.05)',
                        borderLeft: '4px solid #B82132',
                        '& .MuiListItemIcon-root': {
                          color: '#B82132',
                        },
                        '& .MuiListItemText-primary': {
                          color: '#B82132',
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color:
                          location.pathname === item.path ? '#B82132' : '#64748b',
                        minWidth: 40,
                        transition: 'color 0.2s ease-in-out',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      sx={{
                        '& .MuiListItemText-primary': {
                          color:
                            location.pathname === item.path ? '#B82132' : '#333333',
                          fontWeight: location.pathname === item.path ? 500 : 400,
                          transition: 'color 0.2s ease-in-out',
                          fontSize: '0.875rem',
                        },
                      }}
                    />
                  </ListItem>
                );
              })}
              
              {/* Inventory Dropdown Menu */}
              {showInventoryDropdown && (
                <>
                  <ListItem
                    button
                    onClick={() => setInventoryOpen(!inventoryOpen)}
                    sx={{
                      borderRadius: 1,
                      mx: 1,
                      my: 0.5,
                      borderLeft: isInventoryActive
                        ? '4px solid #B82132'
                        : '4px solid transparent',
                      backgroundColor: isInventoryActive
                        ? 'rgba(184, 33, 50, 0.1)'
                        : 'transparent',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: 'rgba(184, 33, 50, 0.05)',
                        borderLeft: '4px solid #B82132',
                        '& .MuiListItemIcon-root': {
                          color: '#B82132',
                        },
                        '& .MuiListItemText-primary': {
                          color: '#B82132',
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isInventoryActive ? '#B82132' : '#64748b',
                        minWidth: 40,
                        transition: 'color 0.2s ease-in-out',
                      }}
                    >
                      <InventoryIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Inventory Management"
                      sx={{
                        '& .MuiListItemText-primary': {
                          color: isInventoryActive ? '#B82132' : '#333333',
                          fontWeight: isInventoryActive ? 500 : 400,
                          transition: 'color 0.2s ease-in-out',
                          fontSize: '0.875rem',
                        },
                      }}
                    />
                    {inventoryOpen ? (
                      <ExpandLess sx={{ color: isInventoryActive ? '#B82132' : '#64748b' }} />
                    ) : (
                      <ExpandMore sx={{ color: isInventoryActive ? '#B82132' : '#64748b' }} />
                    )}
                  </ListItem>
                  <Collapse in={inventoryOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {inventorySubItems.map((subItem) => (
                        <ListItem
                          button
                          key={subItem.text}
                          onClick={() => navigate(subItem.path)}
                          selected={location.pathname === subItem.path}
                          sx={{
                            pl: 4,
                            borderRadius: 1,
                            mx: 1,
                            my: 0.25,
                            borderLeft:
                              location.pathname === subItem.path
                                ? '4px solid #B82132'
                                : '4px solid transparent',
                            transition: 'all 0.2s ease-in-out',
                            '&.Mui-selected': {
                              backgroundColor: 'rgba(184, 33, 50, 0.1)',
                              '&:hover': {
                                backgroundColor: 'rgba(184, 33, 50, 0.15)',
                              },
                              '& .MuiListItemIcon-root': {
                                color: '#B82132',
                              },
                              '& .MuiListItemText-primary': {
                                color: '#B82132',
                                fontWeight: 500,
                              },
                            },
                            '&:hover': {
                              backgroundColor: 'rgba(184, 33, 50, 0.05)',
                              borderLeft: '4px solid #B82132',
                              '& .MuiListItemIcon-root': {
                                color: '#B82132',
                              },
                              '& .MuiListItemText-primary': {
                                color: '#B82132',
                              },
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              color:
                                location.pathname === subItem.path ? '#B82132' : '#64748b',
                              minWidth: 40,
                              transition: 'color 0.2s ease-in-out',
                            }}
                          >
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={subItem.text}
                            sx={{
                              '& .MuiListItemText-primary': {
                                color:
                                  location.pathname === subItem.path ? '#B82132' : '#333333',
                                fontWeight: location.pathname === subItem.path ? 500 : 400,
                                transition: 'color 0.2s ease-in-out',
                                fontSize: '0.875rem',
                              },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </>
              )}
            </>
          )}
        </List>
      </Box>
      <Box sx={{ p: 1, mb: 1 }}>
        <Divider sx={{ mb: 1 }} />
        <ListItem
          button
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            mx: 1,
            backgroundColor: '#B82132',
            color: 'white',
            '&:hover': {
              backgroundColor: '#8B1A26',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" sx={{ color: 'white' }} />
        </ListItem>
      </Box>
    </Drawer>
  );
};

export default Sidebar;