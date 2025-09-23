import React from 'react';

const NeuronPattern = () => {
  const svgString = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="transparent" />
      <g stroke="#3f51b5" stroke-width="0.5" opacity="0.1">
        <path d="M0,100 C30,70 70,130 100,100 S170,70 200,100" />
        <path d="M100,0 C70,30 130,70 100,100 S70,170 100,200" />
        <path d="M0,0 C50,50 150,50 200,0" />
        <path d="M0,200 C50,150 150,150 200,200" />
        <path d="M50,50 C70,30 80,70 100,50" />
        <path d="M150,50 C130,30 120,70 100,50" />
        <path d="M50,150 C70,170 80,130 100,150" />
        <path d="M150,150 C130,170 120,130 100,150" />
      </g>
      <g fill="#f50057" opacity="0.1">
        <circle cx="100" cy="100" r="3" />
        <circle cx="50" cy="50" r="2" />
        <circle cx="150" cy="50" r="2" />
        <circle cx="50" cy="150" r="2" />
        <circle cx="150" cy="150" r="2" />
      </g>
    </svg>
  `;

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  
  return dataUrl;
};

export default NeuronPattern; 