import React, { useState } from 'react';
import { 
  Container, Typography, TextField, Button, Box, 
  Paper, Alert, CircularProgress, Link 
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import authService from '../services/auth.service';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      console.log('Attempting login:', { username, password: '******' });
      const response = await authService.login(username, password);
      console.log('Login successful:', response);
      console.log('Navigating to home page');
      window.location.href = '/';
      console.log('Navigation command sent');
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message || error);
      let errorMessage = 'Login failed';
      if (error.response) {
        // 服务器返回错误
        errorMessage = error.response.data?.message || 
                      (error.response.data && typeof error.response.data === 'string' ? error.response.data : 
                      `Server error (${error.response.status})`);
        console.error('服务器响应:', error.response);
      } else if (error.request) {
        // 请求未发送成功
        errorMessage = 'Network error, please check your connection';
        console.error('请求未收到响应:', error.request);
      } else {
        // 其他错误
        errorMessage = error.message || 'Unknown error';
      }
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Login
        </Typography>
        
        {message && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleLogin} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/register" variant="body2">
              {"Don't have an account? Register now"}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 