import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Grid, Card, CardContent, CardActions, 
  Button, Box, CircularProgress, Alert, TextField, InputAdornment,
  CardMedia, Chip, Pagination, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, FormControl, InputLabel, Select, MenuItem,
  CardActionArea, AppBar, Toolbar, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Avatar, Tooltip
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import StorageIcon from '@mui/icons-material/Storage';
import ExtensionIcon from '@mui/icons-material/Extension';
import SearchIcon from '@mui/icons-material/Search';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GridOnIcon from '@mui/icons-material/GridOn';
import GridOffIcon from '@mui/icons-material/GridOff';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import NeuronBackground from '../assets/images/neuron-bg';
import ModelViewer from '../components/ModelViewer';
import modelService from '../services/model.service';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ModelCard from '../components/ModelCard';
import { resolveApiUrl } from '../utils/api';
// 导入脑图
import PengBrainImage from '../assets/images/Peng-2021.png';
import QiuBrainImage from '../assets/images/Qiu-2024.png';
import GaoBrainImage from '../assets/images/Gao-2023.png';
import WinBrainImage from '../assets/images/Win-2019.png';

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

function downloadFile(url, filename) {
  const a = document.createElement('a');
  const resolvedUrl = resolveApiUrl(url);
  a.href = resolvedUrl;
  const defaultName = resolvedUrl.split('/').pop();
  a.setAttribute('download', filename || defaultName);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadFileByFetch(url, filename) {
  const resolvedUrl = resolveApiUrl(url);
  fetch(resolvedUrl)
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const defaultName = resolvedUrl.split('/').pop();
      a.download = filename || defaultName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    });
}

const PublicDatabase = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedModel, setSelectedModel] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [showWireframe, setShowWireframe] = useState(false);
  const modelViewerRef = React.useRef(null);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [datasetDetailOpen, setDatasetDetailOpen] = useState(false);
  const [datasetModels, setDatasetModels] = useState([]);
  const [datasetLoading, setDatasetLoading] = useState(false);
  const [datasetSearchTerm, setDatasetSearchTerm] = useState('');
  const [datasetPage, setDatasetPage] = useState(1);
  const [datasetSortField, setDatasetSortField] = useState('name');
  const [datasetSortOrder, setDatasetSortOrder] = useState('asc');
  const loadingAbortControllerRef = React.useRef(null); // 用于取消正在进行的加载
  const itemsPerPage = 6;
  const neuronBg = NeuronBackground();

  const [publicFiles, setPublicFiles] = useState([]);
  const [datasets] = useState([
    {
      id: 'peng_radius_03_r10',
      name: 'Peng Dataset (2021)',
      citation: 'Peng, H. et al. Morphological diversity of single neurons in molecularly defined cell types. Nature 598, 174–181 (2021).',
      description: '',
      doi: '10.1038/s41586-021-03949-7',
      modelCount: 1843,
      fileType: 'both',
      createdAt: new Date('2025-07-07T22:14:45'),
      contributor: 'Peng',
      species: 'Mouse',
      brainRegion: 'Cortex',
      // SWC文件大小分布 (KB)
      swcSizeDistribution: {
        '< 10KB': 15,
        '10-50KB': 45,
        '50-100KB': 25,
        '100-200KB': 10,
        '> 200KB': 5
      }
    },
    {
      id: 'qiu_01_r10',
      name: 'Qiu Dataset (2024)',
      citation: 'Qiu, L. et al. Whole-brain spatial organization of hippocampal single-neuron projectomes. Science 383, eadj9198 (2024).',
      description: '',
      doi: '10.1126/science.adj9198',
      modelCount: 10023,
      fileType: 'both',
      createdAt: new Date('2025-07-07T22:24:37'),
      contributor: 'Qiu',
      species: 'Mouse',
      brainRegion: 'Hippocampus',
      // SWC文件大小分布 (KB)
      swcSizeDistribution: {
        '< 10KB': 8,
        '10-50KB': 22,
        '50-100KB': 35,
        '100-200KB': 25,
        '> 200KB': 10
      }
    },
    {
      id: 'gao_01',
      name: 'Gao Dataset (2023)',
      citation: 'Gao, L. et al. Single-neuron analysis of dendrites and axons reveals the network organization in mouse prefrontal cortex. Nat. Neurosci. 26, 1111–1126 (2023).',
      description: '',
      doi: '10.1038/s41593-023-01339-y',
      modelCount: 6357,
      fileType: 'both',
      createdAt: new Date('2025-07-08T20:54:06'),
      contributor: 'Gao',
      species: 'Mouse',
      brainRegion: 'Prefrontal Cortex',
      // SWC文件大小分布 (KB)
      swcSizeDistribution: {
        '< 10KB': 12,
        '10-50KB': 38,
        '50-100KB': 30,
        '100-200KB': 15,
        '> 200KB': 5
      }
    },
    {
      id: 'winnubst_01',
      name: 'Winnubst Dataset (2019)',
      citation: 'Winnubst, J. et al. Reconstruction of 1,000 Projection Neurons Reveals New Cell Types and Organization of Long-Range Connectivity in the Mouse Brain. Cell 179, 268–281.e13 (2019).',
      description: '',
      doi: '10.1016/j.cell.2019.07.012',
      modelCount: 1196,
      fileType: 'both',
      createdAt: new Date('2025-07-09T17:19:03'),
      contributor: 'Winnubst',
      species: 'Mouse',
      brainRegion: 'Whole Brain',
      // SWC文件大小分布 (KB)
      swcSizeDistribution: {
        '< 10KB': 20,
        '10-50KB': 50,
        '50-100KB': 20,
        '100-200KB': 8,
        '> 200KB': 2
      }
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
        console.error('Failed to fetch public models:', error);
        setError('Failed to fetch public models, please try again later');
        setLoading(false);
      }
    };
    fetchPublicModels();
  }, []);

  // 预加载缓存：网站加载时预热所有数据集缓存（只执行一次）
  useEffect(() => {
    const preloadDatasetCaches = async () => {
      console.log('开始预加载数据集缓存...');
      const preloadPromises = datasets.map(async (dataset) => {
        try {
          // 异步预加载每个数据集的SWC文件列表
          const response = await fetch(resolveApiUrl(`/api/datasets/${dataset.id}/swc-files`));
          if (response.ok) {
            console.log(`✅ 数据集 ${dataset.name} 缓存预热成功`);
          } else {
            console.log(`⚠️ 数据集 ${dataset.name} 缓存预热失败: ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ 数据集 ${dataset.name} 缓存预热出错:`, error.message);
        }
      });
      
      // 等待所有预加载完成（不阻塞页面渲染）
      Promise.allSettled(preloadPromises).then(() => {
        console.log('🎉 所有数据集缓存预热完成');
      });
    };

    // 延迟1秒后开始预加载，避免影响首屏加载
    const timer = setTimeout(preloadDatasetCaches, 1000);
    
    return () => clearTimeout(timer);
  }, []); // 空依赖数组，确保只执行一次



  const handleDatasetDetail = async (dataset) => {
    // 取消之前的加载
    if (loadingAbortControllerRef.current) {
      loadingAbortControllerRef.current.abort();
      console.log('取消之前的数据集加载');
    }
    
    // 创建新的AbortController
    const abortController = new AbortController();
    loadingAbortControllerRef.current = abortController;
    
    // 清空之前的数据
    setDatasetModels([]);
    setDatasetSearchTerm('');
    setDatasetPage(1);
    
    setSelectedDataset(dataset);
    setDatasetDetailOpen(true);
    setDatasetLoading(true);
    
    try {
      // 从本地results文件夹获取SWC文件列表
      const swcFiles = await fetchSwcFilesFromResults(dataset.id, abortController.signal);
      
      // 检查是否已被取消
      if (abortController.signal.aborted) {
        console.log('加载已取消');
        return;
      }
      
      const models = await generateModelsFromSwcFiles(dataset.id, swcFiles, abortController.signal, (currentModels) => {
        // 实时更新模型列表
        if (!abortController.signal.aborted) {
          setDatasetModels(currentModels);
        }
      });
      
      // 再次检查是否已被取消
      if (abortController.signal.aborted) {
        console.log('加载已取消');
        return;
      }
      
      // 最终设置模型列表（确保所有数据都已加载）
      setDatasetModels(models);
    } catch (error) {
      // 如果是因为取消导致的错误，不处理
      if (error.name === 'AbortError') {
        console.log('加载被取消');
        return;
      }
      
      console.error('Error loading dataset models:', error);
      // 如果加载失败，使用模拟数据作为后备
      if (!abortController.signal.aborted) {
        const mockModels = generateMockModels(dataset.id, Math.min(dataset.modelCount, 50));
        setDatasetModels(mockModels);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setDatasetLoading(false);
      }
      // 清理AbortController引用
      if (loadingAbortControllerRef.current === abortController) {
        loadingAbortControllerRef.current = null;
      }
    }
  };

  // 统一的带本地缓存与 ETag 的获取函数
  const fetchSwcFilesFromResults = async (datasetId, signal) => {
    try {
      const lsKey = `swcFilesCache:${datasetId}`;
      const cachedRaw = localStorage.getItem(lsKey);
      let cached = null;
      try { cached = cachedRaw ? JSON.parse(cachedRaw) : null; } catch (_) { cached = null; }

      const headers = {};
      if (cached && cached.etag) {
        headers['If-None-Match'] = cached.etag;
      }

      const response = await fetch(resolveApiUrl(`/api/datasets/${datasetId}/swc-files`), { signal, headers });
      if (response.status === 304 && cached && cached.data) {
        // 服务器确认未变更，直接使用本地缓存
        return cached.data.files || [];
      }
      if (!response.ok) {
        throw new Error('Failed to fetch SWC files');
      }
      const data = await response.json();
      // 写入本地缓存
      const etag = response.headers.get('ETag');
      localStorage.setItem(lsKey, JSON.stringify({ etag, data, ts: Date.now() }));
      return data.files || [];
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error; // 传递取消信号
      }
      console.error('Error fetching SWC files:', error);
      // 如果有本地缓存，降级使用
      const lsKey = `swcFilesCache:${datasetId}`;
      const cachedRaw = localStorage.getItem(lsKey);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          if (cached && cached.data) return cached.data.files || [];
        } catch (_) {}
      }
      return [];
    }
  };

  // 从SWC文件生成模型数据 - 增量加载
  const generateModelsFromSwcFiles = async (datasetId, swcFiles, signal, onProgress) => {
    const models = [];
    const brainRegions = ['Cortex', 'Hippocampus', 'Cerebellum', 'Striatum', 'Thalamus'];
    const cellTypes = ['Pyramidal', 'Interneuron', 'Granule', 'Purkinje', 'Medium Spiny'];
    
    // 首批更小，首帧更快；随后批次稍大
    const firstBatch = 6;
    const batchSize = 10;
    
    for (let i = 0; i < swcFiles.length; i += (i === 0 ? firstBatch : batchSize)) {
      // 检查是否已被取消
      if (signal && signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      
      // 处理当前批次
      const currentSize = (i === 0 ? firstBatch : batchSize);
      const batchEnd = Math.min(i + currentSize, swcFiles.length);
      const batchModels = [];
      
      for (let j = i; j < batchEnd; j++) {
        const swcFile = swcFiles[j];
        const fileName = swcFile.name || swcFile;
        const folderName = swcFile.folderName || swcFile;
        const baseName = folderName.replace(/\.swc$/i, '');
        
        batchModels.push({
          id: `${datasetId}_${baseName}`,
          name: baseName, // 使用文件夹名作为模型名
          species: 'Mouse', // 统一为小鼠
          primaryRegion: brainRegions[Math.floor(Math.random() * brainRegions.length)],
          secondaryRegion: `${brainRegions[Math.floor(Math.random() * brainRegions.length)]}_Subregion`,
          cellType: cellTypes[Math.floor(Math.random() * cellTypes.length)],
          swcUrl: resolveApiUrl(`/api/datasets/${datasetId}/swc/${folderName}/${fileName}`), // 文件夹内的SWC文件
          drcUrl: resolveApiUrl(`/api/datasets/${datasetId}/drc/${folderName}/data_refined_qp20.drc`), // 优先使用qp20，ModelViewer会自动回退到qp14
          localPath: `Y:\\morphtesser_exp\\Final_Results_Datasets\\${datasetId}\\results\\${folderName}`
        });
      }
      
      // 将当前批次添加到总模型列表
      models.push(...batchModels);
      
      // 通知进度更新
      if (onProgress) {
        onProgress([...models]);
      }
      
      // 让出控制权，允许UI更新
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return models;
  };

  // 生成模拟的神经元模型数据
  const generateMockModels = (datasetId, count) => {
    const models = [];
    const speciesList = ['Mouse', 'Rat', 'Human', 'Drosophila'];
    const brainRegions = ['Cortex', 'Hippocampus', 'Cerebellum', 'Striatum', 'Thalamus'];
    const cellTypes = ['Pyramidal', 'Interneuron', 'Granule', 'Purkinje', 'Medium Spiny'];
    
    for (let i = 1; i <= Math.min(count, 100); i++) {
      models.push({
        id: `${datasetId}_${i}`,
        name: `Neuron_${i}`,
        species: speciesList[Math.floor(Math.random() * speciesList.length)],
        primaryRegion: brainRegions[Math.floor(Math.random() * brainRegions.length)],
        secondaryRegion: `${brainRegions[Math.floor(Math.random() * brainRegions.length)]}_Subregion_${i}`,
        cellType: cellTypes[Math.floor(Math.random() * cellTypes.length)],
        swcUrl: `https://neuromorpho.org/dableFiles/${datasetId}/CNG%20version/${datasetId}_${i}.CNG.swc`,
        objUrl: `https://neuromorpho.org/dableFiles/${datasetId}/CNG%20version/${datasetId}_${i}.CNG.obj`,
        neuromorphoUrl: `https://neuromorpho.org/neuron_info.jsp?neuron_name=${datasetId}_${i}`
      });
    }
    return models;
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };


  const handleDatasetSearchChange = (event) => {
    setDatasetSearchTerm(event.target.value);
    setDatasetPage(1);
  };

  const handleDatasetPageChange = (event, value) => {
    setDatasetPage(value);
  };

  // 切换线框模式
  const toggleWireframe = () => {
    setShowWireframe(!showWireframe);
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

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setViewerOpen(true);
  };

  const handleDatasetModelSelect = (model) => {
    setSelectedModel(model);
    setViewerOpen(true);
  };

  const handleDownloadDataset = (datasetId) => {
    // 直接链接到数据集地址
    const datasetUrls = {
      'peng_radius_03_r10': 'Y:\\morphtesser_exp\\Final_Results_Datasets\\peng_radius_03_r10',
      'qiu_01_r10': 'Y:\\morphtesser_exp\\Final_Results_Datasets\\qiu_01_r10',
      'gao_01': 'Y:\\morphtesser_exp\\Final_Results_Datasets\\gao_01',
      'winnubst_01': 'Y:\\morphtesser_exp\\Final_Results_Datasets\\winnubst_01'
    };
    
    const url = datasetUrls[datasetId];
    if (url) {
      // 在新窗口中打开数据集链接
      window.open(url, '_blank');
    } else {
      alert('Dataset link not configured');
    }
  };

  const handleDownload = (model, type) => {
    const url = type === 'swc' ? model.swcUrl : model.objUrl;
    if (url) {
      downloadFile(url, (model.name || 'model') + '.' + type);
    }
  };

  const safeModels = Array.isArray(models) ? models : [];
  if (!Array.isArray(models)) {
    console.warn('Expected models to be an array, got:', models);
  }

  const filteredModels = safeModels.filter(model => {
    // 搜索词过滤
    const matchesSearch = 
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (model.description && model.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const filteredDatasets = datasets.filter(dataset => {
    // 搜索词过滤
    const matchesSearch = 
      dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dataset.description && dataset.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
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

  // 数据集分页 - 2列横向布局，每页4个
  const datasetItemsPerPage = 4; // 每页4个数据集，2行2列
  const datasetPageCount = Math.ceil(sortedDatasets.length / datasetItemsPerPage);
  const displayedDatasets = sortedDatasets.slice(
    (page - 1) * datasetItemsPerPage,
    page * datasetItemsPerPage
  );

  // 数据集详情页面的过滤和排序
  const filteredDatasetModels = datasetModels.filter(model => {
    const matchesSearch = 
      model.name.toLowerCase().includes(datasetSearchTerm.toLowerCase()) ||
      model.species.toLowerCase().includes(datasetSearchTerm.toLowerCase()) ||
      model.primaryRegion.toLowerCase().includes(datasetSearchTerm.toLowerCase()) ||
      model.cellType.toLowerCase().includes(datasetSearchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const sortedDatasetModels = [...filteredDatasetModels].sort((a, b) => {
    let v1 = a[datasetSortField], v2 = b[datasetSortField];
    if (datasetSortField === 'name') {
      if (v1 < v2) return datasetSortOrder === 'asc' ? -1 : 1;
      if (v1 > v2) return datasetSortOrder === 'asc' ? 1 : -1;
      return 0;
    }
    return datasetSortOrder === 'asc' ? v1 - v2 : v2 - v1;
  });

  // 数据集详情页面每页显示更多项目
  const datasetModelItemsPerPage = 10; // 数据集详情页面每页显示10个项目
  const datasetModelPageCount = Math.ceil(sortedDatasetModels.length / datasetModelItemsPerPage);
  const displayedDatasetModels = sortedDatasetModels.slice(
    (datasetPage - 1) * datasetModelItemsPerPage,
    datasetPage * datasetModelItemsPerPage
  );


  // Example model data
  const publicModels = [
    {
      id: 1,
      name: 'Standard Sphere Reference Model',
      description: 'Standard sphere model for testing and calibration, radius 1.0 units',
      objFilePath: '/models/sphere.obj',
      swcFilePath: '/models/sphere.swc',
      fileType: 'both',
      createdAt: new Date().toISOString(),
      species: 'General',
      brainRegion: 'Reference Model',
      contributor: 'Liu Sihu',
      length: 12.56,
      surfaceArea: 12.56,
      volume: 4.19
    },
    {
      id: 2,
      name: 'Mouse Cortical Pyramidal Cell',
      description: 'Pyramidal neuron from mouse somatosensory cortex',
      objFilePath: '/models/sphere.obj',
      swcFilePath: '/models/sphere.swc',
      fileType: 'both',
      createdAt: new Date().toISOString(),
      species: 'Mouse',
      brainRegion: 'Cortex',
      contributor: 'Zhang San',
      length: 1023.45,
      surfaceArea: 3245.67,
      volume: 567.89
    },
    {
      id: 3,
      name: 'Rat Hippocampal CA1 Pyramidal Cell',
      description: 'Pyramidal neuron reconstructed from rat hippocampal CA1 region',
      objFilePath: '/models/sphere.obj',
      fileType: 'obj',
      createdAt: new Date().toISOString(),
      species: 'Rat',
      brainRegion: 'Hippocampus',
      contributor: 'Li Si',
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
    <Grid item xs={12} sm={6} md={6} key={dataset.id}>
      <Card 
        sx={{ 
          height: 280, 
          display: 'flex', 
          flexDirection: 'row', 
          borderRadius: 3, 
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)', 
          backgroundColor: 'rgba(255,255,255,0.95)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(62, 118, 244, 0.3)',
            '& .neuron-pattern': {
              opacity: 0.8
            }
          }
        }}
      >
        {/* 神经元背景图案 */}
        <Box sx={{
              position: 'absolute', 
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233f51b5' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3Cpath d='M30 10 L30 50 M10 30 L50 30' stroke='%233f51b5' stroke-width='1' stroke-opacity='0.3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          zIndex: 0,
          transition: 'opacity 0.3s ease'
        }} className="neuron-pattern" />
        
        {/* 左侧脑图区 */}
        <Box sx={{ 
          width: 260,
          py: 2, 
          px: 2,
          textAlign: 'center', 
          borderRight: '1px solid rgba(63, 81, 181, 0.1)', 
          background: 'linear-gradient(135deg, rgba(63, 81, 181, 0.05) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(62, 118, 244, 0.05) 100%)',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Box sx={{ width: '100%', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {/* 根据数据集ID显示对应的脑图 */}
            {dataset.id === 'peng_radius_03_r10' && (
              <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                <Box sx={{ 
                  width: '100%', 
                  height: '100%', 
                  backgroundImage: `url(${PengBrainImage})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  borderRadius: 2,
                  border: '1px solid rgba(25, 118, 210, 0.2)'
                }} />
              </Box>
            )}
            {dataset.id === 'qiu_01_r10' && (
              <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                <Box sx={{ 
                  width: '100%', 
                  height: '100%', 
                  backgroundImage: `url(${QiuBrainImage})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  borderRadius: 2,
                  border: '1px solid rgba(46, 125, 50, 0.2)'
                }} />
              </Box>
            )}
            {dataset.id === 'gao_01' && (
              <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                <Box sx={{ 
                  width: '100%', 
                  height: '100%', 
                  backgroundImage: `url(${GaoBrainImage})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  borderRadius: 2,
                  border: '1px solid rgba(245, 124, 0, 0.2)'
                }} />
              </Box>
            )}
            {dataset.id === 'winnubst_01' && (
              <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                <Box sx={{ 
                  width: '100%', 
                  height: '100%', 
                  backgroundImage: `url(${WinBrainImage})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  borderRadius: 2,
                  border: '1px solid rgba(123, 31, 162, 0.2)'
                }} />
              </Box>
            )}
          </Box>
        </Box>
        
        {/* 右侧内容区域 */}
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          minWidth: 0,
          paddingBottom: '80px' // 为固定按钮留出空间
        }}>
          {/* 标题和统计信息 */}
          <CardContent sx={{ 
            flexGrow: 1, 
            textAlign: 'left', 
            py: 1.5, 
            px: 2.5,
            background: 'transparent !important',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start'
          }}>
            {/* 顶部空行 */}
            <Box sx={{ height: 16, width: '100%' }} />
            
            {/* 主标题 - 数据集名称 */}
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ 
              mb: 0.5, 
              color: '#1a1a1a',
              fontSize: '1.0rem',
              lineHeight: 1.2
            }}>
              {dataset.name}
            </Typography>
            
            {/* 副标题 - 文章引用 */}
            <Typography variant="body2" sx={{ 
              mb: 1.5, 
              color: '#666666',
              fontWeight: 'normal',
              fontSize: '0.75rem',
              lineHeight: 1.3,
              fontStyle: 'italic'
            }}>
              {dataset.citation}
            </Typography>
            
            <Box sx={{ mb: 0.5 }}>
              <Typography variant="body2" sx={{ 
                mb: 0.4, 
                color: '#3f51b5',
                fontWeight: 'medium',
                fontSize: '0.8rem'
              }}>
              DOI: {dataset.doi || 'N/A'}
            </Typography>
              <Typography variant="body2" sx={{ 
                color: '#2e7d32',
                fontWeight: 'medium',
                fontSize: '0.8rem'
              }}>
              Mesh Model Count: {dataset.modelCount}
            </Typography>
            </Box>
          </CardContent>
          
          {/* 底部按钮 */}
          <CardActions sx={{ 
            justifyContent: 'center', 
            borderTop: '1px solid rgba(63, 81, 181, 0.1)', 
            py: 1.5,
            px: 2.5,
            background: 'linear-gradient(135deg, rgba(63, 81, 181, 0.02) 0%, rgba(255, 255, 255, 0.8) 100%)',
            flexShrink: 0,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0
          }}>
            <Button 
              size="medium" 
              onClick={() => handleDatasetDetail(dataset)}
              variant="outlined"
              sx={{
                borderColor: '#3f51b5',
                color: '#3f51b5',
                fontWeight: '600',
                borderRadius: '25px',
                px: 3,
                py: 1,
                textTransform: 'none',
                fontSize: '0.9rem',
                borderWidth: '2px',
                background: 'linear-gradient(135deg, rgba(63, 81, 181, 0.05) 0%, rgba(255, 255, 255, 0.9) 100%)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#3f51b5',
                  color: 'white',
                  borderColor: '#3f51b5',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(63, 81, 181, 0.3)',
                  background: 'linear-gradient(135deg, #3f51b5 0%, #303f9f 100%)'
                },
                '&:active': {
                  transform: 'translateY(0px)',
                  boxShadow: '0 4px 12px rgba(63, 81, 181, 0.4)'
                }
              }}
              fullWidth
            >
              Explore Dataset
            </Button>
          </CardActions>
        </Box>
      </Card>
    </Grid>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      position: 'relative',
      pt: '84px',
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
            '&:hover': {
              transform: 'scale(1.05)'
            }
          }}
            onClick={() => navigate('/')}
            role="button"
            aria-label="Go Home"
          >
            <img 
              src="/assets/images/logo_M.png" 
              alt="MorphTesser Logo" 
              style={{ height: '40px', width: 'auto', maxWidth: '100%', filter: 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.1))' }}
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

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
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
          Public Whole Brain Datasets
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
          Explore comprehensive collections of neuron models from leading neuroscience research laboratories
        </Typography>
        
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
                mb: 2
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
              
            </Box>
            
            <Grid container spacing={3}>
              {displayedDatasets.map(dataset => renderDatasetCard(dataset))}
            </Grid>
            
            {datasetPageCount > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination 
                  count={datasetPageCount} 
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



        {/* 3D模型查看器对话框 */}
        <Dialog
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          maxWidth={false}
          fullWidth={false}
          sx={{ 
            '& .MuiDialog-paper': { 
              margin: '16px 24px',
              width: '80vw',
              height: '80vh',
              maxWidth: 'none',
              maxHeight: 'none',
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
                pointerEvents: 'none'
              }
            } 
          }}
        >
          <DialogContent sx={{ height: '100%', position: 'relative', padding: 0, overflow: 'hidden' }}>
            {selectedModel && (
              <Box sx={{ height: '100%', position: 'relative' }}>
                {/* 控制按钮 - 左上角 */}
                <Box sx={{ 
                  position: 'absolute', 
                  top: 16, 
                  left: 16, 
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 1,
                  padding: 1
                }}>
                  <Typography variant="body2" sx={{ color: 'black', fontSize: '0.8rem' }}>
                    ID: {selectedModel.id}
                  </Typography>
                  <Tooltip title={showWireframe ? "Switch to solid mode" : "Switch to wireframe mode"}>
                    <IconButton
                      onClick={toggleWireframe}
                      size="small"
                      sx={{
                        color: '#1976d2',
                        border: '1px solid #1976d2',
                        borderRadius: '50%',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.1)'
                        }
                      }}
                    >
                      {showWireframe ? <GridOffIcon sx={{ fontSize: 16 }} /> : <GridOnIcon sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* 右上角按钮组 */}
                <Box sx={{ 
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 10,
                  display: 'flex',
                  gap: 1
                }}>
                  {/* Reset View 按钮 */}
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 1)'
                      }
                    }}
                    onClick={handleResetView}
                  >
                    Reset View
                  </Button>

                  {/* 关闭按钮 */}
                  <IconButton
                    aria-label="close"
                    onClick={() => setViewerOpen(false)}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 1)'
                      }
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>

                {/* Help icon - 左下角 */}
                <Tooltip 
                  title={
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                        3D Viewer Controls:
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        • Left click + drag: Rotate
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        • Right click + drag: Pan
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        • Mouse wheel: Zoom
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        • Double click: Focus on point
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        • Grid icon: Toggle wireframe
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
                      zIndex: 10,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)'
                      }
                    }}
                  >
                    <HelpOutlineIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>

                
                {/* 3D模型查看器 */}
                <Box sx={{ height: '100%' }}>
                  <ErrorBoundary>
                    <ModelViewer
                      ref={modelViewerRef}
                      objUrl={selectedModel.drcUrl ? null : selectedModel.objUrl}
                      dracoUrl={selectedModel.drcUrl}
                      swcUrl={null}
                      viewMode="obj"
                      width="100%"
                      height="100%"
                      backgroundColor={0xffffff}
                      wireframeMode={showWireframe}
                      doubleClickDistance={0.5}
                    />
                  </ErrorBoundary>
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* 数据集详情对话框 */}
        <Dialog
          open={datasetDetailOpen}
          onClose={(event, reason) => {
            // 只允许ESC键关闭，不允许点击背景关闭
            if (reason === 'backdropClick') {
              return; // 忽略背景点击
            }
            // 关闭对话框时取消正在进行的加载
            if (loadingAbortControllerRef.current) {
              loadingAbortControllerRef.current.abort();
              loadingAbortControllerRef.current = null;
            }
            setDatasetDetailOpen(false);
            // 清空状态
            setDatasetModels([]);
            setDatasetLoading(false);
          }}
          maxWidth="xl"
          fullWidth
          disableEscapeKeyDown={false} // 允许ESC键关闭
          disableBackdropClick={true} // 禁用点击背景关闭
          sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" component="div">
                {selectedDataset?.name} - Neuron Models
              </Typography>
            </Box>
            <IconButton
              aria-label="close"
              onClick={() => {
                // 关闭对话框时取消正在进行的加载
                if (loadingAbortControllerRef.current) {
                  loadingAbortControllerRef.current.abort();
                  loadingAbortControllerRef.current = null;
                }
                setDatasetDetailOpen(false);
                // 清空状态
                setDatasetModels([]);
                setDatasetLoading(false);
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent dividers sx={{ p: 0, height: '100%' }}>
            {datasetModels.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                py: 4
              }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Loading neuron models...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* 搜索和排序控制 */}
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    mb: 2
                  }}>
                    <TextField
                      fullWidth
                      placeholder="Search neuron name, species, region, or cell type..."
                      value={datasetSearchTerm}
                      onChange={handleDatasetSearchChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                        sx: { backgroundColor: 'white' }
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <span style={{ fontSize: 14 }}>Sort by:</span>
                    <Button
                      size="small"
                      variant={datasetSortField === 'name' ? 'contained' : 'outlined'}
                      sx={{ minWidth: 80, fontSize: 12 }}
                      onClick={() => {
                        if (datasetSortField === 'name') {
                          setDatasetSortOrder(datasetSortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setDatasetSortField('name');
                          setDatasetSortOrder('asc');
                        }
                      }}
                    >
                      Name{datasetSortField === 'name' ? (datasetSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </Button>
                    <Button
                      size="small"
                      variant={datasetSortField === 'species' ? 'contained' : 'outlined'}
                      sx={{ minWidth: 80, fontSize: 12 }}
                      onClick={() => {
                        if (datasetSortField === 'species') {
                          setDatasetSortOrder(datasetSortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setDatasetSortField('species');
                          setDatasetSortOrder('asc');
                        }
                      }}
                    >
                      Species{datasetSortField === 'species' ? (datasetSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </Button>
                    <Button
                      size="small"
                      variant={datasetSortField === 'primaryRegion' ? 'contained' : 'outlined'}
                      sx={{ minWidth: 80, fontSize: 12 }}
                      onClick={() => {
                        if (datasetSortField === 'primaryRegion') {
                          setDatasetSortOrder(datasetSortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setDatasetSortField('primaryRegion');
                          setDatasetSortOrder('asc');
                        }
                      }}
                    >
                      Region{datasetSortField === 'primaryRegion' ? (datasetSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </Button>
                  </Box>
                </Box>

                {/* 神经元模型列表 */}
                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                  <TableContainer component={Paper} sx={{ height: '100%' }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ width: 100, fontWeight: 'bold' }}>Thumbnail</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Name/ID</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Species</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Primary Region</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Secondary Region</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Cell Type</TableCell>
                          <TableCell sx={{ width: 80, fontWeight: 'bold' }}>View</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {displayedDatasetModels.map((model) => (
                          <TableRow key={model.id} hover>
                            <TableCell>
                              <Box sx={{ 
                                width: 60, 
                                height: 60,
                                borderRadius: 1,
                                overflow: 'hidden',
                                border: '2px solid #e3f2fd',
                                backgroundColor: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <img 
                                  src={resolveApiUrl(`/api/datasets/${selectedDataset?.id}/thumbnail/${model.name}`)}
                                  alt={`${model.name} thumbnail`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  onError={(e) => {
                                    console.log('Thumbnail load error for:', model.name);
                                    console.log('Attempted URL:', resolveApiUrl(`/api/datasets/${selectedDataset?.id}/thumbnail/${model.name}`));
                                    // 如果缩略图加载失败，显示默认图标
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                  onLoad={(e) => {
                                    console.log('Thumbnail loaded successfully for:', model.name);
                                    // 如果缩略图加载成功，隐藏默认图标
                                    e.target.nextSibling.style.display = 'none';
                                  }}
                                />
                              <Avatar
                                sx={{ 
                                    width: '100%', 
                                    height: '100%',
                                  backgroundColor: '#e3f2fd',
                                    color: '#1976d2',
                                    display: 'none'
                                }}
                              >
                                <ThreeDRotationIcon />
                              </Avatar>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {model.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {model.id}
                              </Typography>
                            </TableCell>
                            <TableCell>{model.species}</TableCell>
                            <TableCell>{model.primaryRegion}</TableCell>
                            <TableCell>{model.secondaryRegion}</TableCell>
                            <TableCell>{model.cellType}</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleDatasetModelSelect(model)}
                                sx={{
                                  color: '#1976d2',
                                  '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.1)'
                                  }
                                }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* 分页 */}
                {datasetModelPageCount > 1 && (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    p: 2,
                    borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                  }}>
                    <Pagination 
                      count={datasetModelPageCount} 
                      page={datasetPage} 
                      onChange={handleDatasetPageChange}
                      color="primary"
                    />
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
};

export default PublicDatabase; 