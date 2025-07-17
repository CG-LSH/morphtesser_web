import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Navbar from './Navbar'; // 如果你有导航栏组件

const Layout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 如果你有导航栏组件，可以在这里添加 */}
      {/* <Navbar /> */}
      
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {/* Outlet 组件会渲染子路由的内容 */}
        <Outlet />
      </Container>
    </Box>
  );
};

export default Layout; 