import React, { useRef, useEffect, useState, useImperativeHandle } from 'react';
import { Box, CircularProgress, Typography, IconButton, Tooltip } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const ModelViewer = React.forwardRef(({ objUrl, dracoUrl, swcUrl, viewMode = "both", width = '100%', height = '100%', onResetView, onFocusSoma, backgroundColor = 0x000000, wireframeMode = false }, ref) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const frameIdRef = useRef(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showWireframe, setShowWireframe] = React.useState(false);
  // 记录初始相机参数
  const initialCameraState = useRef({ position: null, target: null });
  const swcGroupRef = React.useRef(null);
  const objGroupRef = React.useRef(null);
  const viewModeRef = useRef(viewMode); // 添加viewMode的ref

  // 更新viewModeRef
  React.useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  // 监听外部线框模式变化
  React.useEffect(() => {
    if (wireframeMode !== showWireframe) {
      setShowWireframe(wireframeMode);
      applyWireframeMode(wireframeMode);
    }
  }, [wireframeMode]);

  // 应用线框模式
  const applyWireframeMode = (wireframeState) => {
    if (sceneRef.current) {
      // 切换OBJ模型的线框模式
      const objModel = sceneRef.current.getObjectByName('objModel');
      if (objModel) {
        if (objModel.material) {
          objModel.material.wireframe = wireframeState;
          // 线框模式时只显示正面，实体模式时显示双面
          objModel.material.side = wireframeState ? THREE.FrontSide : THREE.DoubleSide;
        } else if (objModel.children && objModel.children.length > 0) {
          // 如果是组对象，遍历所有子对象
          objModel.traverse((child) => {
            if (child.material) {
              child.material.wireframe = wireframeState;
              child.material.side = wireframeState ? THREE.FrontSide : THREE.DoubleSide;
            }
          });
        }
      }
      
      // 切换SWC模型的线框模式
      const swcModel = sceneRef.current.getObjectByName('swcModel');
      if (swcModel) {
        swcModel.traverse((child) => {
          if (child.material) {
            child.material.wireframe = wireframeState;
            child.material.side = wireframeState ? THREE.FrontSide : THREE.DoubleSide;
          }
        });
      }
    }
  };

  // 切换线框模式
  const toggleWireframe = () => {
    const newWireframeState = !showWireframe;
    setShowWireframe(newWireframeState);
    
    if (sceneRef.current) {
      // 切换OBJ模型的线框模式
      const objModel = sceneRef.current.getObjectByName('objModel');
      if (objModel) {
        if (objModel.material) {
          objModel.material.wireframe = newWireframeState;
          // 线框模式时只显示正面，实体模式时显示双面
          objModel.material.side = newWireframeState ? THREE.FrontSide : THREE.DoubleSide;
        } else if (objModel.children && objModel.children.length > 0) {
          // 如果是组对象，遍历所有子对象
          objModel.traverse((child) => {
            if (child.material) {
              child.material.wireframe = newWireframeState;
              child.material.side = newWireframeState ? THREE.FrontSide : THREE.DoubleSide;
            }
          });
        }
      }
      
      // 切换SWC模型的线框模式
      const swcModel = sceneRef.current.getObjectByName('swcModel');
      if (swcModel) {
        swcModel.traverse((child) => {
          if (child.material) {
            child.material.wireframe = newWireframeState;
            child.material.side = newWireframeState ? THREE.FrontSide : THREE.DoubleSide;
          }
        });
      }
    }
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    resetView,
    focusSoma,
    toggleWireframe
  }), []);

  // 只在首次挂载时加载模型
  React.useEffect(() => {
    // 检查WebGL支持
    if (!mountRef.current) {
      console.error('Mount ref is null');
      return;
    }

    // 检查WebGL可用性
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setError('WebGL is not supported in this browser');
      setLoading(false);
      return;
    }

    // 初始化场景
    const initScene = () => {
      try {
              // 创建场景
      const scene = new THREE.Scene();
      try {
        scene.background = new THREE.Color(backgroundColor);
      } catch (e) {
        scene.background = new THREE.Color(0x000000);
      }
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
        const renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: false,
          physicallyCorrectLights: true, // 启用物理正确光照
          toneMapping: THREE.ACESFilmicToneMapping, // 使用ACES色调映射
          toneMappingExposure: 1.0,
        });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.shadowMap.enabled = true; // 启用阴影
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 使用软阴影
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

      // 添加轨道控制
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controlsRef.current = controls;

      // 增强光照系统
      // 环境光 - 提供基础照明
      const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
      scene.add(ambientLight);

      // 主光源 - 模拟太阳光
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight.position.set(5, 5, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
      directionalLight.shadow.camera.left = -10;
      directionalLight.shadow.camera.right = 10;
      directionalLight.shadow.camera.top = 10;
      directionalLight.shadow.camera.bottom = -10;
      scene.add(directionalLight);

      // 补光 - 从右侧
      const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.4);
      fillLight.position.set(-3, 2, 3);
      scene.add(fillLight);

      // 背光 - 增加轮廓
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
      rimLight.position.set(0, 0, -5);
      scene.add(rimLight);

      // 点光源 - 增加细节
      const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
      pointLight.position.set(0, 3, 0);
      pointLight.castShadow = true;
      scene.add(pointLight);

      // // 添加顶部光源
      // const topLight = new THREE.DirectionalLight(0xffffff, 0.3);
      // topLight.position.set(0, 1, 0);
      // scene.add(topLight);

      // // 添加底部光源
      // const bottomLight = new THREE.DirectionalLight(0xffffff, 0.2);
      // bottomLight.position.set(0, -1, 0);
      // scene.add(bottomLight);

      // 不显示坐标轴和网格，保持界面简洁
      // const axesHelper = new THREE.AxesHelper(5);
      // scene.add(axesHelper);

      // const gridHelper = new THREE.GridHelper(10, 10);
      // scene.add(gridHelper);
    } catch (error) {
      console.error('初始化3D场景失败:', error);
      setError('初始化3D场景失败: ' + error.message);
      setLoading(false);
      return;
    }
    };

    // 加载Draco模型
    const loadDracoModel = (url) => {
      const dracoLoader = new DRACOLoader();
      // 使用CDN上的Draco解码器
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      
      dracoLoader.load(
        url,
        (geometry) => {
          // 计算法向量以实现平滑渲染
          geometry.computeVertexNormals();
          
          // 启用平滑着色
          geometry.computeTangents();
          
          // 设置平滑组，确保所有面都平滑
          if (geometry.attributes.normal) {
            // 重新计算法向量以确保平滑
            geometry.computeVertexNormals();
          }
          
          // 创建更高级的材质
          const material = new THREE.MeshPhysicalMaterial({
            color: 0x4a90e2, // 蓝色调
            metalness: 0.2,
            roughness: 0.1, // 降低粗糙度，增加平滑感
            clearcoat: 0.9,
            clearcoatRoughness: 0.02, // 降低清漆粗糙度，更平滑
            reflectivity: 0.8,
            transparent: false,
            opacity: 1.0,
            side: THREE.DoubleSide,
            // 添加一些发光效果
            emissive: 0x001122,
            emissiveIntensity: 0.2,
            // 增加平滑细节
            normalScale: new THREE.Vector2(0.2, 0.2), // 降低法向量强度，更平滑
            // 增加材质的深度感
            transmission: 0.1,
            thickness: 0.5,
            // 启用平滑着色
            flatShading: false, // 确保使用平滑着色
          });
          
          // 添加材质动画效果
          const animateMaterial = () => {
            const time = Date.now() * 0.001;
            material.emissiveIntensity = 0.1 + Math.sin(time * 0.5) * 0.1;
            material.clearcoatRoughness = 0.05 + Math.sin(time * 0.3) * 0.02;
          };
          
          // 在渲染循环中添加材质动画
          const animate = () => {
            animateMaterial();
            requestAnimationFrame(animate);
          };
          animate();
          
          const mesh = new THREE.Mesh(geometry, material);
          mesh.name = 'objModel';
          mesh.castShadow = true; // 启用阴影投射
          mesh.receiveShadow = true; // 启用阴影接收
          objGroupRef.current = mesh;
          mesh.visible = viewModeRef.current !== "swc";
          
          // 移除之前的OBJ模型
          const existingObj = sceneRef.current.getObjectByName('objModel');
          if (existingObj) {
            sceneRef.current.remove(existingObj);
          }
          sceneRef.current.add(mesh);

          // 居中模型
          const box = new THREE.Box3().setFromObject(mesh);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          if (Math.abs(center.x) > 0.1 || Math.abs(center.y) > 0.1 || Math.abs(center.z) > 0.1) {
            mesh.position.sub(center);
          }

          // 自适应相机参数
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = cameraRef.current.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
          cameraZ *= 1.2;
          
          cameraRef.current.position.set(0, 0, cameraZ);
          cameraRef.current.near = maxDim / 100;
          cameraRef.current.far = maxDim * 10;
          cameraRef.current.updateProjectionMatrix();
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
          
          // 保存初始相机状态
          initialCameraState.current = {
            position: cameraRef.current.position.clone(),
            target: controlsRef.current.target.clone()
          };
          
          setLoading(false);
        },
        (progress) => {
          console.log('Draco加载进度:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
        },
        (error) => {
          console.error('Draco加载失败:', error);
          setError('Draco模型加载失败');
          setLoading(false);
        }
      );
    };

    // 加载OBJ模型
    const loadOBJModel = (url) => {
      const loader = new OBJLoader();
      loader.load(
        url,
        (object) => {
          // 设置OBJ材质为半透明、颜色随机
          const randomColor = () => {
            // 生成随机颜色
            return Math.floor(Math.random() * 0xffffff);
          };
          object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              // 计算法向量以实现平滑渲染
              if (child.geometry) {
                child.geometry.computeVertexNormals();
                // 启用平滑着色
                child.geometry.computeTangents();
              }
              child.material = new THREE.MeshPhongMaterial({
                color: randomColor(),
                specular: 0x111111,
                shininess: 30,
                transparent: false,
                opacity: 1.0,
                flatShading: false, // 启用平滑着色
                side: THREE.DoubleSide, // 双面渲染
              });
            }
          });
          object.name = 'objModel';
          objGroupRef.current = object;
          object.visible = viewModeRef.current !== "swc";
          // 移除之前的OBJ模型
          const existingObj = sceneRef.current.getObjectByName('objModel');
          if (existingObj) {
            sceneRef.current.remove(existingObj);
          }
          sceneRef.current.add(object);

          // 居中模型 - 使用固定的居中逻辑
          const box = new THREE.Box3().setFromObject(object);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          // 检查是否已经居中过，避免重复居中
          if (Math.abs(center.x) > 0.1 || Math.abs(center.y) > 0.1 || Math.abs(center.z) > 0.1) {
            // 将OBJ整体居中到原点
            object.position.sub(center);
            console.log('Centered OBJ model to origin');
          } else {
            console.log('OBJ model already centered');
          }

          // 自适应相机参数
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = cameraRef.current.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
          cameraZ *= 1.2; // 适当拉远
          
          // 确保相机位置一致
          cameraRef.current.position.set(0, 0, cameraZ);
          cameraRef.current.near = maxDim / 100;
          cameraRef.current.far = maxDim * 10;
          cameraRef.current.updateProjectionMatrix();
          // 控制器目标设置为原点
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
          
          console.log('Camera position set to:', cameraRef.current.position);
          console.log('Camera target set to:', controlsRef.current.target);
          
          // 保存初始相机状态
          initialCameraState.current = {
            position: cameraRef.current.position.clone(),
            target: controlsRef.current.target.clone()
          };
          
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

          // 生成随机颜色函数
          const randomColor = () => {
            return Math.floor(Math.random() * 0xffffff);
          };

          // 解析SWC文件
          const lines = data.split('\n');
          const nodes = {};

          // 第一遍：收集所有节点
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
          }

          // 第二遍：创建圆柱体连接和soma球体（参考sharkviewer方式）
          for (let id in nodes) {
            const node = nodes[id];
            const parent = node.parent;
            
            // 显示soma点（随机颜色球体）
            if (node.type === 1) { // soma类型
              const sphereGeometry = new THREE.SphereGeometry(node.radius, 8, 8);
              const sphereMaterial = new THREE.MeshPhongMaterial({ 
                color: randomColor(), // 随机颜色
                transparent: false,
                opacity: 1.0,
                side: THREE.DoubleSide // 双面渲染
              });
              const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
              sphere.position.set(node.x, node.y, node.z);
              sphere.userData = { id: node.id, type: node.type };
              swcGroup.add(sphere);
            }
            
            // 如果有父节点，创建圆柱体连接
            if (parent !== -1 && nodes[parent]) {
              const parentNode = nodes[parent];
              const start = new THREE.Vector3(parentNode.x, parentNode.y, parentNode.z);
              const end = new THREE.Vector3(node.x, node.y, node.z);
              const direction = new THREE.Vector3().subVectors(end, start);
              const length = direction.length();
              
              if (length > 0) {
                // 严格符合半径的圆柱体
                const cylinderGeometry = new THREE.CylinderGeometry(
                  node.radius, // 当前节点半径
                  parentNode.radius, // 父节点半径
                  length,
                  8, // 分段数
                  1, // 高度分段
                  false // 不开放
                );
                const cylinderMaterial = new THREE.MeshPhongMaterial({ 
                  color: randomColor(), // 随机颜色
                  transparent: false,
                  opacity: 1.0,
                  side: THREE.DoubleSide // 双面渲染
                });
                const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
                
                // 设置圆柱体位置和方向
                cylinder.position.copy(start);
                cylinder.position.addScaledVector(direction, 0.5);
                cylinder.lookAt(end);
                cylinder.rotateX(Math.PI / 2);
                cylinder.userData = { id: node.id, parentId: parent, type: node.type };
                swcGroup.add(cylinder);
              }
            }
          }

          swcGroupRef.current = swcGroup;
          swcGroup.visible = viewModeRef.current !== "obj";
          // 移除之前的SWC模型
          const existingSwc = sceneRef.current.getObjectByName('swcModel');
          if (existingSwc) {
            sceneRef.current.remove(existingSwc);
          }
          sceneRef.current.add(swcGroup);

          // 居中模型 - 使用固定的居中逻辑
          const box = new THREE.Box3().setFromObject(swcGroup);
          const center = box.getCenter(new THREE.Vector3());
          
          // 检查是否已经居中过，避免重复居中
          if (Math.abs(center.x) > 0.1 || Math.abs(center.y) > 0.1 || Math.abs(center.z) > 0.1) {
            swcGroup.position.sub(center);
            console.log('Centered SWC model to origin');
          } else {
            console.log('SWC model already centered');
          }

          // 调整相机位置
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = cameraRef.current.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
          cameraZ *= 1.0;
          
          // 确保相机位置一致 - 使用居中的模型位置
          const centeredCenter = new THREE.Vector3(0, 0, 0); // 因为模型已经居中到原点
          cameraRef.current.position.set(centeredCenter.x, centeredCenter.y, centeredCenter.z + cameraZ);
          controlsRef.current.target.copy(centeredCenter);
          controlsRef.current.update();
          
          console.log('SWC Camera position set to:', cameraRef.current.position);
          console.log('SWC Camera target set to:', controlsRef.current.target);
          
          // 保存初始相机状态
          initialCameraState.current = {
            position: cameraRef.current.position.clone(),
            target: controlsRef.current.target.clone()
          };
          
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
    
    // 根据文件类型选择加载方式
    if (dracoUrl) {
      // 优先加载Draco文件
      loadDracoModel(dracoUrl);
    } else if (objUrl) {
      // 检查是否为Draco文件
      if (objUrl.toLowerCase().endsWith('.drc') || objUrl.includes('draco')) {
        loadDracoModel(objUrl);
      } else {
        loadOBJModel(objUrl);
      }
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
      if (cameraRef.current && controlsRef.current && !initialCameraState.current.position) {
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
    if (swcGroupRef.current) swcGroupRef.current.visible = viewModeRef.current !== "obj";
    if (objGroupRef.current) objGroupRef.current.visible = viewModeRef.current !== "swc";
    
    // 移除对保存的soma聚焦视野的应用，让SWC/MESH切换保持独立
    // 当切换到MESH模式时，如果有保存的soma聚焦视野，则应用它
    // if (viewModeRef.current === 'obj' && swcGroupRef.current && swcGroupRef.current.userData.somaFocusPosition) {
    //   console.log('Applying saved soma focus view to MESH mode');
    //   cameraRef.current.position.copy(swcGroupRef.current.userData.somaFocusPosition);
    //   controlsRef.current.target.copy(swcGroupRef.current.userData.somaFocusTarget);
    //   controlsRef.current.update();
    // }
    // 注意：不在这里重置相机位置，保持用户当前的视角
  }, [viewMode]);

  // 重置视角功能：恢复初始加载视角
  const resetView = React.useCallback(() => {
    console.log('resetView function called');
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) {
      console.log('Scene, camera, or controls not available');
      return;
    }
    
    // 恢复初始相机状态
    if (initialCameraState.current.position && initialCameraState.current.target) {
      console.log('Restoring initial camera state');
      cameraRef.current.position.copy(initialCameraState.current.position);
      controlsRef.current.target.copy(initialCameraState.current.target);
      controlsRef.current.update();
      return;
    }
    
    console.log('No initial state, using default view');
    // 如果没有初始状态，则使用默认视角
    let group = null;
    if (viewModeRef.current === 'obj') {
      group = sceneRef.current.getObjectByName('objModel');
    } else if (viewModeRef.current === 'swc') {
      group = sceneRef.current.getObjectByName('swcModel');
    } else {
      // both模式优先OBJ
      group = sceneRef.current.getObjectByName('objModel') || sceneRef.current.getObjectByName('swcModel');
    }
    if (group) {
      const box = new THREE.Box3().setFromObject(group);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      // 相机自适应 - 不修改模型位置，只调整相机
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= (viewModeRef.current === 'obj' ? 1.2 : 1.0);
      
      // 设置相机位置和目标，不修改模型位置
      cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
      controlsRef.current.target.copy(center);
      cameraRef.current.near = maxDim / 100;
      cameraRef.current.far = maxDim * 10;
      cameraRef.current.updateProjectionMatrix();
      controlsRef.current.update();
    }
  }, []); // 移除 viewMode 依赖，使用 ref 来获取当前值

  // 聚焦soma功能：聚焦SWC的soma节点，并将相同视角应用到mesh
  const focusSoma = React.useCallback(() => {
    console.log('focusSoma function called');
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) {
      console.log('Scene, camera, or controls not available');
      return;
    }
    
    // 首先尝试找到SWC的soma节点（红色球）
    const swcGroup = sceneRef.current.getObjectByName('swcModel');
    let somaMesh = null;
    let somaPosition = null;
    
    if (swcGroup) {
      console.log('Found SWC group, searching for soma (red sphere)');
      // 寻找soma节点（红色球体，通常是id为0或1的球体）
      swcGroup.traverse(obj => {
        if (obj.isMesh && obj.geometry.type === 'SphereGeometry' && obj.userData && (obj.userData.id === 0 || obj.userData.id === 1)) {
          somaMesh = obj;
          somaPosition = obj.position.clone();
          console.log('Found soma with id:', obj.userData.id, 'at position:', somaPosition);
        }
      });
      
      // 如果没找到id为0或1的，寻找第一个红色球体
      if (!somaMesh) {
        console.log('No soma with id 0 or 1, searching for any red sphere');
        swcGroup.traverse(obj => {
          if (!somaMesh && obj.isMesh && obj.geometry.type === 'SphereGeometry' && obj.material && obj.material.color && obj.material.color.getHex() === 0xff0000) {
            somaMesh = obj;
            somaPosition = obj.position.clone();
            console.log('Found first red sphere as soma at position:', somaPosition);
          }
        });
      }
      
      // 如果还是没找到，寻找任何球体
      if (!somaMesh) {
        console.log('No red sphere found, searching for any sphere');
        swcGroup.traverse(obj => {
          if (!somaMesh && obj.isMesh && obj.geometry.type === 'SphereGeometry') {
            somaMesh = obj;
            somaPosition = obj.position.clone();
            console.log('Found first sphere as soma at position:', somaPosition);
          }
        });
      }
    }
    
    if (somaPosition) {
      console.log('Focusing on soma at position:', somaPosition);
      
      // 考虑SWC模型的居中偏移
      const worldPosition = somaPosition.clone();
      worldPosition.add(swcGroup.position);
      console.log('Soma world position (after centering):', worldPosition);
      
      // 计算聚焦到soma的相机位置
      const radius = somaMesh.geometry && somaMesh.geometry.parameters && somaMesh.geometry.parameters.radius ? somaMesh.geometry.parameters.radius : 1;
      const fov = cameraRef.current.fov * (Math.PI / 180);
      let cameraZ = Math.abs(radius / Math.tan(fov / 2)) * 3.0; // 增加距离确保红色球在视野中心
      
      // 设置相机位置和目标，确保红色球在视角中心
      cameraRef.current.position.set(worldPosition.x, worldPosition.y, worldPosition.z + cameraZ);
      controlsRef.current.target.copy(worldPosition);
      controlsRef.current.update();
      
      console.log('Camera position set to:', cameraRef.current.position);
      console.log('Camera target set to:', controlsRef.current.target);
      
      // 移除对userData的修改，避免影响SWC/MESH视角切换
      // if (swcGroup) {
      //   swcGroup.userData.somaFocusPosition = cameraRef.current.position.clone();
      //   swcGroup.userData.somaFocusTarget = controlsRef.current.target.clone();
      //   console.log('Saved soma focus view for MESH mode');
      // }
    } else {
      console.log('No soma found, focusing on model center');
      // 如果没有找到soma，使用模型中心
      let group = null;
      if (viewModeRef.current === 'obj') {
        group = sceneRef.current.getObjectByName('objModel');
      } else if (viewModeRef.current === 'swc') {
        group = sceneRef.current.getObjectByName('swcModel');
      } else {
        group = sceneRef.current.getObjectByName('objModel') || sceneRef.current.getObjectByName('swcModel');
      }
      
      if (group) {
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = cameraRef.current.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 0.5; // 更近的视角
        
        cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }
    }
  }, []); // 移除 viewMode 依赖，使用 ref 来获取当前值

  // 移除之前的函数暴露机制，现在使用ref
  // React.useEffect(() => {
  //   if (onResetView) {
  //     onResetView(resetView);
  //   }
  //   if (onFocusSoma) {
  //     onFocusSoma(focusSoma);
  //   }
  // }, [onResetView, onFocusSoma]); // 移除 resetView 和 focusSoma 依赖

  return (
    <Box sx={{ width, height, position: 'relative' }}>
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
});

export default ModelViewer; 