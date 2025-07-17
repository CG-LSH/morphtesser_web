import React from 'react';

const NeuronPlaceholder = () => {
  const svgString = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0" />
      <g stroke="#3f51b5" stroke-width="2" fill="none">
        <path d="M50,100 C70,70 100,120 150,100 S230,70 250,100" />
        <path d="M150,50 C150,70 150,80 150,150" />
        <path d="M100,80 C120,60 130,90 150,80" />
        <path d="M200,80 C180,60 170,90 150,80" />
      </g>
      <circle cx="150" cy="80" r="15" fill="#f50057" fillOpacity="0.7" />
      <circle cx="50" cy="100" r="5" fill="#3f51b5" />
      <circle cx="250" cy="100" r="5" fill="#3f51b5" />
      <circle cx="150" cy="150" r="5" fill="#3f51b5" />
    </svg>
  `;

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  
  return dataUrl;
};

export default NeuronPlaceholder; 