import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Box, Typography, Grid, Paper, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, CircularProgress, Alert
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ModelViewer from '../components/ModelViewer';
import modelService from '../services/model.service';

const ModelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    const fetchModel = async () => {
      try {
        const response = await modelService.getModelById(id);
        setModel(response.data);
      } catch (err) {
        setError('Failed to get model details: ' + (err.response?.data || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchModel();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      try {
        await modelService.deleteModel(id);
        navigate('/models');
      } catch (err) {
        setError('Failed to delete model: ' + (err.response?.data || err.message));
      }
    }
  };

  const handleDownload = (fileType) => {
    // 根据文件类型下载不同的文件
    const fileUrl = fileType === 'swc' 
      ? `/api/models/${id}/download/swc`
      : `/api/models/${id}/download/obj`;
    
    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', `${model.name}.${fileType}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleCompare = () => {
    setComparing(!comparing);
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!model) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">Model not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {model.name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Upload Time: {new Date(model.createdAt).toLocaleString()}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Visualize" icon={<VisibilityIcon />} iconPosition="start" />
                <Tab label="Statistics" icon={<CompareArrowsIcon />} iconPosition="start" />
              </Tabs>
            </Box>

            {activeTab === 0 && (
              <Box>
                {comparing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>SWC Skeleton</Typography>
                      <ModelViewer 
                        modelUrl={`/api/models/${id}/file/swc`} 
                        modelType="swc" 
                        height="400px"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>OBJ Model</Typography>
                      <ModelViewer 
                        modelUrl={`/api/models/${id}/file/obj`} 
                        modelType="obj" 
                        height="400px"
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <ModelViewer 
                    modelUrl={`/api/models/${id}/file/obj`} 
                    modelType="obj" 
                    height="500px"
                  />
                )}
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<CompareArrowsIcon />}
                    onClick={toggleCompare}
                    sx={{ mt: 1 }}
                  >
                    {comparing ? 'Hide Comparison' : 'Show Comparison'}
                  </Button>
                </Box>
              </Box>
            )}

            {activeTab === 1 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Unit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Length</TableCell>
                      <TableCell>{model.length.toFixed(2)}</TableCell>
                      <TableCell>μm</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Surface Area</TableCell>
                      <TableCell>{model.surfaceArea.toFixed(2)}</TableCell>
                      <TableCell>μm²</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Volume</TableCell>
                      <TableCell>{model.volume.toFixed(2)}</TableCell>
                      <TableCell>μm³</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Branch Count</TableCell>
                      <TableCell>{model.branchCount || 'Not calculated'}</TableCell>
                      <TableCell>count</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Terminal Count</TableCell>
                      <TableCell>{model.terminalCount || 'Not calculated'}</TableCell>
                      <TableCell>count</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Operations</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload('obj')}
                fullWidth
              >
                Download OBJ Model
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload('swc')}
                fullWidth
              >
                Download SWC File
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                fullWidth
              >
                Delete Model
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Model Information</Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row">ID</TableCell>
                    <TableCell>{model.id}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Name</TableCell>
                    <TableCell>{model.name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Author</TableCell>
                    <TableCell>{model.user?.username || 'Unknown'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Upload Time</TableCell>
                    <TableCell>{new Date(model.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">File Path</TableCell>
                    <TableCell sx={{ wordBreak: 'break-all' }}>{model.filePath}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ModelDetail; 