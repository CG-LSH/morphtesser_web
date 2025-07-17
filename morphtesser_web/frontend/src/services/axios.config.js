import axios from 'axios';

// 设置基础URL
axios.defaults.baseURL = 'http://localhost:8080';

// 允许跨域请求携带凭证
axios.defaults.withCredentials = true;

// 添加请求拦截器
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // 清除本地token
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // 跳转到登录页
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios; 