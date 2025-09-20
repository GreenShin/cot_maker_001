import { Box, Typography, Paper, Toolbar } from '@mui/material';

interface ListLayoutProps {
  title: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}

export function ListLayout({ title, toolbar, children }: ListLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {toolbar && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {toolbar}
          </Box>
        )}
      </Box>
      
      <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </Paper>
    </Box>
  );
}
