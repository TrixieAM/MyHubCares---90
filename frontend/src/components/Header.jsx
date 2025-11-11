// web/src/components/Header.jsx
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Box
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle
} from '@mui/icons-material';
import { Menu as MenuIcon } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Logo = () => (
  <svg width="40" height="40" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '10px' }}>
    <rect width="60" height="60" rx="10" fill="#2563eb"/>
    <path d="M30 15L20 25H26V35H22V45H30V35H34V45H42V35H38V25H44L30 15Z" fill="white"/>
  </svg>
);

// Map paths to display names
const pathNames = {
  '/dashboard': 'Dashboard',
  '/patients': 'Patients',
  '/appointments': 'Appointments',
  '/notifications': 'Notifications',
  '/settings': 'Settings'
};

const Header = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const location = useLocation();

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Get the current page name from the path
  const getCurrentPageName = () => {
    return pathNames[location.pathname] || 'Dashboard';
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#ffffff',
        color: '#2563eb',
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Logo />
          <Typography variant="h6" noWrap component="div" sx={{ mr: 1 }}>
            My Hub Cares
          </Typography>
          <MenuIcon size={20} color="#000000" style={{ margin: '0 30px' }} />
          <Typography variant="h6" noWrap component="div" color='black'>
            {getCurrentPageName()}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mr: 2 }}>
          Real-time system statistics and alerts
        </Typography>
        <Box sx={{ display: 'flex' }}>
          <IconButton color="inherit">
            <Badge badgeContent={0} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
          >
            <Avatar sx={{ bgcolor: '#2563eb' }}>
              <AccountCircle />
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
            <MenuItem onClick={handleMenuClose}>My account</MenuItem>
            <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;