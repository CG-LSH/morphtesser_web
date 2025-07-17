import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ModelLibrary from './pages/ModelLibrary';
import ModelDetail from './pages/ModelDetail';
import Upload from './pages/Upload';
import OnlineBuilder from './pages/OnlineBuilder';
import PublicDatabase from './pages/PublicDatabase';
import Profile from './pages/Profile';
import './App.css';
import NeuronPattern from './assets/images/neuron-pattern';
import axios from 'axios';
import AuthService from './services/auth.service';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  const [currentUser, setCurrentUser] = useState(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const neuronPatternBg = NeuronPattern();
  
  useEffect(() => {
    document.body.style.backgroundImage = neuronPatternBg;
  }, [neuronPatternBg]);

  useEffect(() => {
    // 从 localStorage 恢复认证状态
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      console.log('Restoring auth token from storage');
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    }
  }, []);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      console.log('用户已登录:', user);
    }
  }, []);

  const logOut = () => {
    AuthService.logout();
    localStorage.removeItem('user');
    axios.defaults.headers.common['Authorization'] = null;
    setCurrentUser(undefined);
    setIsAuthenticated(false);
    console.log('用户已登出');
    window.location.href = '/';
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <nav className="top-navbar">
            <div className="container">
              <div className="navbar-nav">
                <li className="nav-item">
                  <Link to={"/"} className="nav-link">
                    Home
                  </Link>
                </li>
              </div>

              {currentUser ? (
                <div className="navbar-nav ml-auto">
                  <li className="nav-item">
                    <Link to={"/profile"} className="nav-link">
                      My Account
                    </Link>
                  </li>
                  <li className="nav-item">
                    <a href="/" className="nav-link" onClick={logOut}>
                      Logout
                    </a>
                  </li>
                </div>
              ) : (
                <div className="navbar-nav ml-auto">
                  <li className="nav-item">
                    <Link to={"/login"} className="nav-link">
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to={"/register"} className="nav-link">
                      Register
                    </Link>
                  </li>
                </div>
              )}
            </div>
          </nav>
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
              <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/login" />} />
              <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/models/:id" element={isAuthenticated ? <ModelDetail /> : <Navigate to="/login" />} />
              <Route path="/upload" element={isAuthenticated ? <Upload /> : <Navigate to="/login" />} />
              <Route path="/online-builder" element={isAuthenticated ? <OnlineBuilder /> : <Navigate to="/login" />} />
              <Route path="/public-database" element={<PublicDatabase />} />
              <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App; 