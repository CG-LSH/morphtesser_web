import React from 'react';
import { Container, Typography, Paper, Box, Avatar } from '@mui/material';
import authService from '../services/auth.service';

const Profile = () => {
  const currentUser = authService.getCurrentUser();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Avatar 
            sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main' }}
          >
            {currentUser?.username?.charAt(0)?.toUpperCase() || '?'}
          </Avatar>
          <Typography variant="h4" gutterBottom>
            My Account
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            User Information
          </Typography>
          <Typography variant="body1">
            <strong>Username:</strong> {currentUser?.username}
          </Typography>
          <Typography variant="body1">
            <strong>Email:</strong> {currentUser?.email}
          </Typography>
          <Typography variant="body1">
            <strong>User ID:</strong> {currentUser?.id}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile; 