import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, CircularProgress, Box } from '@mui/material';

const AuthCheck = ({ children }) => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 从localStorage获取用户信息
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          throw new Error('未找到用户信息');
        }
        
        const user = JSON.parse(userStr);
        if (!user || !user.token) {
          throw new Error('无效的用户信息');
        }
        
        // 验证令牌是否有效（可选：调用后端验证接口）
        // const response = await fetch('/api/auth/validate', {
        //   headers: { 'Authorization': `Bearer ${user.token}` }
        // });
        // if (!response.ok) throw new Error('令牌已过期');
        
        console.log('Authentication successful:', user.username);
        setAuthenticated(true);
      } catch (err) {
        console.error('Authentication check failed:', err.message);
        setError('You need to login to access this page');
        
        // 延迟跳转，给用户时间看到错误信息
        setTimeout(() => {
          navigate('/login', { state: { from: window.location.pathname } });
        }, 2000);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return <Alert severity="warning">{error}，正在跳转到登录页面...</Alert>;
  }
  
  return authenticated ? children : null;
};

export default AuthCheck; 