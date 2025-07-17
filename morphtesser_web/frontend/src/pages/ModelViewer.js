import React, { useEffect, useRef, useState } from 'react';
import { Card, Tabs, Statistic, Button, Row, Col, Spin } from 'antd';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import axios from 'axios';

const { TabPane } = Tabs;

const ModelViewer = ({ match }) => {
  const modelId = match.params.modelId;
  const [loading, setLoading] = useState(true);
  const [modelData, setModelData] = useState(null);
  const swcContainerRef = useRef(null);
  const objContainerRef = useRef(null);
  
  useEffect(() => {
    // 获取模型数据
    axios.get(`/api/models/${modelId}`)
      .then(response => {
        setModelData(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('获取模型数据失败:', error);
        setLoading(false);
      });
  }, [modelId]);

  useEffect(() => {
    if (!loading && modelData) {
      // 初始化SWC骨架可视化
      initSWCViewer();
      
      // 初始化OBJ模型可视化
      initOBJViewer();
    }
  }, [loading, modelData]);

  const initSWCViewer = () => {
    // Three.js初始化SWC骨架可视化
    const container = swcContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    
    // 这里添加SWC骨架的可视化代码
    // ...

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    return () => {
      container.removeChild(renderer.domElement);
    };
  };

  const initOBJViewer = () => {
    // Three.js初始化OBJ模型可视化
    const container = objContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    
    // 添加光源
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // 加载OBJ模型
    const loader = new OBJLoader();
    loader.load(
      modelData.objUrl,
      (object) => {
        scene.add(object);
        
        // 调整相机位置以适应模型
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.copy(center);
        camera.position.z += maxDim * 2;
        camera.lookAt(center);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('加载OBJ模型失败:', error);
      }
    );
    
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    return () => {
      container.removeChild(renderer.domElement);
    };
  };

  const handleDownload = () => {
    window.location.href = modelData.objUrl;
  };

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div className="model-viewer-container">
      <Row gutter={16}>
        <Col span={16}>
          <Tabs defaultActiveKey="1">
            <TabPane tab="SWC骨架" key="1">
              <div ref={swcContainerRef} className="viewer-container"></div>
            </TabPane>
            <TabPane tab="OBJ模型" key="2">
              <div ref={objContainerRef} className="viewer-container"></div>
            </TabPane>
            <TabPane tab="对比视图" key="3">
              <Row gutter={16}>
                <Col span={12}>
                  <div ref={swcContainerRef} className="viewer-container-small"></div>
                </Col>
                <Col span={12}>
                  <div ref={objContainerRef} className="viewer-container-small"></div>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Col>
        <Col span={8}>
          <Card title="模型信息" className="model-info-card">
            <Statistic title="名称" value={modelData.name} />
            <Statistic title="创建时间" value={modelData.createdAt} />
            <Statistic title="神经元长度" value={modelData.length} suffix="μm" />
            <Statistic title="表面积" value={modelData.surfaceArea} suffix="μm²" />
            <Statistic title="体积" value={modelData.volume} suffix="μm³" />
            <Button 
              type="primary" 
              onClick={handleDownload} 
              style={{ marginTop: 16 }}
              block
            >
              下载OBJ模型
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ModelViewer; 