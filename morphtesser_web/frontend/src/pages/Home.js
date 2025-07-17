import React, { useState } from 'react';
import { Box, Container, Typography, Button, Grid, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField, FormControlLabel, RadioGroup, Radio } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NeuronBackground from '../assets/images/neuron-bg';
import VisualizationIcon from '../assets/icons/visualization';
import AnalysisIcon from '../assets/icons/analysis';
import LibraryIcon from '../assets/icons/library';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BuildIcon from '@mui/icons-material/Build';
import StorageIcon from '@mui/icons-material/Storage';
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
      backgroundImage: neuronBg,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1
      }
    }}>
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
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
              marginBottom: 3,
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
            3D Neuron Modeling and Morphological Analysis System
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
              marginBottom: 4,
              fontSize: '1.3rem',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}
          >
            Efficiently model and analyze neuron morphology, explore the mysteries of the brain
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 6 }}>
            <Button 
              variant="outlined" 
              color="primary" 
              size="large"
              onClick={() => navigate('/upload')}
              sx={{
                backgroundColor: 'rgba(25, 118, 210, 0.25)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                color: 'white',
                zIndex: 2,
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.35)',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 0 10px rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              Data Analysis
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => setOpenDialog(true)}
              sx={{
                backgroundColor: 'rgba(156, 39, 176, 0.25)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                color: 'white',
                zIndex: 2,
                '&:hover': {
                  backgroundColor: 'rgba(156, 39, 176, 0.35)',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 0 10px rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              Online Modeling
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              size="large"
              onClick={() => navigate('/models')}
              sx={{
                backgroundColor: 'rgba(0, 200, 83, 0.25)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                color: 'white',
                zIndex: 2,
                '&:hover': {
                  backgroundColor: 'rgba(0, 200, 83, 0.35)',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 0 10px rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              Public Models
            </Button>
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0,
              opacity: 0.1,
              overflow: 'hidden'
            }}
          >
            <NeuronAnimation />
          </Box>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <CloudUploadIcon sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  Data Analysis
                </Typography>
                <Typography>
                  Upload SWC or OBJ format neuron model files, save to your personal model library, and visualize and analyze.
                </Typography>
              </CardContent>
              <Box sx={{ p: 2 }}>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => navigate('/upload')}
                >
                  Upload Model
                </Button>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <BuildIcon sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  Online Modeling
                </Typography>
                <Typography>
                  Use our online modeling tool to create a fine-grained 3D neuron model from SWC or OBJ files, and save it to your model library.
                </Typography>
              </CardContent>
              <Box sx={{ p: 2 }}>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => navigate('/online-builder')}
                >
                  Start Modeling
                </Button>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <StorageIcon sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  Public Database
                </Typography>
                <Typography>
                  Browse the public neuron database, containing SWC and OBJ models of various species and brain regions, which can be downloaded and visualized.
                </Typography>
              </CardContent>
              <Box sx={{ p: 2 }}>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => navigate('/public-database')}
                >
                  Public Database
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* 底部红色区域加背景图 */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -735,
            height: '59vh',
            zIndex: 1,
            background: `url('/assets/images/neuron-bg.png') center bottom/cover no-repeat`,
            opacity: 0.3,
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
      </Container>
    </Box>
  );
};

export default Home; 