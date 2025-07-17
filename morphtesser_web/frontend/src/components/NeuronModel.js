import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

const NeuronModel = ({ url }) => {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const groupRef = useRef();
  
  useEffect(() => {
    const loader = new OBJLoader();
    setLoading(true);
    
    loader.load(
      url,
      (obj) => {
        // 成功加载
        setModel(obj);
        setLoading(false);
      },
      (xhr) => {
        // 加载进度
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error) => {
        // 加载错误
        console.error('加载OBJ模型失败:', error);
        setError(error);
        setLoading(false);
      }
    );
  }, [url]);
  
  // 添加旋转动画
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });
  
  if (loading) {
    return null;
  }
  
  if (error) {
    return null;
  }
  
  return (
    <group ref={groupRef}>
      {model && <primitive object={model} scale={[0.05, 0.05, 0.05]} />}
    </group>
  );
};

export default NeuronModel; 