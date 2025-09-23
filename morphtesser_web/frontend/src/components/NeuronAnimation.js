import React, { useEffect, useRef } from 'react';

const NeuronAnimation = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // 设置画布大小
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 简单的随机线条动画
    const lines = [];
    const numLines = 20;
    
    // 初始化随机线条
    for (let i = 0; i < numLines; i++) {
      lines.push({
        x1: Math.random() * canvas.width,
        y1: Math.random() * canvas.height,
        x2: Math.random() * canvas.width,
        y2: Math.random() * canvas.height,
        speed: Math.random() * 0.5 + 0.1,
        angle: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.3 + 0.1
      });
    }

    let time = 0;
    // 动画循环
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      lines.forEach(line => {
        // 更新线条位置
        line.x1 += Math.cos(line.angle) * line.speed;
        line.y1 += Math.sin(line.angle) * line.speed;
        line.x2 += Math.cos(line.angle + Math.PI/4) * line.speed;
        line.y2 += Math.sin(line.angle + Math.PI/4) * line.speed;
        
        // 边界检查
        if (line.x1 < 0 || line.x1 > canvas.width || line.y1 < 0 || line.y1 > canvas.height) {
          line.x1 = Math.random() * canvas.width;
          line.y1 = Math.random() * canvas.height;
        }
        if (line.x2 < 0 || line.x2 > canvas.width || line.y2 < 0 || line.y2 > canvas.height) {
          line.x2 = Math.random() * canvas.width;
          line.y2 = Math.random() * canvas.height;
        }
        
        // 绘制线条
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.strokeStyle = `rgba(100, 149, 237, ${line.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      
      time += 0.016;
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    />
  );
};

export default NeuronAnimation; 