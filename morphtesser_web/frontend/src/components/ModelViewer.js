import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';

const ModelViewer = ({ objUrl, swcUrl, viewMode = "both", width = '100%', height = '100%' }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const frameIdRef = useRef(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  // 记录初始相机参数
  const initialCameraState = useRef({ position: null, target: null });
  const swcGroupRef = React.useRef(null);
  const objGroupRef = React.useRef(null);

  // 只在首次挂载时加载模型
  React.useEffect(() => {
    // 初始化场景
    const initScene = () => {
      // 创建场景
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);
      sceneRef.current = scene;

      // 创建相机
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.z = 5;
      cameraRef.current = camera;

      // 创建渲染器
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // 添加轨道控制
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controlsRef.current = controls;

      // 添加灯光
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      // 添加坐标轴辅助
      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);

      // 添加网格
      const gridHelper = new THREE.GridHelper(10, 10);
      scene.add(gridHelper);
    };

    // 加载OBJ模型
    if (objUrl) {
      const loader = new OBJLoader();
      loader.load(
        objUrl,
        (object) => {
          // 设置OBJ材质为半透明、颜色随机
          const randomColor = () => {
            // 生成随机颜色
            return Math.floor(Math.random() * 0xffffff);
          };
          object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material = new THREE.MeshPhongMaterial({
                color: randomColor(),
                specular: 0x111111,
                shininess: 30,
                transparent: true,
                opacity: 0.5,
              });
            }
          });
          object.name = 'objModel';
          objGroupRef.current = object;
          object.visible = viewMode !== "swc";
          // 移除之前的OBJ模型
          const existingObj = sceneRef.current.getObjectByName('objModel');
          if (existingObj) {
            sceneRef.current.remove(existingObj);
          }
          sceneRef.current.add(object);

          // 居中模型
          const box = new THREE.Box3().setFromObject(object);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          // 将OBJ整体居中到原点
          object.position.sub(center);

          // 自适应相机参数
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = cameraRef.current.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
          cameraZ *= 1.2; // 适当拉远
          cameraRef.current.position.set(0, 0, cameraZ);
          cameraRef.current.near = maxDim / 100;
          cameraRef.current.far = maxDim * 10;
          cameraRef.current.updateProjectionMatrix();
          // 控制器目标设置为原点
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
          setLoading(false);
        },
        undefined,
        (error) => {
          console.error('加载OBJ模型出错', error);
          setError('加载OBJ模型失败');
          setLoading(false);
        }
      );
    }
    // 加载SWC模型
    if (swcUrl) {
      fetch(swcUrl)
        .then(response => response.text())
        .then(data => {
          const swcGroup = new THREE.Group();
          swcGroup.name = 'swcModel';

          // 解析SWC文件
          const lines = data.split('\n');
          const nodes = {};

          for (let line of lines) {
            line = line.trim();
            if (line === '' || line.startsWith('#')) continue;
            const parts = line.split(/\s+/);
            if (parts.length < 7) continue;
            const id = parseInt(parts[0]);
            const type = parseInt(parts[1]);
            const x = parseFloat(parts[2]);
            const y = parseFloat(parts[3]);
            const z = parseFloat(parts[4]);
            const radius = parseFloat(parts[5]);
            const parent = parseInt(parts[6]);
            nodes[id] = { id, type, x, y, z, radius, parent };
            // 创建球体表示节点
            const sphereGeometry = new THREE.SphereGeometry(radius, 8, 8);
            const sphereMaterial = new THREE.MeshPhongMaterial({ 
              color: getColorByType(type),
              transparent: true,
              opacity: 0.7
            });
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.set(x, y, z);
            // 记录id到userData，便于聚焦soma
            sphere.userData = { id };
            swcGroup.add(sphere);
            // 如果有父节点，创建圆柱体连接
            if (parent !== -1 && nodes[parent]) {
              const parentNode = nodes[parent];
              const start = new THREE.Vector3(parentNode.x, parentNode.y, parentNode.z);
              const end = new THREE.Vector3(x, y, z);
              const direction = new THREE.Vector3().subVectors(end, start);
              const length = direction.length();
              const cylinderGeometry = new THREE.CylinderGeometry(
                radius * 0.5,
                parentNode.radius * 0.5,
                length,
                8,
                1
              );
              const cylinderMaterial = new THREE.MeshPhongMaterial({ 
                color: getColorByType(type),
                transparent: true,
                opacity: 0.7
              });
              const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
              cylinder.position.copy(start);
              cylinder.position.addScaledVector(direction, 0.5);
              cylinder.lookAt(end);
              cylinder.rotateX(Math.PI / 2);
              swcGroup.add(cylinder);
            }
          }

          swcGroupRef.current = swcGroup;
          swcGroup.visible = viewMode !== "obj";
          // 移除之前的SWC模型
          const existingSwc = sceneRef.current.getObjectByName('swcModel');
          if (existingSwc) {
            sceneRef.current.remove(existingSwc);
          }
          sceneRef.current.add(swcGroup);

          // 居中模型
          const box = new THREE.Box3().setFromObject(swcGroup);
          const center = box.getCenter(new THREE.Vector3());
          swcGroup.position.sub(center);

          // 调整相机位置
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = cameraRef.current.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
          cameraZ *= 1.0;
          cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
          controlsRef.current.target.copy(center);
          controlsRef.current.update();
          // 记录相机和target
          swcGroup.userData.cameraPosition = cameraRef.current.position.clone();
          swcGroup.userData.cameraTarget = controlsRef.current.target.clone();
          setLoading(false);
        })
        .catch(error => {
          console.error('加载SWC文件出错', error);
          setError('加载SWC文件失败');
          setLoading(false);
        });
    }
    
    // 根据神经元类型获取颜色
    const getColorByType = (type) => {
      const colors = {
        0: 0x000000, // 未定义
        1: 0xff0000, // 树突
        2: 0x00ff00, // 轴突
        3: 0x0000ff, // 基底树突
        4: 0xff00ff, // 顶端树突
        5: 0xffff00, // 分叉点
        6: 0x00ffff, // 终端
        7: 0xffffff  // 自定义
      };
      
      return colors[type] || 0x888888;
    };

    // 动画循环
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    // 处理窗口大小变化
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && mountRef.current) {
        cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      }
    };

    // 初始化
    initScene();
    
    // 开始动画
    animate();
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', handleResize);

    // 记录初始相机参数
    setTimeout(() => {
      if (cameraRef.current && controlsRef.current) {
        initialCameraState.current.position = cameraRef.current.position.clone();
        initialCameraState.current.target = controlsRef.current.target.clone();
      }
    }, 500);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameIdRef.current);
      // 彻底释放Three.js资源
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (mountRef.current && rendererRef.current && rendererRef.current.domElement) {
        try {
          mountRef.current.removeChild(rendererRef.current.domElement);
        } catch (e) {}
      }
      if (sceneRef.current) {
        sceneRef.current.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose && obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => m.dispose && m.dispose());
            } else {
              obj.material.dispose && obj.material.dispose();
            }
          }
        });
        while(sceneRef.current.children.length > 0) { 
          sceneRef.current.remove(sceneRef.current.children[0]); 
        }
      }
    };
  }, []); // 只在首次挂载时加载

  // 监听viewMode变化，切换visible
  React.useEffect(() => {
    if (swcGroupRef.current) swcGroupRef.current.visible = viewMode !== "obj";
    if (objGroupRef.current) objGroupRef.current.visible = viewMode !== "swc";
  }, [viewMode]);

  // 聚焦soma功能（OBJ模式下直接用swc的相机和target）
  const focusSoma = () => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    let targetMesh = null;
    const swcGroup = sceneRef.current.getObjectByName('swcModel');
    const objGroup = sceneRef.current.getObjectByName('objModel');
    // OBJ模式：如果有swc，直接用swc的相机和target
    if (objGroup && swcGroup && swcGroup.userData.cameraPosition && swcGroup.userData.cameraTarget) {
      cameraRef.current.position.copy(swcGroup.userData.cameraPosition);
      controlsRef.current.target.copy(swcGroup.userData.cameraTarget);
      controlsRef.current.update();
      return;
    }
    // SWC模式或无swc时，原有逻辑
    if (swcGroup) {
      let somaMesh = null;
      swcGroup.traverse(obj => {
        if (obj.isMesh && obj.geometry.type === 'SphereGeometry' && obj.userData && (obj.userData.id === 0 || obj.userData.id === 1)) {
          somaMesh = obj;
        }
      });
      if (!somaMesh) {
        swcGroup.traverse(obj => {
          if (!somaMesh && obj.isMesh && obj.geometry.type === 'SphereGeometry') somaMesh = obj;
        });
      }
      if (somaMesh) targetMesh = somaMesh;
    }
    if (!targetMesh) {
      if (objGroup) {
        let allVertices = [];
        objGroup.traverse(obj => {
          if (obj.isMesh && obj.geometry && obj.geometry.isBufferGeometry) {
            const posAttr = obj.geometry.attributes.position;
            if (posAttr && posAttr.count > 0) {
              for (let i = 0; i < posAttr.count; i++) {
                const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
                allVertices.push(v);
              }
            }
          }
        });
        if (allVertices.length > 0) {
          const n = Math.max(3, Math.ceil(allVertices.length * 0.01));
          const focusVerts = allVertices.slice(0, n);
          let sum = new THREE.Vector3(0,0,0);
          let min = new THREE.Vector3(Infinity,Infinity,Infinity);
          let max = new THREE.Vector3(-Infinity,-Infinity,-Infinity);
          focusVerts.forEach(v => {
            sum.add(v);
            min.min(v);
            max.max(v);
          });
          const center = sum.clone().divideScalar(focusVerts.length);
          const size = new THREE.Vector3().subVectors(max, min);
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = cameraRef.current.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
          cameraZ *= 0.5;
          cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
          controlsRef.current.target.copy(center);
          controlsRef.current.update();
          return;
        }
        let fallbackMesh = null;
        objGroup.traverse(obj => {
          if (!fallbackMesh && obj.isMesh) fallbackMesh = obj;
        });
        if (fallbackMesh) {
          const center = fallbackMesh.position.clone();
          cameraRef.current.position.set(center.x, center.y, center.z + 10);
          controlsRef.current.target.copy(center);
          controlsRef.current.update();
        }
      }
    } else {
      const center = targetMesh.position.clone();
      const radius = targetMesh.geometry && targetMesh.geometry.parameters && targetMesh.geometry.parameters.radius ? targetMesh.geometry.parameters.radius : 1;
      const fov = cameraRef.current.fov * (Math.PI / 180);
      let cameraZ = Math.abs(radius / Math.tan(fov / 2)) * 2.2;
      cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  };

  // 重置视角功能：恢复自适应视角
  const resetView = () => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    let group = null;
    if (viewMode === 'obj') {
      group = sceneRef.current.getObjectByName('objModel');
    } else if (viewMode === 'swc') {
      group = sceneRef.current.getObjectByName('swcModel');
    } else {
      // both模式优先OBJ
      group = sceneRef.current.getObjectByName('objModel') || sceneRef.current.getObjectByName('swcModel');
    }
    if (group) {
      const box = new THREE.Box3().setFromObject(group);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      // 居中
      group.position.sub(center);
      // 相机自适应
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= (viewMode === 'obj' ? 1.2 : 1.0);
      if (viewMode === 'obj') {
        cameraRef.current.position.set(0, 0, cameraZ);
        controlsRef.current.target.set(0, 0, 0);
      } else {
        cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
        controlsRef.current.target.copy(center);
      }
      cameraRef.current.near = maxDim / 100;
      cameraRef.current.far = maxDim * 10;
      cameraRef.current.updateProjectionMatrix();
      controlsRef.current.update();
    }
  };

  return (
    <Box sx={{ width, height, position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', gap: 1 }}>
        <Button variant="outlined" size="small" onClick={resetView}>Reset View</Button>
        <Button variant="outlined" size="small" onClick={focusSoma}>Focus Soma</Button>
      </Box>
      {loading && (
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 1
        }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 1
        }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      <Box ref={mountRef} sx={{ width: '100%', height: '100%' }} />
    </Box>
  );
};

export default ModelViewer; 