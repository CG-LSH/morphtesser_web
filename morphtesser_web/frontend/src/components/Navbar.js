import React, { useState, useEffect } from 'react';
import { 
  AppBar, Toolbar, Typography, Button, Box, IconButton, 
  Menu, MenuItem, Avatar, Tooltip, Divider, useMediaQuery 
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CollectionsIcon from '@mui/icons-material/Collections';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HomeIcon from '@mui/icons-material/Home';
import BuildIcon from '@mui/icons-material/Build';
import StorageIcon from '@mui/icons-material/Storage';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import authService from '../services/auth.service';
import Logo from '../assets/images/logo';

const Navbar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    // 检查登录状态
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
    }
  }, []);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    // 页面会在AuthService.logout()中刷新
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: 'rgba(63, 81, 181, 0.95)' }}>
      <Toolbar>
        {/* Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <Logo />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              fontWeight: 700,
              color: 'white',
              textDecoration: 'none',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Neuron Morphology Analysis System
          </Typography>
        </Box>

        {/* Mobile Menu */}
        {isMobile && (
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/'); }}>
                <HomeIcon sx={{ mr: 1 }} /> Home
              </MenuItem>
              {currentUser && (
                <>
                  <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/upload'); }}>
                    <CloudUploadIcon sx={{ mr: 1 }} /> Upload Model
                  </MenuItem>
                </>
              )}
            </Menu>
          </Box>
        )}

        {/* Desktop Menu */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
          <Button
            component={Link}
            to="/"
            sx={{ color: 'white', mx: 1 }}
            startIcon={<HomeIcon />}
          >
            Home
          </Button>
          {currentUser && (
            <>
              <Button
                component={Link}
                to="/upload"
                sx={{ color: 'white', mx: 1 }}
                startIcon={<CloudUploadIcon />}
              >
                Upload Model
              </Button>
              <Button
                component={Link}
                to="/online-builder"
                sx={{ color: 'white', mx: 1 }}
                startIcon={<BuildIcon />}
              >
                Online Modeling
              </Button>
              <Button
                component={Link}
                to="/public-database"
                sx={{ color: 'white', mx: 1 }}
                startIcon={<StorageIcon />}
              >
                Public Database
              </Button>
            </>
          )}
        </Box>

        {/* User Menu */}
        <Box sx={{ flexGrow: 0 }}>
          {currentUser ? (
            <>
              <Tooltip title="打开设置">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                    {currentUser.username.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem disabled>
                  <Typography textAlign="center">{currentUser.username}</Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  <Typography textAlign="center">Logout</Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex' }}>
              <Button 
                color="inherit" 
                component={Link} 
                to="/login"
                startIcon={<LoginIcon />}
                sx={{ mr: 1 }}
              >
                Login
              </Button>
              <Button 
                variant="outlined" 
                color="inherit" 
                component={Link} 
                to="/register"
                startIcon={<PersonAddIcon />}
              >
                Register
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 