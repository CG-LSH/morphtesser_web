import React from 'react';

const AnalysisIcon = () => {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="70" width="15" height="20" fill="#3f51b5" />
      <rect x="30" y="50" width="15" height="40" fill="#3f51b5" />
      <rect x="50" y="30" width="15" height="60" fill="#3f51b5" />
      <rect x="70" y="10" width="15" height="80" fill="#3f51b5" />
      <path d="M10,30 Q30,10 50,30 T90,30" fill="none" stroke="#f50057" strokeWidth="2" />
      <circle cx="10" cy="30" r="3" fill="#f50057" />
      <circle cx="50" cy="30" r="3" fill="#f50057" />
      <circle cx="90" cy="30" r="3" fill="#f50057" />
    </svg>
  );
};

export default AnalysisIcon; 