import React, { useState } from 'react';
import { Box, Container, Typography, Button, AppBar, Toolbar, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField, FormControlLabel, RadioGroup, Radio } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NeuronBackground from '../assets/images/neuron-bg';
import BuildIcon from '@mui/icons-material/Build';
import StorageIcon from '@mui/icons-material/Storage';
import ExtensionIcon from '@mui/icons-material/Extension';
import axios from 'axios';
import modelService from '../services/model.service';
import NeuronAnimation from '../components/NeuronAnimation';

const Home = () => {
  const navigate = useNavigate();
  const neuronBg = NeuronBackground();
  const [openDialog, setOpenDialog] = useState(false);
  const [modelType, setModelType] = useState('normal');
  const [modelName, setModelName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [saveToLibrary, setSaveToLibrary] = useState(false);

  const handleModelUpload = async () => {
    if (selectedFile) {
      // 上传文件模式
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('metadata', JSON.stringify({
        name: modelName,
        type: modelType,
        saveToLibrary: saveToLibrary
      }));
      
      try {
        const response = await axios.post('/api/models/upload', formData);
        navigate(`/models/${response.data.id}`);
      } catch (error) {
        console.error('上传失败:', error);
        alert('上传失败: ' + (error.response?.data || error.message));
      }
    } else {
      // 在线建模模式
      try {
        const response = await modelService.createModel({
          name: modelName,
          type: modelType
        });
        navigate(`/models/${response.data.id}`);
      } catch (error) {
        console.error('创建失败:', error);
        alert('创建失败: ' + (error.response?.data || error.message));
      }
    }
    setOpenDialog(false);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'auto',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        zIndex: 1
      }
    }}>
      {/* Navigation Bar */}
      <AppBar position="static" sx={{ 
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(0, 0, 0, 0.6) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        zIndex: 100,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100vw',
        margin: 0,
        padding: 0,
        '&::before': {
          content: '""',
          position: 'absolute',
          bottom: '-20px',
          left: 0,
          right: 0,
          height: '20px',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.3) 50%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: -1
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-40px',
          left: 0,
          right: 0,
          height: '40px',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 50%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: -2
        }
      }}>
        <Toolbar sx={{ 
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          justifyContent: 'space-between',
          minHeight: { xs: '64px', sm: '64px' },
          paddingLeft: { xs: '12px', sm: '16px', md: '24px' },
          paddingRight: { xs: '12px', sm: '16px', md: '24px' },
          margin: 0,
          width: '100%',
          maxWidth: 'none'
        }}>
          {/* Left MorphTesser Logo */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexGrow: { xs: 1, sm: 0 },
            minWidth: { xs: 'auto', sm: '200px' },
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)'
            }
          }}>
            <img 
              src="/assets/images/logo_M.png" 
              alt="MorphTesser Logo" 
              style={{ 
                height: '40px', 
                width: 'auto',
                maxWidth: '100%',
                filter: 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.1))'
              }} 
            />
          </Box>
          
          {/* Right Navigation Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 },
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            justifyContent: { xs: 'center', sm: 'flex-end' },
            width: { xs: '100%', sm: 'auto' },
            mt: { xs: 1, sm: 0 }
          }}>
            <Button
              color="inherit"
              startIcon={<BuildIcon />}
              onClick={() => {
                console.log('Online Modeling clicked');
                navigate('/online-builder');
              }}
              sx={{ 
                color: 'white',
                position: 'relative',
                zIndex: 101,
                pointerEvents: 'auto',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                minWidth: { xs: 'auto', sm: 'auto' },
                px: { xs: 1.5, sm: 2.5 },
                py: { xs: 1, sm: 1.5 },
                borderRadius: '8px',
                fontWeight: 500,
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)'
                },
                '&:active': {
                  transform: 'translateY(0px)'
                }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Online Modeling
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                Modeling
              </Box>
            </Button>
            <Button
              color="inherit"
              startIcon={<StorageIcon />}
              onClick={() => {
                console.log('Data Repository clicked');
                navigate('/public-database');
              }}
              sx={{ 
                color: 'white',
                position: 'relative',
                zIndex: 101,
                pointerEvents: 'auto',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                minWidth: { xs: 'auto', sm: 'auto' },
                px: { xs: 1.5, sm: 2.5 },
                py: { xs: 1, sm: 1.5 },
                borderRadius: '8px',
                fontWeight: 500,
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)'
                },
                '&:active': {
                  transform: 'translateY(0px)'
                }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Data Repository
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                Repository
              </Box>
            </Button>
            <Button
              color="inherit"
              startIcon={<ExtensionIcon />}
              onClick={() => {
                console.log('NeuroMorpho Plugin clicked');
                navigate('/neuromorpho-plugin');
              }}
              sx={{ 
                color: 'white',
                position: 'relative',
                zIndex: 101,
                pointerEvents: 'auto',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                minWidth: { xs: 'auto', sm: 'auto' },
                px: { xs: 1.5, sm: 2.5 },
                py: { xs: 1, sm: 1.5 },
                borderRadius: '8px',
                fontWeight: 500,
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)'
                },
                '&:active': {
                  transform: 'translateY(0px)'
                }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                NeuroMorpho.Org Plugin
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                Plugin
              </Box>
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Full Page Line Animation */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          opacity: 0.3,
          overflow: 'hidden',
          pointerEvents: 'none'
        }}
      >
        <NeuronAnimation />
      </Box>

      <Box sx={{ 
        position: 'relative', 
        zIndex: 3, 
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 0,
        mx: 0,
        pt: '84px',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 50%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: -1
        }
      }}>
        <Container maxWidth={false} sx={{ 
          textAlign: 'center',
          py: { xs: 4, sm: 6, md: 8 },
          px: { xs: 2, sm: 3, md: 4 }
        }}>
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom
            sx={{
              color: 'white',
              fontWeight: 700,
              textShadow: '0 0 10px rgba(62, 118, 244, 0.8), 0 0 20px rgba(62, 118, 244, 0.5)',
              fontFamily: '"Orbitron", "Roboto", sans-serif',
              letterSpacing: '0.02em',
              marginBottom: { xs: 1.5, sm: 2, md: 2.5 },
              fontSize: { xs: '2.5rem', sm: '4rem', md: '5rem', lg: '6rem', xl: '7rem' },
              textAlign: 'center',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(62, 118, 244, 0.8), transparent)'
              }
            }}
          >
            MorphTesser
          </Typography>
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{
              color: 'white',
              opacity: 0.8,
              fontWeight: 300,
              letterSpacing: '0.05em',
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              marginBottom: { xs: 2, sm: 2.5, md: 3 },
              fontSize: { xs: '1.1rem', sm: '1.4rem', md: '1.7rem', lg: '2rem', xl: '2.2rem' },
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              px: { xs: 1, sm: 0 }
            }}
          >
            Efficient neuron morphological modeling and analysis platform, exploring the mysteries of the brain
          </Typography>
        </Container>

        {/* Full Page Background Image */}
        <Box
          sx={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
            background: `url('/assets/images/neuron-bg.png') center center/cover no-repeat`,
            opacity: 0.8,
            pointerEvents: 'none',
          }}
        />

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Model</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Model Name"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Model Type</InputLabel>
                <Select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                >
                  <MenuItem value="simple">Simplified Model</MenuItem>
                  <MenuItem value="normal">Standard Model</MenuItem>
                  <MenuItem value="detailed">Detailed Model</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="subtitle1" gutterBottom>
                Choose creation method:
              </Typography>
              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <RadioGroup
                  value={selectedFile ? "upload" : "online"}
                  onChange={(e) => {
                    if (e.target.value === "online") {
                      setSelectedFile(null);
                    }
                  }}
                >
                  <FormControlLabel value="online" control={<Radio />} label="Online Modeling" />
                  <FormControlLabel value="upload" control={<Radio />} label="Upload SWC File" />
                </RadioGroup>
              </FormControl>
              
              {!selectedFile ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Online modeling will create a basic model, which you can edit and modify later.
                </Typography>
              ) : (
                <input
                  type="file"
                  accept=".swc"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  style={{ marginBottom: '1rem' }}
                />
              )}
              <FormControl fullWidth>
                <label>
                  <input
                    type="checkbox"
                    checked={saveToLibrary}
                    onChange={(e) => setSaveToLibrary(e.target.checked)}
                  />
                  Save to Model Library
                </label>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleModelUpload} 
              variant="contained" 
              color="primary"
              disabled={!modelName || (selectedFile === null && modelType === "")}
            >
              {selectedFile ? "Upload and Convert" : "Create Model"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Home;