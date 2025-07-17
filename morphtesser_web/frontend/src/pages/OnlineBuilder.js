import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { 
  Container, Typography, Box, Button, TextField, FormControl, 
  InputLabel, Select, MenuItem, Paper, CircularProgress, Alert,
  Grid, Card, CardContent, CardActions, CardMedia, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import modelService from '../services/model.service';
import { useNavigate } from 'react-router-dom';
import NeuronBackground from '../assets/images/neuron-bg';
import ModelViewer from '../components/ModelViewer';
// 新增依赖
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// 解析SWC文本为节点对象
function parseSWC(swcText) {
  const lines = swcText.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  const nodes = {};
  lines.forEach(line => {
    const [id, type, x, y, z, r, parent] = line.trim().split(/\s+/);
    nodes[id] = { id, type, x: +x, y: +y, z: +z, r: +r, parent };
  });
  return nodes;
}

// 计算两点间圆柱体的中点、长度和旋转
function getCylinderProps(p1, p2) {
  const start = new THREE.Vector3(p1.x, p1.y, p1.z);
  const end = new THREE.Vector3(p2.x, p2.y, p2.z);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const dir = end.clone().sub(start);
  const length = dir.length();
  // 默认cylinder在y轴方向，需要旋转到dir方向
  const axis = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dir.clone().normalize());
  return { position: [mid.x, mid.y, mid.z], quaternion, length };
}

function CylinderBetween({ start, end, r1, r2, color, ...props }) {
  const ref = useRef();
  useLayoutEffect(() => {
    if (!ref.current) return;
    const dir = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
    const axis = new THREE.Vector3(0, 1, 0);
    const dirVec = new THREE.Vector3(...dir).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dirVec);
    ref.current.position.set(
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
      (start[2] + end[2]) / 2
    );
    ref.current.setRotationFromQuaternion(quaternion);
  }, [start, end]);
  const length = Math.sqrt(
    (end[0] - start[0]) ** 2 +
    (end[1] - start[1]) ** 2 +
    (end[2] - start[2]) ** 2
  );
  return (
    <mesh ref={ref} {...props}>
      <cylinderGeometry args={[r1, r2, length, 12]} />
      <meshStandardMaterial color={color || '#8ecae6'} />
    </mesh>
  );
}

function SwcCylinders({ nodes }) {
  return (
    <group>
      {Object.values(nodes)
        .filter(node => node.parent !== '-1' && nodes[node.parent])
        .map(node => {
          const p1 = node;
          const p2 = nodes[node.parent];
          return (
            <CylinderBetween
              key={`cyl-${node.id}`}
              start={[p1.x, p1.y, p1.z]}
              end={[p2.x, p2.y, p2.z]}
              r1={p1.r || 0.5}
              r2={p2.r || 0.5}
            />
          );
        })}
      {Object.values(nodes).map(node => (
        <mesh key={`sph-${node.id}`} position={[node.x, node.y, node.z]}>
          <sphereGeometry args={[node.r || 0.5, 12, 12]} />
          <meshStandardMaterial color="#219ebc" />
        </mesh>
      ))}
    </group>
  );
}

// SWC 3D View 直接用ModelViewer
function Swc3DView({ swcText }) {
  const swcUrl = useMemo(() => {
    if (!swcText) return null;
    return URL.createObjectURL(new Blob([swcText], { type: 'text/plain' }));
  }, [swcText]);

  if (!swcText) {
    return (
      <Box
        sx={{
          height: 300,
          border: '1px dashed #ccc',
          borderRadius: 2,
          backgroundColor: '#f9f9f9',
          overflow: 'hidden',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography color="text.secondary">Please select an SWC file first</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ height: 300, border: '1px dashed #ccc', borderRadius: 2, backgroundColor: '#f9f9f9', overflow: 'hidden', mb: 2 }}>
      <ModelViewer swcUrl={swcUrl} />
    </Box>
  );
}
// Mesh 3D View 也用ModelViewer自适应
function Mesh3DView({ objUrl, loading }) {
  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        border: '1px dashed #ccc',
        borderRadius: 2,
        backgroundColor: '#f9f9f9',
        mb: 2
      }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Modeling in progress, please wait...</Typography>
      </Box>
    );
  }
  if (!objUrl) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        border: '1px dashed #ccc',
        borderRadius: 2,
        backgroundColor: '#f9f9f9',
        mb: 2
      }}>
        <Typography color="text.secondary">Modeling results will be displayed here</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ height: 300, border: '1px dashed #ccc', borderRadius: 2, backgroundColor: '#f9f9f9', overflow: 'hidden', mb: 2 }}>
      <ModelViewer objUrl={objUrl} />
    </Box>
  );
}

const OnlineBuilder = () => {
  const navigate = useNavigate();
  const neuronBg = NeuronBackground();
  const [tabValue, setTabValue] = useState(0);
  const [sourceType, setSourceType] = useState('local');
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('swc');
  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [userModels, setUserModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [buildResult, setBuildResult] = useState(null);
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [saveToPublic, setSaveToPublic] = useState(false);
  const [swcText, setSwcText] = useState('');
  const [buildMethod, setBuildMethod] = useState('MarchingCube');
  
  useEffect(() => {
    const fetchUserModels = async () => {
      setModelLoading(true);
      try {
        const response = await modelService.getUserModels();
        setUserModels(response.data);
      } catch (err) {
        console.error('Failed to fetch models:', err);
      } finally {
        setModelLoading(false);
      }
    };
    
    fetchUserModels();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // 检查文件扩展名
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      if ((fileType === 'swc' && extension === 'swc') || 
          (fileType === 'obj' && extension === 'obj')) {
        setFile(selectedFile);
        setError(null);
        // 新增：如果是swc，读取内容
        if (fileType === 'swc') {
          const reader = new FileReader();
          reader.onload = (e) => setSwcText(e.target.result);
          reader.readAsText(selectedFile);
        } else {
          setSwcText('');
        }
      } else {
        setFile(null);
        setError(`Please select a file in ${fileType.toUpperCase()} format`);
        setSwcText('');
      }
    }
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);
  };

  const handleBuild = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 设置模型名称，如果用户没有输入则使用默认名称
      const modelNameToUse = modelName || `New Model_${new Date().toISOString().slice(0, 10)}`;
      
      // 关键：根据建模方法传递 type
      const type = buildMethod === 'AdaptiveRefine' ? 'refine' : '';
      
      // 这里应该调用后端的建模API
      const response = await modelService.createModel({
        name: modelNameToUse,
        type,
        swcFile: file // 关键修正，传递文件对象
      });
      
      setBuildResult(response.data);
      setSuccess(true);
      setModelName(modelNameToUse);
      
    } catch (err) {
      setError('Modeling failed: ' + (err.response?.data || err.message));
      console.error('Modeling failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!buildResult || !buildResult.id) {
        throw new Error('No model to save');
      }
      
      // 如果已经保存到库中，直接导航
      if (saveToLibrary) {
        navigate(`/models/${buildResult.id}`);
      } else if (saveToPublic) {
        // 调用分享到公共库的API
        await modelService.shareToPublic(buildResult.id);
        navigate('/public-database');
      } else {
        // 如果都不保存，返回首页
        navigate('/');
      }
      
    } catch (err) {
      setError('Save failed: ' + (err.response?.data || err.message));
      console.error('Save failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // 直接下载 OBJ 文件，不跳转
    if (buildResult && buildResult.objFilePath) {
      fetch(buildResult.objFilePath)
        .then(res => res.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          let baseName = buildResult.name || 'model';
          let fileName = baseName;
          if (buildResult.objFilePath.includes('_refined.obj')) {
            fileName += '_refined.obj';
          } else {
            fileName += '.obj';
          }
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        });
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundImage: neuronBg,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
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
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Paper sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Online Neuron Modeling
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && buildResult && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Modeling successful! You can preview, save, or download the model.
            </Alert>
          )}
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>Step 1: Select Source File</Typography>
                
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                  <Tab label="Local File" />
                </Tabs>
                
                {tabValue === 0 && (
                  <Box>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>File Type</InputLabel>
                      <Select
                        value={fileType}
                        onChange={(e) => {
                          setFileType(e.target.value);
                          setFile(null);
                        }}
                      >
                        <MenuItem value="swc">SWC Format (Neuron Skeleton)</MenuItem>
                        <MenuItem value="obj">OBJ Format (3D Mesh Model)</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Box sx={{ 
                      border: '2px dashed #ccc', 
                      p: 3, 
                      textAlign: 'center',
                      borderRadius: 2,
                      backgroundColor: '#f9f9f9'
                    }}>
                      <input
                        type="file"
                        accept={fileType === 'swc' ? '.swc' : '.obj'}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button
                          variant="contained"
                          component="span"
                        >
                          Select SWC File
                        </Button>
                      </label>
                      
                      {file && (
                        <Typography variant="body1" sx={{ mt: 2 }}>
                          Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* 删除“MY MODEL LIBRARY”tab及其相关内容，只保留LOCAL FILE相关逻辑 */}
              </Box>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>Step 2: Set Modeling Parameters</Typography>
                
                <TextField
                  fullWidth
                  label="Model Name"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Model Description"
                  value={modelDescription}
                  onChange={(e) => setModelDescription(e.target.value)}
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                />
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Modeling Method</InputLabel>
                  <Select value={buildMethod} onChange={e => setBuildMethod(e.target.value)}>
                    <MenuItem value="MarchingCube">MarchingCube (Rough Modeling)</MenuItem>
                    <MenuItem value="AdaptiveRefine">AdaptiveRefine (Fine Modeling)</MenuItem>
                  </Select>
                </FormControl>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<BuildIcon />}
                  onClick={handleBuild}
                  disabled={loading || (!file)}
                  fullWidth
                >
                  Start Modeling
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="h6" gutterBottom>SWC 3D View</Typography>
                {fileType === 'swc' && tabValue === 0 && <Swc3DView swcText={swcText} />}
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Mesh 3D View</Typography>
                <Mesh3DView objUrl={buildResult && buildResult.objFilePath} loading={loading} />
              </Box>
              
              {buildResult && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Step 4: Save/Download Model
                  </Typography>
                  {/*
                  <Box sx={{ mb: 2 }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={saveToLibrary}
                        onChange={(e) => setSaveToLibrary(e.target.checked)}
                      />
                      {' '}Save to my model library
                    </label>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={saveToPublic}
                        onChange={(e) => setSaveToPublic(e.target.checked)}
                      />
                      {' '}Share to public database
                    </label>
                  </Box>
                  */}
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    fullWidth
                  >
                    Download Model
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>
        
        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            {buildResult?.name} - 3D Preview
          </DialogTitle>
          <DialogContent dividers sx={{ height: '70vh' }}>
            {buildResult && (
              <ModelViewer objUrl={buildResult.objFilePath} />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
            >
              Download Model
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default OnlineBuilder; 