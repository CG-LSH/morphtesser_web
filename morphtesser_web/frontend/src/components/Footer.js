import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Footer = () => {
  return (
    <Box component="footer" sx={{ 
      bgcolor: 'rgba(0, 0, 0, 0.8)', 
      py: 3, 
      mt: 'auto',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      width: '100vw',
      margin: 0,
      padding: 0
    }}>
      <Container maxWidth={false} sx={{ 
        width: '100%',
        maxWidth: 'none',
        px: { xs: 2, sm: 3, md: 4 }
      }}>
        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" align="center">
          © {new Date().getFullYear()} Neuron Online Modeling Platform | All rights reserved
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 