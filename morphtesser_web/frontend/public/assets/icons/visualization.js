import React from 'react';

const VisualizationIcon = () => {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <g fill="#3f51b5">
        <path d="M50,10 C70,10 85,25 85,45 C85,65 70,80 50,80 C30,80 15,65 15,45 C15,25 30,10 50,10 Z" fillOpacity="0.2" />
        <path d="M50,20 C65,20 75,30 75,45 C75,60 65,70 50,70 C35,70 25,60 25,45 C25,30 35,20 50,20 Z" fillOpacity="0.3" />
        <path d="M50,30 C60,30 65,35 65,45 C65,55 60,60 50,60 C40,60 35,55 35,45 C35,35 40,30 50,30 Z" fillOpacity="0.4" />
      </g>
      <path d="M20,85 L80,85" stroke="#3f51b5" strokeWidth="2" />
      <path d="M15,80 L15,20" stroke="#3f51b5" strokeWidth="2" />
      <circle cx="50" cy="45" r="5" fill="#f50057" />
    </svg>
  );
};

export default VisualizationIcon; 