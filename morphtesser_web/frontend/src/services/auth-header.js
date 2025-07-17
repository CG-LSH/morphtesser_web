export default function authHeader() {
  const user = JSON.parse(localStorage.getItem('user'));

  if (user && user.token) {
    console.log('添加认证头:', user.token.substring(0, 10) + '...');
    return { Authorization: 'Bearer ' + user.token };
  } else {
    console.log('没有找到认证信息');
    return {};
  }
} 