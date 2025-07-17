import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/auth.service';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  
  console.log('PrivateRoute检查: 当前用户', currentUser, '当前路径', location.pathname);

  if (!currentUser) {
    console.log('未登录，重定向到登录页面');
    // 如果用户未登录，重定向到登录页面，并记住他们想要访问的页面
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('已登录，显示受保护内容');
  // 如果用户已登录，显示受保护的内容
  return children;
};

export default PrivateRoute; 