import axios from 'axios';
import authHeader from './auth-header';

const API_URL = '/api/models';

const uploadModel = (formData) => {
  // 检查网络连接
  if (!navigator.onLine) {
    return Promise.reject(new Error('网络连接已断开'));
  }
  
  // 检查认证信息
  const token = localStorage.getItem('token');
  if (!token) {
    return Promise.reject(new Error('未登录，请先登录'));
  }

  // 打印上传信息用于调试
  console.log('开始上传文件:', {
    url: API_URL + '/upload',
    token: token.substring(0, 10) + '...',
    formDataEntries: Array.from(formData.entries()).map(([key, value]) => 
      key === 'file' ? `${key}: [File]` : `${key}: ${value}`
    )
  });

  return axios.post(API_URL + '/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`
    },
    timeout: 30000, // 30秒超时
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    validateStatus: function (status) {
      return status >= 200 && status < 500; // 只有服务器错误才拒绝
    },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      console.log('上传进度:', percentCompleted);
    }
  });
};

const getModelById = (id) => {
  return axios.get(API_URL + '/' + id, { headers: authHeader() });
};

const getUserModels = () => {
  return axios.get(API_URL + '/user', { headers: authHeader() });
};

const deleteModel = (id) => {
  return axios.delete(API_URL + '/' + id, { headers: authHeader() });
};

const getModelFileUrl = (id, type) => {
  return `${API_URL}/${id}/file/${type}?token=${localStorage.getItem('token')}`;
};

const downloadModelFile = (id, type) => {
  return axios.get(API_URL + '/' + id + '/download/' + type, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    responseType: 'blob'
  });
};

const createModel = ({ name, type, swcFile }) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('name', name);
  formData.append('type', type);
  formData.append('swcFile', swcFile);
  return axios.post(API_URL + '/create', formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};

const createModelFromOnlineBuilder = (formData, onUploadProgress) => {
  return axios.post('/api/models/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
};

const modelService = {
  uploadModel,
  getModelById,
  getUserModels,
  deleteModel,
  getModelFileUrl,
  downloadModelFile,
  createModel,
  createModelFromOnlineBuilder
};

export default modelService; 