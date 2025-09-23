import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Button, TextField, FormControl, 
  InputLabel, Select, MenuItem, Paper, CircularProgress, Alert,
  Stepper, Step, StepLabel, FormControlLabel, Checkbox
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate } from 'react-router-dom';
import NeuronBackground from '../assets/images/neuron-bg';
import AuthCheck from '../components/AuthCheck';
import { Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

// 创建一个 axios 实例，设置基础配置
const api = axios.create({
  baseURL: 'http://localhost:3000',  // 确保这个地址匹配你的后端服务器地址
  timeout: 30000,  // 设置超时时间为 30 秒
});

const UploadPage = () => {
  const navigate = useNavigate();
  const neuronBg = NeuronBackground();
  const [activeStep, setActiveStep] = useState(0);
  const [swcFile, setSwcFile] = useState(null);
  const [objFile, setObjFile] = useState(null);
  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [species, setSpecies] = useState('');
  const [brainRegion, setBrainRegion] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const steps = ['Select File', 'Fill in Information', 'Upload Complete'];

  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUpload = async () => {
    if (!swcFile) {
      message.error('Please upload SWC file');
      return;
    }

    if (!modelName) {
      message.error('Please enter model name');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('swcFile', swcFile.originFileObj || swcFile);
    if (objFile) {
      formData.append('objFile', objFile.originFileObj || objFile);
    }
    formData.append('name', modelName);
    formData.append('description', modelDescription);
    formData.append('species', species);
    formData.append('brain_region', brainRegion);
    formData.append('is_public', isPublic);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Please log in first');
        navigate('/login');
        return;
      }

      await api.post('/api/models/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      setSuccess(true);
      message.success('Upload successful!');
      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        navigate('/models');
      }, 1500);
    } catch (error) {
      console.error('Upload failed:', error);
      if (error.code === 'ERR_NETWORK') {
        message.error('Network error: Unable to connect to server, please check if the server is running');
      } else if (error.response?.status === 404) {
        message.error('Upload API endpoint does not exist, please check backend routing configuration');
      } else {
        message.error('Upload failed: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <AuthCheck>
      <Box sx={{ 
        minHeight: '100vh',
        position: 'relative',
        py: 4,
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
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
          <Paper sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Upload Neuron Model
            </Typography>
            
            {!networkStatus && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                You are currently offline, please check your network connection.
              </Alert>
            )}
            
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {activeStep === 0 && (
              <Box>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>File Type</InputLabel>
                  <Select
                    value={swcFile ? 'swc' : objFile ? 'obj' : ''}
                    onChange={(e) => {
                      if (e.target.value === 'swc') {
                        setSwcFile(null);
                      } else if (e.target.value === 'obj') {
                        setObjFile(null);
                      }
                    }}
                  >
                    <MenuItem value="swc">SWC Format (Neuron Skeleton)</MenuItem>
                    <MenuItem value="obj">OBJ Format (3D Mesh Model)</MenuItem>
                  </Select>
                </FormControl>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    SWC File (Required)
                  </Typography>
                  <Upload
                    accept=".swc"
                    beforeUpload={() => false}
                    onChange={(info) => setSwcFile(info.file)}
                    maxCount={1}
                  >
                    <Button variant="outlined" startIcon={<UploadOutlined />}>
                      Select SWC File
                    </Button>
                  </Upload>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    OBJ File (Optional)
                  </Typography>
                  <Upload
                    accept=".obj"
                    beforeUpload={() => false}
                    onChange={(info) => setObjFile(info.file)}
                    maxCount={1}
                  >
                    <Button variant="outlined" startIcon={<UploadOutlined />}>
                      Select OBJ File
                    </Button>
                  </Upload>
                </Box>
              </Box>
            )}
            
            {activeStep === 1 && (
              <Box>
                <TextField
                  fullWidth
                  label="Model Name"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  required
                  sx={{ mb: 3 }}
                />
                
                <TextField
                  fullWidth
                  label="Model Description"
                  value={modelDescription}
                  onChange={(e) => setModelDescription(e.target.value)}
                  multiline
                  rows={3}
                  sx={{ mb: 3 }}
                />
                
                <TextField
                  fullWidth
                  label="Species"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  sx={{ mb: 3 }}
                />
                
                <TextField
                  fullWidth
                  label="Brain Region"
                  value={brainRegion}
                  onChange={(e) => setBrainRegion(e.target.value)}
                  sx={{ mb: 3 }}
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Also add to public database (other users can view this model)"
                  sx={{ mb: 3 }}
                />
              </Box>
            )}
            
            {activeStep === 2 && (
              <Box sx={{ textAlign: 'center' }}>
                {uploading ? (
                  <CircularProgress />
                ) : success ? (
                  <Alert severity="success">
                    Upload successful! Redirecting to model library page...
                  </Alert>
                ) : (
                  <Alert severity="info">
                    Please confirm the information is correct, then click 'Finish' to upload.
                  </Alert>
                )}
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={() => setActiveStep((prev) => prev - 1)}
              >
                Previous
              </Button>
              
              <Button
                variant="contained"
                onClick={() => {
                  if (activeStep === steps.length - 1) {
                    handleUpload();
                  } else {
                    setActiveStep((prev) => prev + 1);
                  }
                }}
                disabled={uploading}
              >
                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </AuthCheck>
  );
};

export default UploadPage; 