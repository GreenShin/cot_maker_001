import { AppBar, Toolbar, Typography, Box, Button, Container } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'CoTs', path: '/' },
  { name: '설정', path: '/settings' },
  { name: '질문자 리스트', path: '/users' },
  { name: '상품 리스트', path: '/products' },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CoT Admin
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {navigation.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                component={Link}
                to={item.path}
                sx={{
                  textDecoration: 'none',
                  bgcolor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.2)',
                  },
                }}
              >
                {item.name}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container 
        maxWidth={false} 
        sx={{ 
          flexGrow: 1, 
          py: 3,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Container>
    </Box>
  );
}
