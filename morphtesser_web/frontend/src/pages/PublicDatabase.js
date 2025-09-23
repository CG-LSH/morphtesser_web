import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
  const [datasets] = useState([
    {
      id: 'peng_radius_03_r10',
      name: 'Peng_et_al_Nature_2021',
      description: '包含1741个神经元模型的数据集',
      modelCount: 1743,
      successCount: 1743,
      successRate: 100,
      fileType: 'both',
      createdAt: new Date('2025-07-07T22:14:45'),
      contributor: 'Peng',
      species: '小鼠',
      brainRegion: '皮层'
    },
    {
      id: 'qiu_01_r10',
      name: 'Qiu_et_al_Science_2024',
      description: '包含10100个神经元模型的数据集',
      modelCount: 10100,
      successCount: 9935,
      successRate: 98.4,
      fileType: 'both',
      createdAt: new Date('2025-07-07T22:24:37'),
      contributor: 'Qiu',
      species: '小鼠',
      brainRegion: '皮层'
    },
    {
      id: 'gao_01',
      name: 'Gao_et_al_Nat_Neurosci_2023',
      description: '包含6357个神经元模型的数据集',
      modelCount: 6357,
      successCount: 6357,
      successRate: 100,
      fileType: 'both',
      createdAt: new Date('2025-07-08T20:54:06'),
      contributor: 'Gao',
      species: '小鼠',
      brainRegion: '皮层'
    },
    {
      id: 'winnubst_01',
      name: 'Winnubst_et_al_Cell_2019',
      description: '包含1200个神经元模型的数据集',
      modelCount: 1200,
      successCount: 1196,
      successRate: 99.7,
      fileType: 'both',
      createdAt: new Date('2025-07-09T17:19:03'),
      contributor: 'Winnubst',
      species: '小鼠',
      brainRegion: '皮层'
    }
  ]);
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

  const handleDownloadDataset = (datasetId) => {
    // 直接链接到数据集地址
    const datasetUrls = {
      'peng_radius_03_r10': 'http://10.6.18.165:5000/projects/morphtesser_exp/Datasets/peng_radius_03_r10',
      'qiu_01_r10': 'http://10.6.18.165:5000/projects/morphtesser_exp/Datasets/qiu_01_r10',
      'gao_01': 'http://10.6.18.165:5000/projects/morphtesser_exp/Datasets/gao_01',
      'winnubst_01': 'http://10.6.18.165:5000/projects/morphtesser_exp/Datasets/winnubst_01'
    };
    
    const url = datasetUrls[datasetId];
    if (url) {
      // 在新窗口中打开数据集链接
      window.open(url, '_blank');
    } else {
      alert('数据集链接未配置');
    }
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

  const filteredDatasets = datasets.filter(dataset => {
    // 搜索词过滤
    const matchesSearch = 
      dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dataset.description && dataset.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // 物种过滤
    const matchesSpecies = species === 'all' || dataset.species === species;
    
    // 脑区过滤
    const matchesBrainRegion = brainRegion === 'all' || dataset.brainRegion === brainRegion;
    
    return matchesSearch && matchesSpecies && matchesBrainRegion;
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

  // 数据集排序逻辑
  const sortedDatasets = [...filteredDatasets].sort((a, b) => {
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

  // 数据集分页
  const datasetPageCount = Math.ceil(sortedDatasets.length / itemsPerPage);
  const displayedDatasets = sortedDatasets.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // 提取唯一的物种和脑区列表
  const allModels = [...models, ...datasets];
  const speciesList = ['all', ...new Set(allModels.map(item => item.species))];
  const brainRegionList = ['all', ...new Set(allModels.map(item => item.brainRegion))];

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

  // 渲染数据集卡片
  const renderDatasetCard = (dataset) => (
    <Grid item xs={12} sm={6} md={4} key={dataset.id}>
      <Card 
        sx={{ 
          height: 380, 
          display: 'flex', 
          flexDirection: 'column', 
          borderRadius: 3, 
          boxShadow: 3, 
          backgroundColor: 'rgba(255,255,255,0.97)', 
          overflow: 'hidden'
        }}
      >
        {/* 顶部统计图区 */}
        <Box sx={{ py: 2, textAlign: 'center', borderBottom: '1px solid #f0f0f0', background: 'linear-gradient(180deg,#f7fafd 60%,#fff 100%)' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
            File Size Distribution (MB)
          </Typography>
          <Box sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {/* Y轴标签 */}
            <Typography variant="caption" color="text.secondary" sx={{ 
              position: 'absolute', 
              left: 4, 
              top: '50%', 
              transform: 'translateY(-50%) rotate(-90deg)', 
              fontSize: '0.6rem',
              fontWeight: 'bold'
            }}>
              Count
            </Typography>
                         {dataset.id === 'peng_radius_03_r10' && (
               <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                <Box sx={{ 
                  width: '100%', 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 25%, #90caf9 50%, #64b5f6 75%, #42a5f5 100%)',
                  borderRadius: 1,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* 简化的直方图 - Peng数据 */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', height: '100%', px: 1, py: 1 }}>
                    <Box sx={{ width: '8%', height: '20%', bgcolor: '#1976d2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '35%', bgcolor: '#1976d2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '60%', bgcolor: '#1976d2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '85%', bgcolor: '#1976d2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '100%', bgcolor: '#1976d2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '70%', bgcolor: '#1976d2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '40%', bgcolor: '#1976d2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '25%', bgcolor: '#1976d2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '15%', bgcolor: '#1976d2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '8%', bgcolor: '#1976d2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '3%', bgcolor: '#1976d2', mx: 0.5 }} />
                  </Box>
                  {/* X轴标签 */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, mt: 0.5, position: 'absolute', bottom: -20, left: 0, right: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>0</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>500</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>1000</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>1500</Typography>
                  </Box>
                </Box>
              </Box>
            )}
                         {dataset.id === 'qiu_01_r10' && (
               <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                <Box sx={{ 
                  width: '100%', 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #e8f5e8 0%, #c8e6c9 25%, #a5d6a7 50%, #81c784 75%, #66bb6a 100%)',
                  borderRadius: 1,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* 简化的直方图 - Qiu数据 */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', height: '100%', px: 1, py: 1 }}>
                    <Box sx={{ width: '8%', height: '100%', bgcolor: '#2e7d32', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '30%', bgcolor: '#2e7d32', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '15%', bgcolor: '#2e7d32', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '8%', bgcolor: '#2e7d32', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '5%', bgcolor: '#2e7d32', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '3%', bgcolor: '#2e7d32', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '2%', bgcolor: '#2e7d32', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '1%', bgcolor: '#2e7d32', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '0.5%', bgcolor: '#2e7d32', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '0.2%', bgcolor: '#2e7d32', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '0.1%', bgcolor: '#2e7d32', mx: 0.5 }} />
                  </Box>
                  {/* X轴标签 */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, mt: 0.5, position: 'absolute', bottom: -20, left: 0, right: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>0</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>500</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>1000</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>2000</Typography>
                  </Box>
                </Box>
              </Box>
            )}
                         {dataset.id === 'gao_01' && (
               <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                <Box sx={{ 
                  width: '100%', 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #fff3e0 0%, #ffe0b2 25%, #ffcc80 50%, #ffb74d 75%, #ffa726 100%)',
                  borderRadius: 1,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* 简化的直方图 - Gao数据 */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', height: '100%', px: 1, py: 1 }}>
                    <Box sx={{ width: '8%', height: '85%', bgcolor: '#f57c00', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '100%', bgcolor: '#f57c00', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '70%', bgcolor: '#f57c00', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '55%', bgcolor: '#f57c00', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '40%', bgcolor: '#f57c00', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '25%', bgcolor: '#f57c00', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '15%', bgcolor: '#f57c00', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '8%', bgcolor: '#f57c00', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '4%', bgcolor: '#f57c00', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '2%', bgcolor: '#f57c00', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '1%', bgcolor: '#f57c00', mx: 0.5 }} />
                  </Box>
                  {/* X轴标签 */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, mt: 0.5, position: 'absolute', bottom: -20, left: 0, right: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>0</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>100</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>200</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>400</Typography>
                  </Box>
                </Box>
              </Box>
            )}
                         {dataset.id === 'winnubst_01' && (
               <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                <Box sx={{ 
                  width: '100%', 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #f3e5f5 0%, #e1bee7 25%, #ce93d8 50%, #ba68c8 75%, #ab47bc 100%)',
                  borderRadius: 1,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* 简化的直方图 - Winnubst数据 */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', height: '100%', px: 1, py: 1 }}>
                    <Box sx={{ width: '8%', height: '100%', bgcolor: '#7b1fa2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '75%', bgcolor: '#7b1fa2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '40%', bgcolor: '#7b1fa2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '20%', bgcolor: '#7b1fa2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '10%', bgcolor: '#7b1fa2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '5%', bgcolor: '#7b1fa2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '2%', bgcolor: '#7b1fa2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '1%', bgcolor: '#7b1fa2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '0.5%', bgcolor: '#7b1fa2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '0.2%', bgcolor: '#7b1fa2', mx: 0.5 }} />
                    <Box sx={{ width: '8%', height: '0.1%', bgcolor: '#7b1fa2', mx: 0.5 }} />
                  </Box>
                  {/* X轴标签 */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, mt: 0.5, position: 'absolute', bottom: -20, left: 0, right: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>0</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>200</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>400</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>1000</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
        {/* 中部名称描述 */}
        <CardContent sx={{ flexGrow: 1, textAlign: 'center', py: 1.5, background: 'transparent !important' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 1 }}>{dataset.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Models: {dataset.modelCount} | Success: {dataset.successCount}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Success Rate: {dataset.successRate}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Created: {dataset.createdAt ? new Date(dataset.createdAt).toLocaleDateString() : 'Unknown'}
          </Typography>
        </CardContent>
        {/* 底部下载按钮 */}
        <CardActions sx={{ justifyContent: 'center', borderTop: '1px solid #f0f0f0', py: 1.5 }}>
          <Button 
            size="medium" 
            startIcon={<DownloadIcon />} 
            onClick={() => handleDownloadDataset(dataset.id)}
            variant="contained"
            color="primary"
            fullWidth
          >
            Download Dataset
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );

  return (
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
          '& .MuiTab-root': { 
            color: 'white',
            textTransform: 'none',
            fontSize: '16px'
          },
          '& .Mui-selected': { 
            color: '#3f51b5 !important', 
            fontWeight: 'bold',
            textTransform: 'none'
          }
        }}>
          <Tab label="NeuroMorpho.org" />
          <Tab label="Public Whole Brain Datasets" />
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
          <>
            {datasets.length === 0 ? (
              <Alert severity="info">
                No datasets available.
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
                      placeholder="Search dataset name or description..."
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
                  </Box>
                  
                  {showFilters && (
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      flexWrap: 'wrap',
                      p: 2,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: 1,
                      mb: 2
                    }}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel sx={{ color: 'white' }}>File Type</InputLabel>
                        <Select
                          value={fileType}
                          onChange={handleFileTypeChange}
                          sx={{ 
                            backgroundColor: 'white',
                            '& .MuiSelect-icon': { color: 'white' }
                          }}
                        >
                          <MenuItem value="all">All Types</MenuItem>
                          <MenuItem value="swc">SWC Only</MenuItem>
                          <MenuItem value="obj">OBJ Only</MenuItem>
                          <MenuItem value="both">Both</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel sx={{ color: 'white' }}>Species</InputLabel>
                        <Select
                          value={species}
                          onChange={handleSpeciesChange}
                          sx={{ 
                            backgroundColor: 'white',
                            '& .MuiSelect-icon': { color: 'white' }
                          }}
                        >
                          {speciesList.map(s => (
                            <MenuItem key={s} value={s}>{s === 'all' ? 'All Species' : s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel sx={{ color: 'white' }}>Brain Region</InputLabel>
                        <Select
                          value={brainRegion}
                          onChange={handleBrainRegionChange}
                          sx={{ 
                            backgroundColor: 'white',
                            '& .MuiSelect-icon': { color: 'white' }
                          }}
                        >
                          {brainRegionList.map(b => (
                            <MenuItem key={b} value={b}>{b === 'all' ? 'All Regions' : b}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                </Box>
                
                <Grid container spacing={3}>
                  {displayedDatasets.map(dataset => renderDatasetCard(dataset))}
                </Grid>
                
                {(tabValue === 0 ? pageCount : datasetPageCount) > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination 
                      count={tabValue === 0 ? pageCount : datasetPageCount} 
                      page={page} 
                      onChange={handlePageChange}
                      sx={{
                        '& .MuiPaginationItem-root': {
                          color: 'white',
                          '&.Mui-selected': {
                            backgroundColor: '#3f51b5',
                            color: 'white'
                          }
                        }
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </>
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
                  <ErrorBoundary>
                    <ModelViewer
                      objUrl={selectedModel.objUrl}
                      swcUrl={selectedModel.swcUrl}
                      viewMode={viewMode}
                    />
                  </ErrorBoundary>
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