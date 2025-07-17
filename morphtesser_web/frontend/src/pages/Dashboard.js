import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Paper, Box } from '@mui/material';
import authService from '../services/auth.service';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    console.log('Dashboard加载，当前用户:', currentUser);
    setUser(currentUser);
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="h6" gutterBottom>
        Welcome back, {user?.username || 'User'}
      </Typography>
      
      <Grid container spacing={3}>
        {/* 仪表盘内容 */}
        <Grid item xs={12} md={8} lg={9}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 240,
            }}
          >
            <Typography variant="h6">Recent Activities</Typography>
            {/* 这里可以添加最近活动的内容 */}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 240,
            }}
          >
            <Typography variant="h6">User Information</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography>Username: {user?.username}</Typography>
              <Typography>Email: {user?.email}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 