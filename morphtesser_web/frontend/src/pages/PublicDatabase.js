import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, CardActions, 
  Button, Box, CircularProgress, Alert, TextField, InputAdornment,
  CardMedia, Chip, Pagination, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Tabs, Tab, FormControl, InputLabel, Select, MenuItem,
  CardActionArea
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import NeuronBackground from '../assets/images/neuron-bg';
import ModelViewer from '../components/ModelViewer';
import SimpleModelViewer from '../components/SimpleModelViewer';
import modelService from '../services/model.service';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ModelCard from '../components/ModelCard';

function downloadFile(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename || url.split('/').pop());
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadFileByFetch(url, filename) {
  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || url.split('/').pop();
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    });
}

const PublicDatabase = () => {
  const [tabValue, setTabValue] = useState(0);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedModel, setSelectedModel] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [fileType, setFileType] = useState('all');
  const [species, setSpecies] = useState('all');
  const [brainRegion, setBrainRegion] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('swc');
  const itemsPerPage = 6;
  const neuronBg = NeuronBackground();
  const [publicFiles, setPublicFiles] = useState([]);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  useEffect(() => {
    const fetchPublicModels = async () => {
      try {
        setLoading(true);
        // 直接请求后端数据库接口
        const res = await axios.get('/api/models/public');
        setModels(res.data);
        setLoading(false);
      } catch (error) {
        console.error('获取公共模型失败:', error);
        setError('获取公共模型失败，请稍后重试');
        setLoading(false);
      }
    };
    fetchPublicModels();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleFileTypeChange = (event) => {
    setFileType(event.target.value);
    setPage(1);
  };

  const handleSpeciesChange = (event) => {
    setSpecies(event.target.value);
    setPage(1);
  };

  const handleBrainRegionChange = (event) => {
    setBrainRegion(event.target.value);
    setPage(1);
  };

  const handleViewModeChange = (event, newValue) => {
    setViewMode(newValue);
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setViewerOpen(true);
  };

  const handleDownload = (model, type) => {
    const url = type === 'swc' ? model.swcUrl : model.objUrl;
    if (url) {
      downloadFile(url, (model.name || 'model') + '.' + type);
    }
  };

  const filteredModels = models.filter(model => {
    // 搜索词过滤
    const matchesSearch = 
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (model.description && model.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // 文件类型过滤
    const matchesFileType = 
      fileType === 'all' || 
      (fileType === 'swc' && model.swcFilePath) ||
      (fileType === 'obj' && model.objFilePath) ||
      (fileType === 'both' && model.fileType === 'both');
    
    // 物种过滤
    const matchesSpecies = species === 'all' || model.species === species;
    
    // 脑区过滤
    const matchesBrainRegion = brainRegion === 'all' || model.brainRegion === brainRegion;
    
    return matchesSearch && matchesFileType && matchesSpecies && matchesBrainRegion;
  });

  // 排序逻辑
  const sortedModels = [...filteredModels].sort((a, b) => {
    let v1 = a[sortField], v2 = b[sortField];
    if (sortField === 'createdAt') {
      v1 = new Date(v1).getTime();
      v2 = new Date(v2).getTime();
    }
    if (sortField === 'name') {
      if (v1 < v2) return sortOrder === 'asc' ? -1 : 1;
      if (v1 > v2) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    }
    // 数字比较
    return sortOrder === 'asc' ? v1 - v2 : v2 - v1;
  });

  // 分页用sortedModels
  const pageCount = Math.ceil(sortedModels.length / itemsPerPage);
  const displayedModels = sortedModels.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // 提取唯一的物种和脑区列表
  const speciesList = ['all', ...new Set(models.map(model => model.species))];
  const brainRegionList = ['all', ...new Set(models.map(model => model.brainRegion))];

  // 示例模型数据
  const publicModels = [
    {
      id: 1,
      name: '标准球体参考模型',
      description: '用于测试和校准的标准球体模型，半径为1.0单位',
      objFilePath: '/models/sphere.obj',
      swcFilePath: '/models/sphere.swc',
      fileType: 'both',
      createdAt: new Date().toISOString(),
      species: '通用',
      brainRegion: '参考模型',
      contributor: '刘泗虎',
      length: 12.56,
      surfaceArea: 12.56,
      volume: 4.19
    },
    {
      id: 2,
      name: '小鼠皮层锥体细胞',
      description: '来自小鼠体感皮层的锥体神经元',
      objFilePath: '/models/sphere.obj',
      swcFilePath: '/models/sphere.swc',
      fileType: 'both',
      createdAt: new Date().toISOString(),
      species: '小鼠',
      brainRegion: '皮层',
      contributor: '张三',
      length: 1023.45,
      surfaceArea: 3245.67,
      volume: 567.89
    },
    {
      id: 3,
      name: '大鼠海马CA1锥体细胞',
      description: '从大鼠海马CA1区域重建的锥体神经元',
      objFilePath: '/models/sphere.obj',
      fileType: 'obj',
      createdAt: new Date().toISOString(),
      species: '大鼠',
      brainRegion: '海马',
      contributor: '李四',
      length: 876.54,
      surfaceArea: 2345.67,
      volume: 432.1
    }
  ];

  // 渲染模型预览
  const ModelPreview = ({ model }) => {
    // 如果有预览图URL，使用图片
    if (model.previewUrl && model.previewUrl !== "/static/images/neuron-placeholder.png") {
      return (
        <CardMedia
          component="img"
          height="200"
          image={model.previewUrl}
          alt={model.name}
        />
      );
    }
    
    // 如果有OBJ模型URL，使用神经元图标
    if (model.objFilePath) {
      return (
        <Box sx={{ 
          height: 200, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f5f5f5'
        }}>
          <ThreeDRotationIcon sx={{ fontSize: 60, color: '#3f51b5' }} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            3D model available
          </Typography>
          <Typography variant="caption" sx={{ mt: 0.5 }}>
            Click to view
          </Typography>
        </Box>
      );
    }
    
    // 默认显示占位图
    return (
      <CardMedia
        component="img"
        height="200"
        image={`${process.env.PUBLIC_URL}/static/images/neuron-placeholder.png`}
        alt={model.name}
      />
    );
  };

  // 渲染公开目录下所有文件（卡片样式与数据库模型一致）
  const renderPublicFiles = () => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>Public Directory SWC/OBJ Files</Typography>
      <Grid container spacing={2}>
        {publicFiles.map(file => (
          <Grid item xs={12} sm={6} md={4} key={file.name}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ThreeDRotationIcon sx={{ fontSize: 40, mr: 1 }} color="primary" />
                  <Typography variant="h6" noWrap>{file.name}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Type: {file.type} &nbsp; Size: {(file.size/1024/1024).toFixed(2)} MB
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  <Chip label={file.type} color={file.type === 'OBJ' ? 'error' : 'primary'} size="small" />
                  <Chip label="Public Directory" color="default" size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  <i>No description</i>
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" href={file.url} target="_blank" startIcon={<DownloadIcon />}>Download/Preview</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  // 渲染模型卡片，全部用ModelCard
  const renderModelCard = (model) => (
    <Grid item xs={12} sm={6} md={4} key={model.id}>
      <ModelCard model={model} onPreview={handleModelSelect} />
    </Grid>
  );

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
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ 
            color: 'white',
            textAlign: 'center',
            mb: 4,
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(0, 0, 0, 0.5)'
          }}
        >
          Neuron Model Public Database
        </Typography>
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 4, 
          '& .MuiTab-root': { color: 'white' },
          '& .Mui-selected': { color: '#3f51b5 !important', fontWeight: 'bold' }
        }}>
          <Tab label="Public Models" />
          <Tab label="Standard Models" />
          <Tab label="Reference Models" />
        </Tabs>
        
        {tabValue === 0 && (
          <>
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Loading public models...
                </Typography>
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : models.length === 0 ? (
              <Alert severity="info">
                No public models yet. You can upload models and select "Add to Browse Database" to share your models.
              </Alert>
            ) : (
              <>
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    mb: showFilters ? 2 : 0
                  }}>
                    <TextField
                      fullWidth
                      placeholder="Search model name or description..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                        sx: { backgroundColor: 'white', borderRadius: 1 }
                      }}
                    />
                    
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<FilterListIcon />}
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      Filter
                    </Button>
                  </Box>
                  
                  <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <span style={{ color: 'white', fontSize: 14 }}>Sort by:</span>
                    {/* Name sorting */}
                    <Button
                      size="small"
                      variant={sortField === 'name' ? 'contained' : 'outlined'}
                      sx={{
                        color: 'white',
                        borderColor: 'white',
                        minWidth: 60,
                        fontSize: 13,
                        px: 1,
                        backgroundColor: sortField === 'name' ? '#3f51b5' : 'transparent'
                      }}
                      onClick={() => {
                        if (sortField === 'name') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('name');
                          setSortOrder('asc');
                        }
                      }}
                    >
                      Name{sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </Button>
                    {/* Time sorting */}
                    <Button
                      size="small"
                      variant={sortField === 'createdAt' ? 'contained' : 'outlined'}
                      sx={{
                        color: 'white',
                        borderColor: 'white',
                        minWidth: 60,
                        fontSize: 13,
                        px: 1,
                        backgroundColor: sortField === 'createdAt' ? '#3f51b5' : 'transparent'
                      }}
                      onClick={() => {
                        if (sortField === 'createdAt') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('createdAt');
                          setSortOrder('asc');
                        }
                      }}
                    >
                      Time{sortField === 'createdAt' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </Button>
                    {/* Size sorting */}
                    <Button
                      size="small"
                      variant={sortField === 'size' ? 'contained' : 'outlined'}
                      sx={{
                        color: 'white',
                        borderColor: 'white',
                        minWidth: 60,
                        fontSize: 13,
                        px: 1,
                        backgroundColor: sortField === 'size' ? '#3f51b5' : 'transparent'
                      }}
                      onClick={() => {
                        if (sortField === 'size') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('size');
                          setSortOrder('asc');
                        }
                      }}
                    >
                      Size{sortField === 'size' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </Button>
                  </Box>
                  
                  {showFilters && (
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: 1,
                      mt: 2
                    }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth>
                            <InputLabel>File Type</InputLabel>
                            <Select
                              value={fileType}
                              onChange={handleFileTypeChange}
                            >
                              <MenuItem value="all">All</MenuItem>
                              <MenuItem value="swc">SWC Format</MenuItem>
                              <MenuItem value="obj">OBJ Format</MenuItem>
                              <MenuItem value="both">Both Formats</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth>
                            <InputLabel>Species</InputLabel>
                            <Select
                              value={species}
                              onChange={handleSpeciesChange}
                            >
                              {speciesList.map(item => (
                                <MenuItem key={item} value={item}>
                                  {item === 'all' ? 'All' : item}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth>
                            <InputLabel>Brain Region</InputLabel>
                            <Select
                              value={brainRegion}
                              onChange={handleBrainRegionChange}
                            >
                              {brainRegionList.map(item => (
                                <MenuItem key={item} value={item}>
                                  {item === 'all' ? 'All' : item}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Box>
                
                <Grid container spacing={3}>
                  {displayedModels.map(renderModelCard)}
                </Grid>

                {pageCount > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination 
                      count={pageCount} 
                      page={page} 
                      onChange={handlePageChange} 
                      color="primary" 
                      sx={{ 
                        '& .MuiPaginationItem-root': {
                          color: 'white',
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        }
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Standard Neuron Models
            </Typography>
            <Typography paragraph>
              Standard neuron models are based on statistical data of large experimental data sets. These models represent the average morphological characteristics of neurons in different brain regions and species.
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardActionArea component={Link} to="/models/standard-1">
                    <CardMedia
                      component="img"
                      height="200"
                      image="/models/standard-pyramidal.jpg"
                      alt="Standard Pyramidal Neuron"
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h5" component="div">
                        Standard Pyramidal Neuron
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Based on the average morphology of 100 pyramidal neurons from mouse cortex
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Reference Models
            </Typography>
            <Typography paragraph>
              Reference models are geometric models used for testing and calibration, including simple shapes like spheres and cubes, as well as specific neuron morphologies.
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardActionArea component={Link} to="/models/reference-1">
                    <CardMedia
                      component="img"
                      height="200"
                      image="/models/sphere-model.jpg"
                      alt="Standard Sphere"
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h5" component="div">
                        Standard Sphere
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Standard sphere model for testing and calibration, radius 1.0 unit
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        <Dialog
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            {selectedModel?.name} - 3D Preview
            <IconButton
              aria-label="close"
              onClick={() => setViewerOpen(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ height: '70vh' }}>
            {selectedModel && (
              <Box>
                <Tabs 
                  value={viewMode} 
                  onChange={handleViewModeChange}
                  sx={{ mb: 2 }}
                  centered
                >
                  {selectedModel.swcUrl && (
                    <Tab value="swc" label="SWC View (Skeleton)" />
                  )}
                  {selectedModel.objUrl && (
                    <Tab value="obj" label="OBJ View (Mesh)" />
                  )}
                  {selectedModel.swcUrl && selectedModel.objUrl && (
                    <Tab value="both" label="Combined View" />
                  )}
                </Tabs>
                
                <Box sx={{ height: 'calc(70vh - 100px)' }}>
                  <ModelViewer
                    objUrl={selectedModel.objUrl}
                    swcUrl={selectedModel.swcUrl}
                    viewMode={viewMode}
                  />
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewerOpen(false)}>Close</Button>
            {selectedModel?.swcUrl && (
              <Button 
                startIcon={<DownloadIcon />}
                onClick={() => downloadFileByFetch(selectedModel.swcUrl, (selectedModel.name || 'model') + '.swc')}
              >
                Download SWC
              </Button>
            )}
            {selectedModel?.objUrl && (
              <Button 
                variant="contained" 
                startIcon={<DownloadIcon />}
                onClick={() => downloadFileByFetch(selectedModel.objUrl, (selectedModel.name || 'model') + '.obj')}
              >
                Download OBJ
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Container>
      {/* 移除 renderPublicFiles 相关内容 */}
    </Box>
  );
};

export default PublicDatabase; 