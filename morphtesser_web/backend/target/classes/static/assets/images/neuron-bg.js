import React from 'react';

const NeuronBackground = () => {
  const svgString = `
    <svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="neuronGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style="stop-color:#3f51b5;stop-opacity:0.2" />
          <stop offset="100%" style="stop-color:#000;stop-opacity:0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="#000022" />
      <g stroke="#3f51b5" stroke-width="1.5">
        ${generateNeuronPaths()}
      </g>
      <g fill="#f50057">
        ${generateSynapses()}
      </g>
      <circle cx="500" cy="500" r="300" fill="url(#neuronGradient)" />
    </svg>
  `;

  const backgroundImage = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}")`;

  return backgroundImage;
};

// 生成神经元路径
function generateNeuronPaths() {
  let paths = '';
  for (let i = 0; i < 30; i++) {
    const startX = Math.random() * 1000;
    const startY = Math.random() * 1000;
    let path = `<path d="M${startX},${startY} `;
    
    let x = startX;
    let y = startY;
    
    for (let j = 0; j < 5; j++) {
      const newX = x + (Math.random() - 0.5) * 200;
      const newY = y + (Math.random() - 0.5) * 200;
      const controlX1 = x + (Math.random() - 0.5) * 100;
      const controlY1 = y + (Math.random() - 0.5) * 100;
      const controlX2 = newX + (Math.random() - 0.5) * 100;
      const controlY2 = newY + (Math.random() - 0.5) * 100;
      
      path += `C${controlX1},${controlY1} ${controlX2},${controlY2} ${newX},${newY} `;
      
      x = newX;
      y = newY;
    }
    
    path += '" fill="none" />';
    paths += path;
  }
  
  return paths;
}

// 生成突触点
function generateSynapses() {
  let synapses = '';
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 1000;
    const y = Math.random() * 1000;
    const radius = Math.random() * 3 + 1;
    synapses += `<circle cx="${x}" cy="${y}" r="${radius}" opacity="${Math.random() * 0.8 + 0.2}" />`;
  }
  
  return synapses;
}

export default NeuronBackground; 