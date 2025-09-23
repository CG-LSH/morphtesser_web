import React, { useState, useRef } from 'react';
import { Container, Typography, Box, Button, Select, MenuItem, LinearProgress, Paper, Stack, FormControl, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import modelService from '../services/model.service';
import NeuronBackground from '../assets/images/neuron-bg';
import ModelViewer from '../components/ModelViewer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
            3D 渲染错误
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            无法加载 3D 模型预览。<br />
            请尝试刷新页面或使用其他浏览器。
          </Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            重试
          </Button>
      </Box>
    );
  }

    return this.props.children;
  }
}

const OnlineBuilder = () => {
  const neuronBg = NeuronBackground();
  const [swcFiles, setSwcFiles] = useState([]); // 唯一且在顶部
  // 移除file和swcText相关的useState
  // const [file, setFile] = useState(null);
  // const [swcText, setSwcText] = useState('');
  const [buildMethod, setBuildMethod] = useState('MarchingCube');
  const [loading, setLoading] = useState(false);
  const [buildResult, setBuildResult] = useState([]);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewMode, setViewMode] = useState('obj'); // 默认显示MESH视图
  const modelViewerRef = useRef(null); // 添加ref来直接访问ModelViewer

  // 选择文件，支持多选，追加到swcFiles，并重置进度条
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSwcFiles(prev => {
      const next = [...prev, ...files];
      console.log('handleFileChange, swcFiles:', next);
      return next;
    });
    // setProgress(0); // 只有选择文件时才归零
    e.target.value = '';
  };

  // 点击START，依次处理swcFiles中未处理的文件
  const handleBuild = async () => {
    setLoading(true);
    setError(null);
    let newResults = [];
    // const interval = setInterval(() => {
    //   setProgress(val => Math.min(val + 1, 90));
    // }, 100);

    try {
      for (let i = 0; i < swcFiles.length; i++) {
        const file = swcFiles[i];
        
        // 立即添加一个待处理的行到列表中
        const pendingResult = {
          id: `pending_${Date.now()}_${i}`,
          filename: getObjNameFromSwc(file.name),
          status: 'pending',
          createdAt: new Date()
        };
        
        setBuildResult(prev => {
          const next = [...(Array.isArray(prev) ? prev : []), pendingResult];
          return next;
        });

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('swcFile', file);
          formData.append('name', file.name);
          formData.append('type', buildMethod === 'AdaptiveRefine' ? 'refine' : 'raw');
          formData.append('token', localStorage.getItem('token') || '');
          const res = await modelService.createModelFromOnlineBuilder(formData, (p) => {});
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
            
            // 更新对应的待处理行
            setBuildResult(prev => {
              const next = prev.map(item => 
                item.id === pendingResult.id 
                  ? {
                      ...item,
                      objUrl: r.objUrl || r.objFilePath,
                      swcUrl: r.swcUrl || r.swcFilePath,
                      size: objSize,
                      status: 'completed',
                      ...r
                    }
                  : item
              );
              return next;
            });
          }
        } catch (err) {
          setError('Out of memory: OBJ file was not generated. Modeling failed.');
          console.log('build error:', err);
          
          // 更新状态为失败
          setBuildResult(prev => {
            const next = prev.map(item => 
              item.id === pendingResult.id 
                ? { ...item, status: 'failed' }
                : item
            );
            return next;
          });
        }
      }
      setSwcFiles([]);
      // setProgress(100);
    } finally {
      setLoading(false);
      // clearInterval(interval);
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
          a.download = (file.filename || file.name || 'model') + '.obj';
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
    setViewMode('obj'); // 默认显示MESH视图
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

  // 处理Focus Soma
  const handleFocusSoma = () => {
    console.log('Focus Soma clicked');
    if (modelViewerRef.current && modelViewerRef.current.focusSoma) {
      modelViewerRef.current.focusSoma();
    } else {
      console.log('ModelViewer ref or focusSoma method not available');
    }
  };

  // ZIP所有OBJ前端打包下载
  const handleZipAllMesh = async () => {
    if (!buildResult || buildResult.length === 0) return;
    const zip = new JSZip();
    // 下载所有obj并加入zip
    await Promise.all(buildResult.map(async (file, idx) => {
      if (file.objUrl) {
        const response = await fetch(file.objUrl);
        const blob = await response.blob();
        let fname = file.filename || `model${idx+1}.obj`;
        if (!fname.toLowerCase().endsWith('.obj')) fname += '.obj'; // 确保只有一个.obj后缀
        zip.file(fname, blob);
      }
    }));
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'all_mesh.zip');
  };

  // 清空所有
  const handleClearResult = () => {
    setBuildResult([]);
    setSwcFiles([]);
    setError(null);
    // 不清零进度条，只有在重新选择文件时才清零
    // setProgress(0);
    // setSwcText 已移除，无需再调用
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
    return swcName.replace(/\.swc$/i, '.obj');
  }

  return (
    <Box
      sx={{
      minHeight: '100vh',
      position: 'relative',
      py: 4,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
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
      }}
    >
      <Paper
        sx={{
          p: 6,
          backgroundColor: 'rgba(255,255,255,0.97)',
          width: '90vw',
          maxWidth: 1050,
          minHeight: '95vh',
          borderRadius: 4,
          boxShadow: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 2
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>Online Neuron Modeling</Typography>
        {error && <Typography color="error" align="center">{error}</Typography>}
        {/* 操作区和进度条区整体居中，且与标题对齐 */}
        <Box sx={{ width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ width: 'auto', minWidth: 600, maxWidth: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 'auto' }}>
            {/* 按钮区 */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 4, mb: 4 }}>
                        <Button
                          variant="contained"
                size="large"
                component="label"
                sx={{ width: 180, height: 48, fontSize: 18, whiteSpace: 'nowrap' }}
                        >
                SELECT SWC FILE
                <input type="file" accept=".swc" hidden onChange={handleFileChange} id="file-upload" />
                        </Button>
              <Box sx={{ width: 96, display: 'flex', justifyContent: 'center' }}>
                <ArrowForwardIcon sx={{ color: 'black', fontSize: 32 }} />
              </Box>
              <FormControl sx={{ width: 180 }} size="large">
                <Select
                  value={buildMethod}
                  onChange={e => setBuildMethod(e.target.value)}
                  sx={{ height: 48, fontSize: 18, width: 180, whiteSpace: 'nowrap' }}
                >
                    <MenuItem value="MarchingCube">Low Quality Modeling</MenuItem>
                    <MenuItem value="AdaptiveRefine">High Quality Modeling</MenuItem>
                  </Select>
                </FormControl>
              <Box sx={{ width: 96, display: 'flex', justifyContent: 'center' }}>
                <ArrowForwardIcon sx={{ color: 'black', fontSize: 32 }} />
              </Box>
                <Button
                  variant="contained"
                size="large"
                  color="primary"
                sx={{ width: 180, height: 48, fontSize: 18, whiteSpace: 'nowrap' }}
                  onClick={handleBuild}
                disabled={swcFiles.length === 0 || loading}
                >
                START
                </Button>
              </Box>
          </Box>
        </Box>
        {/* 建模结果表格列表展示（始终渲染） */}
        <Box sx={{ mt: 6, width: '100%', maxWidth: 800, mx: 'auto' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>List of files</Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: 60 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Filename</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Filesize</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 180 }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {safeBuildResult.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No results yet</TableCell>
                  </TableRow>
                ) : (
                  safeBuildResult.map((file, idx) => (
                    <TableRow key={file.id || idx}>
                      <TableCell sx={{ fontWeight: 'bold' }}>{idx + 1}</TableCell>
                      <TableCell>{file.filename}</TableCell>
                      <TableCell>
                        {file.status === 'pending' ? (
                          <LinearProgress 
                            variant="indeterminate" 
                            sx={{ width: '100%', height: 8 }}
                          />
                        ) : file.status === 'failed' ? (
                          <Typography color="error" variant="body2">Failed</Typography>
                        ) : (
                          file.size ? (file.size / 1024 / 1024).toFixed(2) + 'MB' : ''
                        )}
                      </TableCell>
                      <TableCell>
                        {file.status === 'pending' ? (
                          <LinearProgress 
                            variant="indeterminate" 
                            sx={{ width: '100%', height: 8 }}
                          />
                        ) : file.status === 'failed' ? (
                          <Typography color="error" variant="body2">Failed</Typography>
                        ) : (
                          file.createdAt ? new Date(file.createdAt).toLocaleString() : ''
                        )}
                      </TableCell>
                      <TableCell>
                        {file.status === 'pending' ? (
                          <LinearProgress 
                            variant="indeterminate" 
                            sx={{ width: '100%', height: 8 }}
                          />
                        ) : file.status === 'failed' ? (
                          <Typography color="error" variant="body2">Failed</Typography>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewModel(file)}
                              sx={{ color: '#1976d2' }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadSingle(file)}
                              sx={{ color: '#4caf50' }}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button variant="contained" sx={{ minWidth: 180, fontSize: 18, backgroundColor: '#004d40', '&:hover': { backgroundColor: '#00332c' } }} onClick={handleZipAllMesh}>ZIP ALL MESH</Button>
            <Button variant="contained" color="error" sx={{ minWidth: 180, fontSize: 18 }} onClick={handleClearResult}>CLEAR</Button>
          </Box>
              </Box>
      </Paper>

      {/* 3D模型查看器对话框 - 与数据库页面保持一致 */}
      <Dialog
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            width: '100vw',
            height: '100vh',
            maxWidth: 'none',
            maxHeight: 'none',
            margin: 0,
            borderRadius: 0,
            position: 'fixed',
            top: 0,
            left: 0,
            backgroundColor: 'black'
          }
        }}
      >
        <DialogContent dividers sx={{ height: '100vh', p: 0, backgroundColor: 'white' }}>
          {selectedModel && (
            <Box sx={{ height: '100%', position: 'relative' }}>
              {/* 顶部控制区域 - 白色背景 */}
              <Box sx={{ 
                position: 'absolute', 
                top: 8, 
                left: 8, 
                right: 8, 
                zIndex: 10, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 1,
                px: 2,
                py: 1
              }}>
                {/* 左侧：标题和标签页 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: 'white', fontSize: '0.8rem' }}>
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
                      border: '1px solid rgba(255,255,255,0.3)',
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
                  <Button
                    variant="outlined" 
                    size="small" 
                    sx={{ 
                      color: 'black', 
                      borderColor: 'rgba(0,0,0,0.2)',
                      fontSize: '0.7rem',
                      py: 0.5,
                      px: 1.5,
                      border: '1px solid rgba(255,255,255,0.3)',
                      minWidth: 'auto',
                      height: 32,
                      backgroundColor: 'rgba(0,0,0,0.02)',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        borderColor: 'rgba(0,0,0,0.4)'
                      }
                    }}
                    onClick={handleFocusSoma}
                  >
                    Focus Soma
                  </Button>
                  <Box sx={{ width: 16 }} /> {/* 减少间距 */}
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

              {/* 底部下载按钮删除，应留空白占位或去除整个区域，这里直接移除 */}
              
              {/* 3D查看器 - 占据整个区域 */}
              <Box sx={{ height: '100%', width: '100%' }}>
                <ErrorBoundary>
                  <ModelViewer
                    objUrl={selectedModel.objUrl}
                    dracoUrl={selectedModel.dracoUrl}
                    swcUrl={selectedModel.swcUrl}
                    viewMode={viewMode}
                    width="100%"
                    height="100%"
                    backgroundColor={0xffffff}
                    ref={modelViewerRef} // 将ref传递给ModelViewer
                  />
                </ErrorBoundary>
              </Box>
            </Box>
            )}
          </DialogContent>
        </Dialog>
    </Box>
  );
};

export default OnlineBuilder; 