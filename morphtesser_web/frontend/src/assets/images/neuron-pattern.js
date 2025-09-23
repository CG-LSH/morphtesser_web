import React from 'react';

const NeuronPattern = () => {
  const svgString = `
    <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="transparent" />
      <g stroke="#3f51b5" stroke-width="1" opacity="0.15">
        <path d="M0,200 C80,140 160,260 200,200 S320,140 400,200" />
        <path d="M200,0 C140,80 260,160 200,200 S140,320 200,400" />
        <path d="M0,0 C100,100 300,100 400,0" />
        <path d="M0,400 C100,300 300,300 400,400" />
        <path d="M100,100 C140,60 160,140 200,100" />
        <path d="M300,100 C260,60 240,140 200,100" />
        <path d="M100,300 C140,340 160,260 200,300" />
        <path d="M300,300 C260,340 240,260 200,300" />
        <path d="M0,100 C50,50 150,50 200,100" />
        <path d="M200,100 C250,150 350,150 400,100" />
        <path d="M100,0 C50,50 50,150 100,200" />
        <path d="M300,0 C350,50 350,150 300,200" />
        <path d="M100,200 C50,250 50,350 100,400" />
        <path d="M300,200 C350,250 350,350 300,400" />
        <path d="M0,300 C50,250 150,250 200,300" />
        <path d="M200,300 C250,350 350,350 400,300" />
      </g>
      <g fill="#f50057" opacity="0.15">
        <circle cx="200" cy="200" r="4" />
        <circle cx="100" cy="100" r="3" />
        <circle cx="300" cy="100" r="3" />
        <circle cx="100" cy="300" r="3" />
        <circle cx="300" cy="300" r="3" />
        <circle cx="50" cy="50" r="2" />
        <circle cx="350" cy="50" r="2" />
        <circle cx="50" cy="350" r="2" />
        <circle cx="350" cy="350" r="2" />
        <circle cx="200" cy="50" r="2" />
        <circle cx="200" cy="350" r="2" />
        <circle cx="50" cy="200" r="2" />
        <circle cx="350" cy="200" r="2" />
      </g>
    </svg>
  `;

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  
  return dataUrl;
};

export default NeuronPattern; 