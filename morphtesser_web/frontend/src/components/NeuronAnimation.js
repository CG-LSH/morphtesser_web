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

    // 神经元树结构类
    class NeuronBranch {
      constructor(x, y, angle, depth) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.depth = depth;
        this.length = Math.random() * 20 + 10;
        this.branches = [];
        this.growing = true;
        this.currentLength = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.02;
        
        if (depth > 0) {
          const branchCount = Math.floor(Math.random() * 2) + 1;
          for (let i = 0; i < branchCount; i++) {
            const newAngle = angle + (Math.random() - 0.5) * Math.PI / 2;
            this.branches.push(new NeuronBranch(
              x + Math.cos(angle) * this.length,
              y + Math.sin(angle) * this.length,
              newAngle,
              depth - 1
            ));
          }
        }
      }

      draw(ctx, time) {
        if (this.growing) {
          this.currentLength += 0.5;
          if (this.currentLength >= this.length) {
            this.growing = false;
          }
        }

        // 计算脉冲效果
        const pulse = Math.sin(this.pulsePhase + time * this.pulseSpeed);
        const opacity = 0.3 + 0.2 * pulse;
        const width = this.depth + 1 + pulse * 0.5;

        const endX = this.x + Math.cos(this.angle) * this.currentLength;
        const endY = this.y + Math.sin(this.angle) * this.currentLength;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = `rgba(100, 149, 237, ${opacity})`;
        ctx.lineWidth = width;
        ctx.stroke();

        this.branches.forEach(branch => branch.draw(ctx, time));
      }
    }

    // 创建多个神经元树
    const neurons = [];
    for (let i = 0; i < 8; i++) {
      neurons.push(new NeuronBranch(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * Math.PI * 2,
        4
      ));
    }

    let time = 0;
    // 动画循环
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      neurons.forEach(neuron => neuron.draw(ctx, time));
      time += 0.016;  // 大约60fps
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
      }}
    />
  );
};

export default NeuronAnimation; 