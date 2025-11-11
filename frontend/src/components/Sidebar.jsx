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
  Divider
} from '@mui/material';
import {
  Home,
  Users,
  Calendar,
  Bell,
  Settings,
  LogOut
} from 'lucide-react';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
  { text: 'Patients', icon: <Users size={20} />, path: '/patient' },
  { text: 'Appointments', icon: <Calendar size={20} />, path: '/appointments' },
  { text: 'Clinical Visit', icon: <Calendar size={20} />, path: '/clinical-visit' },
  { text: 'Notifications', icon: <Bell size={20} />, path: '/notifications' },
  { text: 'Settings', icon: <Settings size={20} />, path: '/settings' }
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Clear any authentication tokens
    localStorage.removeItem('token');
    // Redirect to login page
    navigate('/login');
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
          flexDirection: 'column'
        },
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ color: '#2563eb' }}>
          Hub Cares
        </Typography>
      </Toolbar>
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem 
              button 
              key={item.text}
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#2563eb'
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(37, 99, 235, 0.05)',
                }
              }}
            >
              <ListItemIcon sx={{ color: '#666666' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ p: 1 }}>
        <Divider sx={{ mb: 1 }} />
        <ListItem 
          button 
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            '&:hover': {
              backgroundColor: 'rgba(220, 38, 38, 0.05)',
            }
          }}
        >
          <ListItemIcon sx={{ color: '#ef4444' }}>
            <LogOut size={20} />
          </ListItemIcon>
          <ListItemText primary="Logout" sx={{ color: '#ef4444' }} />
        </ListItem>
      </Box>
    </Drawer>
  );
};

export default Sidebar;