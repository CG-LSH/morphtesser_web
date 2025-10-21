import React, { useState, useRef, useEffect } from 'react';
import { Container, Typography, Box, Button, Select, MenuItem, LinearProgress, Paper, Stack, FormControl, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, AppBar, Toolbar, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BuildIcon from '@mui/icons-material/Build';
import DownloadIcon from '@mui/icons-material/Download';
import StorageIcon from '@mui/icons-material/Storage';
import ExtensionIcon from '@mui/icons-material/Extension';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import modelService from '../services/model.service';
import NeuronBackground from '../assets/images/neuron-bg';
import ModelViewer from '../components/ModelViewer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';

// 错误边界组件
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('3D Viewer Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
    return (
      <Box sx={{
          height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: 1
        }}>
          <Typography variant="h6" color="error" gutterBottom>
            3D Rendering Error
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Unable to load 3D model preview.<br />
            Please refresh the page or try another browser.
          </Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Retry
          </Button>
      </Box>
    );
  }

    return this.props.children;
  }
}

const OnlineBuilder = () => {
  const navigate = useNavigate();
  const neuronBg = NeuronBackground();
  // 页面刷新后重置所有状态
  const [swcFiles, setSwcFiles] = useState([]);
  
  const [buildMethod, setBuildMethod] = useState(() => {
    // 强制默认选择 High
    return 'AdaptiveRefine';
  });
  
  const [buildResult, setBuildResult] = useState([]);
  
  const [fileStatuses, setFileStatuses] = useState({});
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [selectedModel, setSelectedModel] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewMode, setViewMode] = useState('obj'); // Default to MESH view
  const [isAborted, setIsAborted] = useState(false); // 用于跟踪建模是否被中止
  const [isZipping, setIsZipping] = useState(false); // 用于跟踪ZIP下载是否正在进行
  const modelViewerRef = useRef(null); // Add ref to directly access ModelViewer
  const abortControllerRef = useRef(null); // 用于中止HTTP请求

  // 页面刷新或跳转时停止后台任务并清理状态
  useEffect(() => {
    // 组件挂载时清理localStorage
    const cleanup = () => {
      localStorage.removeItem('onlineBuilder_swcFiles');
      localStorage.removeItem('onlineBuilder_buildMethod');
      localStorage.removeItem('onlineBuilder_buildResult');
      localStorage.removeItem('onlineBuilder_fileStatuses');
    };
    
    cleanup();
    
    // 页面卸载时中止所有后台任务
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('Aborting background tasks on page unload');
      }
    };
  }, []);

  // 同步fileStatuses与swcFiles，确保状态一致
  useEffect(() => {
    if (swcFiles.length > 0) {
      setFileStatuses(prev => {
        const updated = { ...prev };
        // 移除不存在的文件状态
        Object.keys(updated).forEach(fileName => {
          if (!swcFiles.some(file => file.name === fileName)) {
            delete updated[fileName];
          }
        });
        // 为新的文件添加默认状态
        swcFiles.forEach(file => {
          if (!updated[file.name]) {
            updated[file.name] = { status: 'ready', result: null };
          }
        });
        return updated;
      });
    }
  }, [swcFiles]);

  // 检查是否有建模完成或进行中的文件
  const hasModelingInProgress = () => {
    const statuses = Object.values(fileStatuses);
    return statuses.some(status => status.status === 'completed' || status.status === 'pending');
  };

  // 选择文件，支持多选，追加到swcFiles，并重置进度条
  const handleFileChange = (e) => {
    // 允许随时添加新文件
    const uploadTime = new Date(); // 记录上传时间
    
    const files = Array.from(e.target.files);
    setSwcFiles(prev => {
      const next = [...prev];
      files.forEach(file => {
        // 检查是否有重复文件名
        let fileName = file.name;
        let counter = 1;
        const baseName = fileName.replace(/\.swc$/i, '');
        const extension = '.swc';
        
        // 如果文件名已存在，添加序号
        while (next.some(f => f.name === fileName)) {
          fileName = `${baseName}(${counter})${extension}`;
          counter++;
        }
        
        // 创建新的文件对象，使用修改后的文件名，并添加上传时间
        const newFile = new File([file], fileName, { type: file.type, lastModified: file.lastModified });
        newFile.uploadTime = uploadTime; // 添加上传时间属性
        next.push(newFile);
      });
      console.log('handleFileChange, swcFiles:', next);
      return next;
    });
    // 初始化文件状态
    setFileStatuses(prev => {
      const next = { ...prev };
      files.forEach(file => {
        // 检查是否有重复文件名
        let fileName = file.name;
        let counter = 1;
        const baseName = fileName.replace(/\.swc$/i, '');
        const extension = '.swc';
        
        // 如果文件名已存在，添加序号
        while (next[fileName]) {
          fileName = `${baseName}(${counter})${extension}`;
          counter++;
        }
        
        next[fileName] = { status: 'ready', result: null, uploadTime: uploadTime };
      });
      return next;
    });
    // setProgress(0); // 只有选择文件时才归零
    e.target.value = '';
  };

  // 处理拖拽文件
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 允许随时添加新文件
    const uploadTime = new Date(); // 记录上传时间
    
    const files = Array.from(e.dataTransfer.files);
    const swcFiles = files.filter(file => file.name.toLowerCase().endsWith('.swc'));
    
    if (swcFiles.length > 0) {
      setSwcFiles(prev => {
        const next = [...prev];
        swcFiles.forEach(file => {
          // 检查是否有重复文件名
          let fileName = file.name;
          let counter = 1;
          const baseName = fileName.replace(/\.swc$/i, '');
          const extension = '.swc';
          
          // 如果文件名已存在，添加序号
          while (next.some(f => f.name === fileName)) {
            fileName = `${baseName}(${counter})${extension}`;
            counter++;
          }
          
          // 创建新的文件对象，使用修改后的文件名，并添加上传时间
          const newFile = new File([file], fileName, { type: file.type, lastModified: file.lastModified });
          newFile.uploadTime = uploadTime; // 添加上传时间属性
          next.push(newFile);
        });
        console.log('handleDrop, swcFiles:', next);
        return next;
      });
      // 初始化文件状态
      setFileStatuses(prev => {
        const next = { ...prev };
        swcFiles.forEach(file => {
          // 检查是否有重复文件名
          let fileName = file.name;
          let counter = 1;
          const baseName = fileName.replace(/\.swc$/i, '');
          const extension = '.swc';
          
          // 如果文件名已存在，添加序号
          while (next[fileName]) {
            fileName = `${baseName}(${counter})${extension}`;
            counter++;
          }
          
          next[fileName] = { status: 'ready', result: null, uploadTime: uploadTime };
        });
        return next;
      });
    } else {
      setError('Please drag and drop .swc format files');
    }
  };

  // 点击START，依次处理swcFiles中未处理的文件
  const handleBuild = async () => {
    setLoading(true);
    setError(null);
    setIsAborted(false);
    let newResults = [];
    
    // 创建AbortController用于中止请求
    abortControllerRef.current = new AbortController();

    try {
      // 只处理状态为 'ready' 的文件
      const readyFiles = swcFiles.filter(file => {
        const status = fileStatuses[file.name];
        return !status || status.status === 'ready';
      });

      for (let i = 0; i < readyFiles.length; i++) {
        // 检查是否被中止
        if (isAborted || abortControllerRef.current?.signal.aborted) {
          console.log('Modeling aborted');
          break;
        }
        
        const file = readyFiles[i];
        
        // 检查文件是否有效
        if (!file || !file.name) {
          console.log(`Invalid file: ${file?.name || 'unknown'}`);
          continue;
        }
        
        // 更新文件状态为处理中
        setFileStatuses(prev => ({
          ...prev,
          [file.name]: { status: 'pending', result: null }
        }));

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('swcFile', file);
          formData.append('name', file.name);
          formData.append('type', buildMethod === 'AdaptiveRefine' ? 'refine' : 'raw');
          formData.append('token', localStorage.getItem('token') || '');
          
          // 传递AbortSignal给请求
          const res = await modelService.createModelFromOnlineBuilder(formData, (p) => {}, abortControllerRef.current?.signal);
          let resultArr = Array.isArray(res.data) ? res.data : [res.data];
          for (let r of resultArr) {
            const objUrl = r.objUrl || r.objFilePath;
            let objSize = '';
            if (!objUrl) {
              setError('Out of memory: OBJ file was not generated. Modeling failed.');
              continue;
            }
            if (typeof r.objSize === 'number' && r.objSize > 0) {
              objSize = Number(r.objSize);
            } else if (objUrl) {
              try {
                const resp = await fetch(objUrl, { method: 'HEAD' });
                const size = resp.headers.get('content-length');
                if (size) objSize = Number(size);
              } catch {}
            }
            
            // 更新文件状态为完成
            setFileStatuses(prev => {
              // 获取所有已完成的文件名
              const existingResults = Object.values(prev)
                .filter(status => status.status === 'completed' && status.result)
                .map(status => status.result);
              
              return {
                ...prev,
                [file.name]: { 
                  status: 'completed', 
                  result: {
                      objUrl: r.objUrl || r.objFilePath,
                      dracoUrl: r.dracoUrl, // 添加 DRC URL，优先使用 DRC 渲染
                      swcUrl: r.swcUrl || r.swcFilePath,
                      size: objSize,
                    filename: getUniqueObjName(file.name, existingResults),
                    createdAt: new Date(),
                      ...r
                    }
                }
              };
            });
          }
        } catch (err) {
          setError('Out of memory: OBJ file was not generated. Modeling failed.');
          console.log('build error:', err);
          
          // 更新文件状态为失败
          setFileStatuses(prev => ({
            ...prev,
            [file.name]: { status: 'failed', result: null }
          }));
        }
      }
      // setProgress(100);
    } finally {
      setLoading(false);
      // 清理AbortController
      abortControllerRef.current = null;
    }
  };

  // 单个文件下载
  const handleDownloadSingle = (file) => {
    const objUrl = file.objUrl || file.objFilePath;
    if (!objUrl) return;
    fetch(objUrl)
        .then(res => res.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.filename || file.name || 'model';
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        });
  };

  // 查看3D模型
  const handleViewModel = (file) => {
    setSelectedModel(file);
    setViewerOpen(true);
    setViewMode('obj'); // Default to MESH view
  };

  // 处理视图模式切换
  const handleViewModeChange = (event, newValue) => {
    setViewMode(newValue);
  };

  // 处理Reset View
  const handleResetView = () => {
    console.log('Reset View clicked');
    if (modelViewerRef.current && modelViewerRef.current.resetView) {
      modelViewerRef.current.resetView();
    } else {
      console.log('ModelViewer ref or resetView method not available');
    }
  };


  // ZIP所有OBJ前端打包下载 - 从DRC解压为OBJ
  const handleZipAllMesh = async () => {
    // 获取所有已完成的文件
    const completedFiles = Object.values(fileStatuses)
      .filter(status => status.status === 'completed' && status.result);
    
    if (completedFiles.length === 0) return;
    
    setIsZipping(true); // 开始压缩，禁用按钮
    
    try {
      const zip = new JSZip();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      
      // 下载DRC文件，解压为OBJ，然后加入zip
      await Promise.all(completedFiles.map(async (fileStatus, idx) => {
        const file = fileStatus.result;
        
        // 优先使用DRC文件，如果没有则使用OBJ文件
        if (file.drcUrl) {
          try {
            // 下载DRC文件
            const drcResponse = await fetch(file.drcUrl);
            const drcArrayBuffer = await drcResponse.arrayBuffer();
            
            // 解压DRC为几何体
            const geometry = await new Promise((resolve, reject) => {
              dracoLoader.parse(drcArrayBuffer, resolve, reject);
            });
            
            // 将几何体转换为OBJ格式字符串
            const objString = geometryToObjString(geometry);
            
            let fname = file.filename || `model${idx+1}.obj`;
            if (!fname.toLowerCase().endsWith('.obj')) fname += '.obj';
            
            // 添加OBJ文件到zip（无损压缩）
            zip.file(fname, objString);
            
          } catch (drcError) {
            console.warn('DRC processing failed, falling back to OBJ:', drcError);
            // 如果DRC处理失败，回退到OBJ文件
            if (file.objUrl) {
              const response = await fetch(file.objUrl);
              const blob = await response.blob();
              let fname = file.filename || `model${idx+1}.obj`;
              if (!fname.toLowerCase().endsWith('.obj')) fname += '.obj';
              zip.file(fname, blob);
            }
          }
        } else if (file.objUrl) {
          // 如果没有DRC文件，直接使用OBJ文件
          const response = await fetch(file.objUrl);
          const blob = await response.blob();
          let fname = file.filename || `model${idx+1}.obj`;
          if (!fname.toLowerCase().endsWith('.obj')) fname += '.obj';
          zip.file(fname, blob);
        }
      }));
      
      // 生成ZIP文件（无损压缩）
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'STORE' // 无损压缩
      });
      saveAs(content, 'all_mesh.zip');
    } catch (error) {
      console.error('ZIP generation failed:', error);
      setError('Failed to create ZIP file');
    } finally {
      setIsZipping(false); // 完成压缩，恢复按钮
    }
  };

  // 将Three.js几何体转换为OBJ格式字符串
  const geometryToObjString = (geometry) => {
    const vertices = geometry.attributes.position.array;
    const normals = geometry.attributes.normal ? geometry.attributes.normal.array : null;
    const indices = geometry.index ? geometry.index.array : null;
    
    let objString = '';
    
    // 写入顶点
    for (let i = 0; i < vertices.length; i += 3) {
      objString += `v ${vertices[i]} ${vertices[i + 1]} ${vertices[i + 2]}\n`;
    }
    
    // 写入法向量
    if (normals) {
      for (let i = 0; i < normals.length; i += 3) {
        objString += `vn ${normals[i]} ${normals[i + 1]} ${normals[i + 2]}\n`;
      }
    }
    
    // 写入面
    if (indices) {
      for (let i = 0; i < indices.length; i += 3) {
        const v1 = indices[i] + 1;
        const v2 = indices[i + 1] + 1;
        const v3 = indices[i + 2] + 1;
        if (normals) {
          objString += `f ${v1}//${v1} ${v2}//${v2} ${v3}//${v3}\n`;
        } else {
          objString += `f ${v1} ${v2} ${v3}\n`;
        }
      }
    }
    
    return objString;
  };

  // 清空所有
  const handleClearResult = async () => {
    try {
      // 中止正在进行的建模过程
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('Modeling process aborted');
      }
      
      // 清空前端状态
    setBuildResult([]);
    setSwcFiles([]);
      setFileStatuses({});
    setError(null);
      setProgress(0);
      setLoading(false);
      setIsAborted(false);
      
      // 清空localStorage中的数据
      localStorage.removeItem('onlineBuilder_swcFiles');
      localStorage.removeItem('onlineBuilder_buildMethod');
      localStorage.removeItem('onlineBuilder_buildResult');
      localStorage.removeItem('onlineBuilder_fileStatuses');
      
      // 清空后端数据
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // 调用后端API清空数据
          await modelService.clearAllData(token);
          console.log('Backend data cleared successfully');
        } catch (error) {
          console.error('Failed to clear backend data:', error);
          // 即使后端清空失败，前端状态也要清空
        }
      }
    } catch (error) {
      console.error('Error in handleClearResult:', error);
      setError('Error occurred while clearing data');
    }
  };

  // 追加建模结果时
  const handleAddResults = (newResults) => {
    setBuildResult(prev => [...(Array.isArray(prev) ? prev : []), ...newResults]);
  };

  // 渲染前类型保护
  const safeBuildResult = Array.isArray(buildResult) ? buildResult : [];

  // 辅助函数：从路径提取文件名
  function getFileNameFromPath(path) {
    if (!path) return '';
    return path.split('/').pop();
  }

  // 辅助函数：swc文件名转obj文件名
  function getObjNameFromSwc(swcName) {
    if (!swcName) return '';
    const baseName = swcName.replace(/\.swc$/i, '');
    const suffix = buildMethod === 'AdaptiveRefine' ? '_H.obj' : '.obj';
    return baseName + suffix;
  }

  // 检查OBJ文件名是否重复，如果重复则添加序号
  function getUniqueObjName(swcName, existingResults = []) {
    let objName = getObjNameFromSwc(swcName);
    let counter = 1;
    const baseName = swcName.replace(/\.swc$/i, '');
    const suffix = buildMethod === 'AdaptiveRefine' ? '_H.obj' : '.obj';
    
    // 如果OBJ文件名已存在，添加序号
    while (existingResults.some(result => result.filename === objName)) {
      objName = `${baseName}(${counter})${suffix}`;
      counter++;
    }
    
    return objName;
  }

  return (
    <Box
      sx={{
      minHeight: '100vh',
      position: 'relative',
        display: 'flex',
      flexDirection: 'column',
        alignItems: 'center',
      justifyContent: 'flex-start',
      pt: '84px',
      pb: 4, // Leave space at bottom
      overflow: 'auto', // Allow scrolling
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        zIndex: 1,
        pointerEvents: 'none',
        minHeight: '100vh',
        height: 'auto'
      }
      }}
    >
      {/* Full Page Background Image */}
      <Box
        sx={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          background: `url('/assets/images/neuron-bg.png') center center/cover no-repeat`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.5,
          pointerEvents: 'none'
        }}
      />

      {/* Navigation Bar (same as Home) */}
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
        width: '100%',
        margin: 0,
        padding: 0
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
          <Tooltip title="MorphTesser - 3D Neuron Modeling Platform" arrow>
            <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
              flexGrow: { xs: 1, sm: 0 },
              minWidth: { xs: 'auto', sm: '200px' },
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': { transform: 'scale(1.05)' }
            }}
              onClick={() => navigate('/')}
              role="button"
              aria-label="Go Home"
            >
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
          </Tooltip>
          {/* Right Navigation Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 },
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            justifyContent: { xs: 'center', sm: 'flex-end' },
            width: { xs: '100%', sm: 'auto' },
            mt: { xs: 1, sm: 0 }
          }}>
                        <Tooltip title="Create and customize 3D neuron models with our online modeling tools" arrow>
              <Button
                color="inherit"
                startIcon={<BuildIcon />}
                onClick={() => navigate('/online-builder')}
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
                Online Modeling
              </Button>
            </Tooltip>
            <Tooltip title="Browse and download 3D neuron models from our public database" arrow>
              <Button
                color="inherit"
                startIcon={<StorageIcon />}
                onClick={() => navigate('/public-database')}
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
                Data Repository
              </Button>
            </Tooltip>
                <Tooltip title="Learn about our NeuroMorpho.Org browser extension for seamless 3D model integration" arrow>
                  <Button
                    color="inherit"
                    startIcon={<ExtensionIcon />}
                    onClick={() => navigate('/neuromorpho-plugin')}
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
                </Tooltip>
              </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          width: '100%',
          maxWidth: 1200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 2,
          position: 'relative',
          pointerEvents: 'auto',
          px: 4
        }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom
          sx={{
            color: 'white',
            fontWeight: 700,
            textShadow: '0 0 10px rgba(62, 118, 244, 0.8), 0 0 20px rgba(62, 118, 244, 0.5)',
            fontFamily: '"Orbitron", "Arial Black", "Arial", sans-serif',
            letterSpacing: '0.02em',
            marginBottom: { xs: 1.5, sm: 2, md: 2.5 },
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem', lg: '3rem', xl: '3.5rem' },
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
          Online Neuron Modeling
        </Typography>
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{
            color: 'white',
            opacity: 0.8,
            fontWeight: 300,
            letterSpacing: '0.05em',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            marginBottom: 4,
            fontSize: { xs: '1rem', sm: '1.2rem', md: '1.3rem' },
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
            maxWidth: { xs: '100%', sm: '80%', md: '70%' },
            mx: 'auto'
          }}
        >
          Upload SWC files and generate high-quality 3D neuron models with advanced reconstruction algorithms
        </Typography>
        {error && <Typography color="error" align="center" sx={{ color: '#ff6b6b', mb: 2 }}>{error}</Typography>}
        
        {/* 文件选择区域 */}
        <Box sx={{ 
          width: '100%', 
          maxWidth: 1200, 
          mx: 'auto', 
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4
        }}>
          {/* 文件选择区域 - 尽量铺满 */}
          <Box
            component="label"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              width: '100%',
              height: swcFiles.length > 0 ? 'auto' : 400,
              minHeight: 400,
              maxHeight: swcFiles.length > 0 ? 'none' : '70vh', // No max height limit when files exist
              border: '2px dashed rgba(255, 255, 255, 0.5)',
              borderRadius: 3,
              display: 'flex',
              alignItems: swcFiles.length > 0 ? 'stretch' : 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.8)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              },
              '&:active': {
                borderColor: 'rgba(62, 118, 244, 0.8)',
                backgroundColor: 'rgba(62, 118, 244, 0.1)'
              },
              zIndex: 10,
              position: 'relative',
              pointerEvents: 'auto'
            }}
          >
            <input 
              type="file" 
              accept=".swc" 
              hidden 
              onChange={handleFileChange} 
              id="file-upload" 
              multiple
              disabled={false}
            />
            {swcFiles.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 2
              }}>
                {/* Dashed Circle Plus Symbol */}
                <Box sx={{
                  width: 80,
                  height: 80,
                  border: '3px dashed rgba(255, 255, 255, 0.6)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.9)',
                    transform: 'scale(1.05)'
                  }
                }}>
                  {/* Horizontal line */}
                  <Box sx={{
                    position: 'absolute',
                    width: 30,
                    height: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 2
                  }} />
                  {/* Vertical line */}
                  <Box sx={{
                    position: 'absolute',
                    width: 3,
                    height: 30,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 2
                  }} />
          </Box>
                
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: 'white', 
                    textAlign: 'center',
                    fontWeight: 500,
                    fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' }
                  }}
                >
                  Select or Drag & Drop SWC Files
                </Typography>
        </Box>
            ) : (
              <Box sx={{ 
                width: '100%', 
                height: '100%', 
                p: 1, 
                overflow: 'auto',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2
              }}>
                <TableContainer>
                  <Table size="small">
              <TableHead>
                      <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <TableCell sx={{ fontWeight: 'bold', width: 40, color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>Filename</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 100, color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>File size</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 180, color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>Created at</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 100, color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                      {swcFiles.map((file, index) => {
                        const fileStatus = fileStatuses[file.name] || { status: 'ready', result: null };
                        return (
                          <TableRow key={`swc_${index}`} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}>
                            <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>{index + 1}</TableCell>
                            <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                              {fileStatus.status === 'completed' && fileStatus.result ? fileStatus.result.filename : file.name}
                            </TableCell>
                            <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                              {fileStatus.status === 'pending' ? (
                          <LinearProgress 
                            variant="indeterminate" 
                                  sx={{ 
                                    height: 4,
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: '#3f51b5'
                                    }
                                  }} 
                                />
                              ) : fileStatus.status === 'completed' && fileStatus.result ? (
                                (fileStatus.result.size / 1024 / 1024).toFixed(2) + ' MB'
                              ) : fileStatus.status === 'failed' ? (
                                'Failed'
                              ) : (
                                (file.size / 1024 / 1024).toFixed(2) + ' MB'
                        )}
                      </TableCell>
                            <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                              {fileStatus.status === 'pending' ? (
                          <LinearProgress 
                            variant="indeterminate" 
                                  sx={{ 
                                    height: 4,
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: '#3f51b5'
                                    }
                                  }} 
                                />
                              ) : fileStatus.status === 'completed' && fileStatus.result ? (
                                new Date(fileStatus.result.createdAt).toLocaleString()
                              ) : fileStatus.status === 'failed' ? (
                                'Failed'
                              ) : (
                                // 显示上传时间，如果没有上传时间则显示文件修改时间
                                (file.uploadTime || fileStatus.uploadTime || new Date(file.lastModified)).toLocaleString()
                        )}
                      </TableCell>
                            <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                              {fileStatus.status === 'pending' ? (
                          <LinearProgress 
                            variant="indeterminate" 
                                  sx={{ 
                                    height: 4,
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: '#3f51b5'
                                    }
                                  }} 
                                />
                              ) : fileStatus.status === 'failed' ? (
                                <Typography variant="caption" sx={{ color: '#ff6b6b' }}>Failed</Typography>
                              ) : fileStatus.status === 'completed' && fileStatus.result ? (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="View 3D model" arrow>
                            <IconButton
                              size="small"
                                      onClick={() => handleViewModel(fileStatus.result)}
                                      sx={{ 
                                        color: '#1976d2', 
                                        p: 0.5,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                          color: '#1565c0',
                                          transform: 'scale(1.1)',
                                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                                        }
                                      }}
                                    >
                                      <VisibilityIcon fontSize="small" />
                            </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Download OBJ file" arrow>
                            <IconButton
                              size="small"
                                      onClick={() => handleDownloadSingle(fileStatus.result)}
                                      sx={{ 
                                        color: '#4caf50', 
                                        p: 0.5,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                          color: '#388e3c',
                                          transform: 'scale(1.1)',
                                          boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                                        }
                                      }}
                                    >
                                      <DownloadIcon fontSize="small" />
                            </IconButton>
                                  </Tooltip>
                          </Box>
                              ) : (
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>Ready</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                        );
                      })}
              </TableBody>
            </Table>
          </TableContainer>
          </Box>
            )}
              </Box>

          {/* 质量选择区域 - 切换开关样式 */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%',
            mt: swcFiles.length > 0 ? 2 : 4,  // Reduce top margin when files exist, keep larger margin when no files
            transition: 'margin-top 0.3s ease',
            position: 'relative'
          }}>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'white', 
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                marginLeft: '-160px', // 向左移动更多
                fontSize: { xs: '0.9rem', sm: '1rem' },
                fontWeight: 700,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                pointerEvents: 'none'
              }}
            >
              Options:
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '4px',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              position: 'relative',
              zIndex: 10,
              pointerEvents: 'auto',
              boxShadow: '0 6px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                borderColor: 'rgba(255, 255, 255, 0.25)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
              }
            }}>
              {/* 背景滑块 */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '6px',
                  left: buildMethod === 'MarchingCube' ? '6px' : '50%',
                  width: 'calc(50% - 6px)',
                  height: 'calc(100% - 12px)',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
                  borderRadius: '6px',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 3px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.05) 100%)',
                    pointerEvents: 'none'
                  }
                }}
              />
              
              {/* Fast generation 选项 */}
              <Tooltip title="Fast generation mode - Quick processing with basic quality" arrow>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minWidth: '100px',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 2,
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      '& .text': {
                        color: buildMethod === 'MarchingCube' ? '#1a1a1a' : 'rgba(255, 255, 255, 0.9)'
                      }
                    }
                  }}
                  onClick={() => setBuildMethod('MarchingCube')}
                >
                  <Typography 
                    className="text"
                    variant="body2" 
                    sx={{ 
                      color: buildMethod === 'MarchingCube' ? '#1a1a1a' : 'rgba(255, 255, 255, 0.8)', 
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      fontWeight: buildMethod === 'MarchingCube' ? 700 : 500,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      letterSpacing: '0.02em',
                      textShadow: buildMethod === 'MarchingCube' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : '0 1px 2px rgba(0, 0, 0, 0.3)',
                      textAlign: 'center',
                      width: '100%'
                    }}
                  >
                    Fast
                  </Typography>
                </Box>
              </Tooltip>
              
              {/* High quality generation 选项 */}
              <Tooltip title="High quality generation mode - Slower processing with enhanced quality" arrow>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minWidth: '120px',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 2,
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      '& .text': {
                        color: buildMethod === 'AdaptiveRefine' ? '#1a1a1a' : 'rgba(255, 255, 255, 0.9)'
                      }
                    }
                  }}
                  onClick={() => setBuildMethod('AdaptiveRefine')}
                >
                  <Typography 
                    className="text"
                    variant="body2" 
                    sx={{ 
                      color: buildMethod === 'AdaptiveRefine' ? '#1a1a1a' : 'rgba(255, 255, 255, 0.8)', 
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      fontWeight: buildMethod === 'AdaptiveRefine' ? 700 : 500,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      letterSpacing: '0.02em',
                      textShadow: buildMethod === 'AdaptiveRefine' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : '0 1px 2px rgba(0, 0, 0, 0.3)',
                      textAlign: 'center',
                      width: '100%'
                    }}
                  >
                    High quality
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* 进度条 */}
        {progress > 0 && progress < 100 && (
          <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', mb: 4 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#3f51b5'
                }
              }} 
            />
            <Typography 
              variant="body2" 
              align="center" 
              sx={{ 
                mt: 1, 
                color: 'white',
                opacity: 0.8
              }}
            >
              {`Processing: ${progress.toFixed(0)}%`}
            </Typography>
          </Box>
        )}

        {/* 完成提示 */}
        {progress === 100 && (
          <Box sx={{ 
            width: '100%', 
            maxWidth: 1000, 
            mx: 'auto', 
            mb: 4,
            p: 2,
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            border: '1px solid rgba(76, 175, 80, 0.5)',
            borderRadius: 2
          }}>
            <Typography 
              variant="body1" 
              align="center" 
              sx={{ color: '#4caf50', fontWeight: 500 }}
            >
              Modeling completed successfully!
            </Typography>
          </Box>
        )}

        {/* 底部按钮区域 - 居中分散 */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          gap: 4,
          flexWrap: 'wrap',
          width: '100%',
          maxWidth: 1000,
          mx: 'auto',
          px: 2,
          position: 'relative',
          zIndex: 1001,
          pointerEvents: 'auto',
          mt: swcFiles.length > 0 ? 2 : 4,  // 有文件时减少上边距，无文件时保持较大边距
          transition: 'margin-top 0.3s ease'
        }}>
          <Button 
            variant="contained" 
            sx={{ 
              minWidth: 160, 
              height: 56,
              fontSize: 18, 
              backgroundColor: isZipping || Object.values(fileStatuses).some(status => status.status === 'pending' || status.status === 'ready') || Object.values(fileStatuses).filter(status => status.status === 'completed' && status.result).length === 0 
                ? '#9e9e9e !important' 
                : '#4caf50 !important', 
              border: isZipping || Object.values(fileStatuses).some(status => status.status === 'pending' || status.status === 'ready') || Object.values(fileStatuses).filter(status => status.status === 'completed' && status.result).length === 0 
                ? '2px solid #9e9e9e' 
                : '2px solid #4caf50',
              borderRadius: 4,
              boxShadow: isZipping || Object.values(fileStatuses).some(status => status.status === 'pending' || status.status === 'ready') || Object.values(fileStatuses).filter(status => status.status === 'completed' && status.result).length === 0 
                ? '0 2px 8px rgba(158, 158, 158, 0.3), 0 0 0 1px rgba(158, 158, 158, 0.2), 0 0 15px rgba(158, 158, 158, 0.1)' 
                : '0 4px 12px rgba(76, 175, 80, 0.3), 0 0 0 1px rgba(76, 175, 80, 0.2), 0 0 20px rgba(76, 175, 80, 0.1)',
              opacity: isZipping || Object.values(fileStatuses).some(status => status.status === 'pending' || status.status === 'ready') || Object.values(fileStatuses).filter(status => status.status === 'completed' && status.result).length === 0 
                ? 0.7 
                : 1,
              cursor: isZipping || Object.values(fileStatuses).some(status => status.status === 'pending' || status.status === 'ready') || Object.values(fileStatuses).filter(status => status.status === 'completed' && status.result).length === 0 
                ? 'not-allowed' 
                : 'pointer',
              '&:hover': isZipping || Object.values(fileStatuses).some(status => status.status === 'pending' || status.status === 'ready') || Object.values(fileStatuses).filter(status => status.status === 'completed' && status.result).length === 0 
                ? {} 
                : { 
                    backgroundColor: '#388e3c !important',
                    borderColor: '#388e3c',
                    boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4), 0 0 0 2px rgba(76, 175, 80, 0.3), 0 0 30px rgba(76, 175, 80, 0.2)',
                    transform: 'translateY(-2px)'
                  },
              '&:focus': isZipping || Object.values(fileStatuses).some(status => status.status === 'pending' || status.status === 'ready') || Object.values(fileStatuses).filter(status => status.status === 'completed' && status.result).length === 0 
                ? {} 
                : {
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3), 0 0 0 3px rgba(76, 175, 80, 0.4), 0 0 25px rgba(76, 175, 80, 0.3)'
                  },
              zIndex: 1002,
              position: 'relative',
              pointerEvents: 'auto',
              transition: 'all 0.3s ease',
              '@keyframes pulsate': {
                '0%': {
                  color: 'rgba(255, 255, 255, 1)',
                  textShadow: '0 0 4px rgba(255, 255, 255, 0.4), 0 0 8px rgba(255, 255, 255, 0.3), 0 0 12px rgba(255, 255, 255, 0.2)'
                },
                '50%': {
                  color: 'rgba(50, 50, 50, 1)',
                  textShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 16px rgba(255, 255, 255, 0.6), 0 0 24px rgba(255, 255, 255, 0.4)'
                },
                '100%': {
                  color: 'rgba(255, 255, 255, 1)',
                  textShadow: '0 0 4px rgba(255, 255, 255, 0.4), 0 0 8px rgba(255, 255, 255, 0.3), 0 0 12px rgba(255, 255, 255, 0.2)'
                }
              },
              '& .MuiButton-label': isZipping ? {
                animation: 'pulsate 1.5s ease-in-out infinite',
                textShadow: '0 0 4px rgba(255, 255, 255, 0.4), 0 0 8px rgba(255, 255, 255, 0.3), 0 0 12px rgba(255, 255, 255, 0.2)'
              } : {}
            }} 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('ZIP button clicked');
              handleZipAllMesh();
            }}
            disabled={isZipping || Object.values(fileStatuses).some(status => status.status === 'pending' || status.status === 'ready') || Object.values(fileStatuses).filter(status => status.status === 'completed' && status.result).length === 0}
          >
            <Box component="span" sx={isZipping ? {
              animation: 'pulsate 1.5s ease-in-out infinite',
              '@keyframes pulsate': {
                '0%': {
                  color: 'rgba(255, 255, 255, 1)',
                  textShadow: '0 0 4px rgba(255, 255, 255, 0.4), 0 0 8px rgba(255, 255, 255, 0.3), 0 0 12px rgba(255, 255, 255, 0.2)'
                },
                '50%': {
                  color: 'rgba(50, 50, 50, 1)',
                  textShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 16px rgba(255, 255, 255, 0.6), 0 0 24px rgba(255, 255, 255, 0.4)'
                },
                '100%': {
                  color: 'rgba(255, 255, 255, 1)',
                  textShadow: '0 0 4px rgba(255, 255, 255, 0.4), 0 0 8px rgba(255, 255, 255, 0.3), 0 0 12px rgba(255, 255, 255, 0.2)'
                }
              }
            } : {}}>
              {isZipping ? 'ZIPPING...' : 'ZIP ALL'}
            </Box>
          </Button>
          <Button
            variant="contained"
            sx={{ 
              minWidth: 160, 
              height: 56,
              fontSize: 18,
              backgroundColor: (swcFiles.length === 0 || loading || !Object.values(fileStatuses).some(status => status.status === 'ready')) 
                ? '#9e9e9e !important' 
                : '#2196f3 !important',
              border: (swcFiles.length === 0 || loading || !Object.values(fileStatuses).some(status => status.status === 'ready')) 
                ? '2px solid #9e9e9e' 
                : '2px solid #2196f3',
              borderRadius: 4,
              boxShadow: (swcFiles.length === 0 || loading || !Object.values(fileStatuses).some(status => status.status === 'ready')) 
                ? '0 2px 8px rgba(158, 158, 158, 0.3), 0 0 0 1px rgba(158, 158, 158, 0.2), 0 0 15px rgba(158, 158, 158, 0.1)' 
                : '0 4px 12px rgba(33, 150, 243, 0.3), 0 0 0 1px rgba(33, 150, 243, 0.2), 0 0 20px rgba(33, 150, 243, 0.1)',
              opacity: (swcFiles.length === 0 || loading || !Object.values(fileStatuses).some(status => status.status === 'ready')) 
                ? 0.7 
                : 1,
              cursor: (swcFiles.length === 0 || loading || !Object.values(fileStatuses).some(status => status.status === 'ready')) 
                ? 'not-allowed' 
                : 'pointer',
              '&:hover': (swcFiles.length === 0 || loading || !Object.values(fileStatuses).some(status => status.status === 'ready')) 
                ? {} 
                : { 
                    backgroundColor: '#1976d2 !important',
                    borderColor: '#1976d2',
                    boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4), 0 0 0 2px rgba(33, 150, 243, 0.3), 0 0 30px rgba(33, 150, 243, 0.2)',
                    transform: 'translateY(-2px)'
                  },
              '&:focus': (swcFiles.length === 0 || loading || !Object.values(fileStatuses).some(status => status.status === 'ready')) 
                ? {} 
                : {
                    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3), 0 0 0 3px rgba(33, 150, 243, 0.4), 0 0 25px rgba(33, 150, 243, 0.3)'
                  },
              zIndex: 1002,
              position: 'relative',
              pointerEvents: 'auto',
              transition: 'all 0.3s ease',
              '@keyframes pulsate': {
                '0%': {
                  color: 'rgba(255, 255, 255, 1)',
                  textShadow: '0 0 4px rgba(255, 255, 255, 0.4), 0 0 8px rgba(255, 255, 255, 0.3), 0 0 12px rgba(255, 255, 255, 0.2)'
                },
                '50%': {
                  color: 'rgba(50, 50, 50, 1)',
                  textShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 16px rgba(255, 255, 255, 0.6), 0 0 24px rgba(255, 255, 255, 0.4)'
                },
                '100%': {
                  color: 'rgba(255, 255, 255, 1)',
                  textShadow: '0 0 4px rgba(255, 255, 255, 0.4), 0 0 8px rgba(255, 255, 255, 0.3), 0 0 12px rgba(255, 255, 255, 0.2)'
                }
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('START button clicked');
              handleBuild();
            }}
            disabled={swcFiles.length === 0 || loading || !Object.values(fileStatuses).some(status => status.status === 'ready')}
          >
            <Box component="span" sx={loading ? {
              animation: 'pulsate 1.5s ease-in-out infinite',
              '@keyframes pulsate': {
                '0%': {
                  color: 'rgba(255, 255, 255, 1)',
                  textShadow: '0 0 4px rgba(255, 255, 255, 0.4), 0 0 8px rgba(255, 255, 255, 0.3), 0 0 12px rgba(255, 255, 255, 0.2)'
                },
                '50%': {
                  color: 'rgba(50, 50, 50, 1)',
                  textShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 16px rgba(255, 255, 255, 0.6), 0 0 24px rgba(255, 255, 255, 0.4)'
                },
                '100%': {
                  color: 'rgba(255, 255, 255, 1)',
                  textShadow: '0 0 4px rgba(255, 255, 255, 0.4), 0 0 8px rgba(255, 255, 255, 0.3), 0 0 12px rgba(255, 255, 255, 0.2)'
                }
              }
            } : {}}>
              {loading ? 'MODELING...' : 'START'}
            </Box>
          </Button>
          <Button 
            variant="contained" 
            sx={{ 
              minWidth: 160, 
              height: 56,
              fontSize: 18,
              backgroundColor: (swcFiles.length === 0 && Object.values(fileStatuses).length === 0) 
                ? '#9e9e9e !important' 
                : '#d32f2f !important',
              border: (swcFiles.length === 0 && Object.values(fileStatuses).length === 0) 
                ? '2px solid #9e9e9e' 
                : '2px solid #d32f2f',
              borderRadius: 4,
              boxShadow: (swcFiles.length === 0 && Object.values(fileStatuses).length === 0) 
                ? '0 2px 8px rgba(158, 158, 158, 0.3), 0 0 0 1px rgba(158, 158, 158, 0.2), 0 0 15px rgba(158, 158, 158, 0.1)' 
                : '0 4px 12px rgba(211, 47, 47, 0.3), 0 0 0 1px rgba(211, 47, 47, 0.2), 0 0 20px rgba(211, 47, 47, 0.1)',
              opacity: (swcFiles.length === 0 && Object.values(fileStatuses).length === 0) 
                ? 0.7 
                : 1,
              cursor: (swcFiles.length === 0 && Object.values(fileStatuses).length === 0) 
                ? 'not-allowed' 
                : 'pointer',
              '&:hover': (swcFiles.length === 0 && Object.values(fileStatuses).length === 0) 
                ? {} 
                : { 
                    backgroundColor: '#c62828 !important',
                    borderColor: '#c62828',
                    boxShadow: '0 6px 16px rgba(211, 47, 47, 0.4), 0 0 0 2px rgba(211, 47, 47, 0.3), 0 0 30px rgba(211, 47, 47, 0.2)',
                    transform: 'translateY(-2px)'
                  },
              '&:focus': (swcFiles.length === 0 && Object.values(fileStatuses).length === 0) 
                ? {} 
                : {
                    boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3), 0 0 0 3px rgba(211, 47, 47, 0.4), 0 0 25px rgba(211, 47, 47, 0.3)'
                  },
              zIndex: 1002,
              position: 'relative',
              pointerEvents: 'auto',
              transition: 'all 0.3s ease'
            }} 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('CLEAR button clicked');
              handleClearResult();
            }}
            disabled={swcFiles.length === 0 && Object.values(fileStatuses).length === 0}
          >
            CLEAR
          </Button>
        </Box>
      </Box>

      {/* 3D模型查看器对话框 - 可调整大小 */}
      <Dialog
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        maxWidth={false}
        fullWidth={false}
        PaperProps={{
          sx: {
            width: '90vw',
            height: '90vh',
            maxWidth: 'none',
            maxHeight: 'none',
            margin: '16px 24px',
            borderRadius: 2,
            backgroundColor: 'white',
            resize: 'both',
            overflow: 'auto',
            minWidth: '400px',
            minHeight: '300px',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 20,
              height: 20,
              cursor: 'nwse-resize',
              background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.2) 50%)',
              pointerEvents: 'none',
              zIndex: 1000
            }
          }
        }}
      >
        <DialogContent dividers sx={{ height: '100%', p: 0, backgroundColor: 'white', overflow: 'hidden' }}>
          {selectedModel && (
            <Box sx={{ height: '100%', position: 'relative' }}>
              {/* 顶部控制区域 - 无背景 */}
              <Box sx={{ 
                position: 'absolute', 
                top: 8, 
                left: 8, 
                right: 8, 
                zIndex: 10, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                {/* 左侧：标题和标签页 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: 'black', fontSize: '0.8rem' }}>
                    {selectedModel?.filename}
                  </Typography>
                  <Tabs 
                    value={viewMode} 
                    onChange={handleViewModeChange}
                    sx={{ 
                      minHeight: 'auto',
                      '& .MuiTab-root': { 
                        color: 'black', 
                        fontSize: '0.7rem',
                        minHeight: 'auto',
                        padding: '6px 12px',
                        border: '1px solid rgba(0,0,0,0.2)',
                        borderRadius: '20px',
                        marginRight: '8px',
                        height: 32,
                        backgroundColor: 'rgba(0,0,0,0.03)',
                        textTransform: 'none',
                        fontWeight: 'normal',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.06)',
                          borderColor: 'rgba(0,0,0,0.4)'
                        }
                      },
                      '& .MuiTab-root.Mui-selected': { 
                        backgroundColor: 'rgba(0,0,0,0.08)',
                        color: 'black',
                        fontWeight: 'bold',
                        borderColor: 'black'
                      },
                      '& .MuiTabs-indicator': { display: 'none' }
                    }}
                    size="small"
                  >
                    {selectedModel.swcUrl && (
                      <Tab value="swc" label="SWC" />
                    )}
                    {selectedModel.objUrl && (
                      <Tab value="obj" label="MESH" />
                    )}
                    {selectedModel.swcUrl && selectedModel.objUrl && (
                      <Tab value="both" label="BOTH" />
                    )}
                  </Tabs>
                  </Box>
                
                {/* 右侧：控制按钮 */}
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ 
                      color: 'black', 
                      borderColor: 'rgba(0,0,0,0.2)',
                      fontSize: '0.7rem',
                      py: 0.5,
                      px: 1.5,
                      border: '1px solid rgba(0,0,0,0.2)',
                      minWidth: 'auto',
                      height: 32,
                      backgroundColor: 'rgba(0,0,0,0.02)',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        borderColor: 'rgba(0,0,0,0.4)'
                      }
                    }}
                    onClick={handleResetView}
                  >
                    Reset View
                  </Button>
                  <Box sx={{ width: 16 }} /> {/* Reduce spacing */}
                  <IconButton
                    size="small"
                    onClick={() => setViewerOpen(false)}
                    sx={{ 
                      color: 'black',
                      border: '1px solid rgba(0,0,0,0.2)',
                      width: 32,
                      height: 32,
                      backgroundColor: 'rgba(0,0,0,0.02)',
                      borderRadius: '50%',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.06)',
                        borderColor: 'rgba(0,0,0,0.4)',
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <CloseIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Box>
              </Box>

              {/* Bottom download button removed, should leave blank placeholder or remove entire area, directly removed here */}
              
              {/* 3D viewer - occupies entire area */}
              <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
                <ErrorBoundary>
                  <ModelViewer
                    objUrl={selectedModel.dracoUrl ? null : selectedModel.objUrl}
                    dracoUrl={selectedModel.dracoUrl}
                    swcUrl={selectedModel.swcUrl}
                    viewMode={viewMode}
                    width="100%"
                    height="100%"
                    backgroundColor={0xffffff}
                    wireframeMode={false}
                    useEdgeSplit={true} // 在线建模专用：启用 EdgeSplitModifier
                    ref={modelViewerRef} // 将ref传递给ModelViewer
                  />
                </ErrorBoundary>
                
                {/* Help icon in bottom left corner */}
                <Tooltip 
                  title={
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                        View Controls:
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        • Mouse: Rotate view
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        • Scroll: Zoom in/out
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        • Right-click + drag: Pan view
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        • Double-click object: Focus on object
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        • Double-click empty: Reset view
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        • Shift + Left-click + drag: Move view
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        • Reset View: Return to initial position
                      </Typography>
                    </Box>
                  } 
                  arrow
                  placement="top"
                >
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      width: 40,
                      height: 40,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.3s ease',
                      zIndex: 5
                    }}
                  >
                    <HelpOutlineIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            )}
          </DialogContent>
        </Dialog>
    </Box>
  );
};

export default OnlineBuilder; 