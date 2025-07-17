import axios from 'axios';

const API_URL = '/api/auth/';

// 添加请求拦截器
axios.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const register = async (username, email, password) => {
  try {
    const response = await axios.post(API_URL + "register", {
      username,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      // 服务器返回了错误状态码
      throw new Error(error.response.data || '注册失败');
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      throw new Error('无法连接到服务器');
    } else {
      // 发送请求时出错
      throw new Error('请求错误');
    }
  }
};

const login = async (username, password) => {
  console.log('发送登录请求:', { url: API_URL + 'signin', username, password: '******' });
  try {
    const response = await axios.post(API_URL + "signin", {
      username,
      password,
    });
    
    console.log('登录响应:', response.status, response.data);
    if (response.data.token) {
      localStorage.setItem("user", JSON.stringify(response.data));
      localStorage.setItem("token", response.data.token);
    }
    
    return response.data;
  } catch (error) {
    console.error('登录请求失败:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
};

const logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  // 可选：强制刷新页面以清除所有状态
  window.location.href = '/';
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  console.log('从localStorage获取用户信息:', userStr);
  if (!userStr) return null;
  
  try {
    const user = JSON.parse(userStr);
    console.log('解析后的用户信息:', user);
    return user;
  } catch (e) {
    console.error('解析用户信息失败:', e);
    return null;
  }
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
};

export default authService; 