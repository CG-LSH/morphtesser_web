import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ModelLibrary from './pages/ModelLibrary';
import ModelDetail from './pages/ModelDetail';

import OnlineBuilder from './pages/OnlineBuilder';
import PublicDatabase from './pages/PublicDatabase';
import Profile from './pages/Profile';
import EmbedMesh from './pages/EmbedMesh';
import NeuroMorphoPlugin from './pages/NeuroMorphoPlugin';
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

function AppShell() {
  const location = useLocation();
  const isEmbed = location.pathname.startsWith('/embed/');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const neuronPatternBg = NeuronPattern();
  
  useEffect(() => {
    document.body.style.backgroundColor = 'black';
    document.body.style.backgroundImage = neuronPatternBg;
    document.body.style.backgroundSize = '100% 100%';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.minHeight = '100vh';
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  }, [neuronPatternBg]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    }
  }, []);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <div className="App">
      <main className="main-content" style={isEmbed ? { padding: 0, margin: 0 } : undefined}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/models/:id" element={isAuthenticated ? <ModelDetail /> : <Navigate to="/login" />} />

          <Route path="/online-builder" element={isAuthenticated ? <OnlineBuilder /> : <Navigate to="/login" />} />
          <Route path="/public-database" element={<PublicDatabase />} />
          <Route path="/neuromorpho-plugin" element={<NeuroMorphoPlugin />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/embed/mesh/:id" element={<EmbedMesh />} />
        </Routes>
      </main>
      {!isEmbed && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppShell />
      </Router>
    </ThemeProvider>
  );
}

export default App; 