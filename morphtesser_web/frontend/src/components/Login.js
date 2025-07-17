const handleLogin = async (e) => {
  e.preventDefault();
  setMessage("");
  setLoading(true);

  try {
    console.log('Attempting login with:', { username });
    const data = await AuthService.login(username, password);
    console.log('Login successful:', data);
    
    // 验证返回的数据
    if (!data || !data.token) {
      throw new Error('登录响应格式错误');
    }
    
    // 存储用户信息
    localStorage.setItem('user', JSON.stringify(data));
    
    // 设置认证头
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    
    // 导航到仪表板页面
    navigate("/dashboard");
  } catch (error) {
    console.error('Login failed:', error);
    setMessage(error.message);
  } finally {
    setLoading(false);
  }
}; 