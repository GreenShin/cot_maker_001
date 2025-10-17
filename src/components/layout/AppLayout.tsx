import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, Container, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider, IconButton, Tooltip } from '@mui/material';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { Link, useLocation, Outlet } from 'react-router-dom';

const drawerWidth = 240;
const collapsedWidth = 72;

const navigation = [
  { name: 'CoTs', path: '/', icon: <DashboardIcon /> },
  { name: '질문자 리스트', path: '/users', icon: <PeopleIcon /> },
  { name: '상품 리스트', path: '/products', icon: <Inventory2Icon /> },
  { name: '설정', path: '/settings', icon: <SettingsIcon /> },
];

export function AppLayout() {
  const location = useLocation();
  
  // 로컬 스토리지에서 메뉴 상태를 가져오기 (기본값: true)
  const [open, setOpen] = React.useState(() => {
    const stored = localStorage.getItem('drawer-open');
    return stored ? JSON.parse(stored) : true;
  });
  
  const toggleOpen = () => {
    setOpen((v: boolean) => {
      const newValue = !v;
      localStorage.setItem('drawer-open', JSON.stringify(newValue));
      return newValue;
    });
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Left Drawer Navigation */}
      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : collapsedWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: open ? 'space-between' : 'center' }}>
          {open && (
            <Typography variant="h6" noWrap>
              CoT Maker
            </Typography>
          )}
          <Tooltip title={open ? '메뉴 접기' : '메뉴 펼치기'}>
            <IconButton onClick={toggleOpen} size="small">
              {open ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
        <Divider />
        <List>
          {navigation.map((item) => (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              {open && <ListItemText primary={item.name} />}
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 1, height: '100vh', overflow: 'hidden' }}>
        <Container maxWidth={false} sx={{ p: 0, height: '100%' }}>
          <Box sx={{ height: '100%' }}>
            <Outlet />
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
