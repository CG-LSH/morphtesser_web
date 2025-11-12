import axios from 'axios';

const hasProtocol = (url) => /^https?:\/\//i.test(url);

export const resolveApiUrl = (url = '') => {
  if (!url) return url;
  if (hasProtocol(url)) {
    return url;
  }

  const base =
    process.env.REACT_APP_API_BASE_URL ||
    axios.defaults.baseURL ||
    '';

  if (!base) {
    return url;
  }

  const normalizedBase = base.endsWith('/')
    ? base.slice(0, -1)
    : base;
  const normalizedPath = url.startsWith('/')
    ? url
    : `/${url}`;

  return `${normalizedBase}${normalizedPath}`;
};

