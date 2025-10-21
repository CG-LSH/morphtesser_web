import React, { useRef, useEffect, useState, useImperativeHandle } from 'react';
import { Box, CircularProgress, Typography, IconButton, Tooltip } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EdgeSplitModifier } from 'three/examples/jsm/modifiers/EdgeSplitModifier';

const ModelViewer = React.forwardRef(({ objUrl, dracoUrl, swcUrl, viewMode = "both", width = '100%', height = '100%', onResetView, backgroundColor = 0x000000, wireframeMode = false, doubleClickDistance = 0.2, useEdgeSplit = false }, ref) => {
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
  // 光源引用，便于基于模型尺寸自适应
  const ambientLightRef = useRef(null);
  const pointLight1Ref = useRef(null);
  const pointLight2Ref = useRef(null);
  const pointLight3Ref = useRef(null);
  const pointLight4Ref = useRef(null);

  // 根据模型尺寸更新光源位置和强度
  const updateLightsForModelSize = (maxDim) => {
    try {
      const d = Math.max(5, maxDim); // 至少5，避免太小
      if (pointLight1Ref.current) pointLight1Ref.current.position.set( d,  d,  d);
      if (pointLight2Ref.current) pointLight2Ref.current.position.set(-d,  d, -d);
      if (pointLight3Ref.current) pointLight3Ref.current.position.set( d, -d,  d);
      if (pointLight4Ref.current) pointLight4Ref.current.position.set(-d, -d, -d);
      // 强化背面光：近似认为 z 为负方向的是背面光
      if (pointLight2Ref.current) pointLight2Ref.current.intensity = 0.45;
      if (pointLight4Ref.current) pointLight4Ref.current.intensity = 0.45;
      if (pointLight1Ref.current) pointLight1Ref.current.intensity = 0.3;
      if (pointLight3Ref.current) pointLight3Ref.current.intensity = 0.3;
      if (ambientLightRef.current) ambientLightRef.current.intensity = 1.0;
      // 设置无衰减
      [pointLight1Ref, pointLight2Ref, pointLight3Ref, pointLight4Ref].forEach(ref => {
        if (ref.current) {
          ref.current.distance = 0; // 无限范围
          ref.current.decay = 0;    // 无衰减
        }
      });
    } catch (_) {}
  };

  // 统一的网格材质（与在线建模视图一致）
  const createMeshMaterial = () => {
    return new THREE.MeshPhysicalMaterial({
      color: 0x4a90e2,
      metalness: 0.2,
      roughness: 0.1,
      clearcoat: 0.9,
      clearcoatRoughness: 0.02,
      reflectivity: 0.8,
      flatShading: false,
      smoothShading: true,
      side: THREE.DoubleSide,
      transparent: false,
      opacity: 1.0
    });
  };

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
          0.0001,  // 极小的近裁剪面，允许观察最小细节
          10000    // 更大的远裁剪面，支持更大的场景
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
        // 高分屏渲染与色彩空间
        try { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); } catch (_) {}
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        try { renderer.outputColorSpace = THREE.SRGBColorSpace; } catch (_) {}
        renderer.shadowMap.enabled = true; // 启用阴影
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 使用软阴影
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

      // 添加轨道控制
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controlsRef.current = controls;

      // 添加双击放大功能
      let lastClickTime = 0;
      let clickCount = 0;
      const doubleClickThreshold = 300; // 双击时间阈值（毫秒）
      let isAnimating = false; // 防止动画冲突
      
      const handleClick = (event) => {
        // 如果正在动画中，忽略点击
        if (isAnimating) {
          return;
        }
        
        const currentTime = Date.now();
        
        if (currentTime - lastClickTime < doubleClickThreshold) {
          clickCount++;
        } else {
          clickCount = 1;
        }
        
        lastClickTime = currentTime;
        
        // 检测双击
        if (clickCount === 2) {
          clickCount = 0; // 重置计数
          isAnimating = true; // 开始动画
          
          console.log('Double-click detected');
          
          // 获取鼠标位置
          const rect = renderer.domElement.getBoundingClientRect();
          const mouse = new THREE.Vector2();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          
          // 创建射线投射器
          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouse, camera);
          
          // 获取所有可交互的对象
          const interactableObjects = [];
          scene.traverse((child) => {
            if (child.isMesh) {
              // 检查对象本身或其任何父级是否为模型组
              let current = child;
              let isModelObject = false;
              while (current) {
                if (current.name === 'objModel' || current.name === 'swcModel') {
                  isModelObject = true;
                  break;
                }
                current = current.parent;
              }
              if (isModelObject) {
                interactableObjects.push(child);
              }
            }
          });
          
          console.log('Interactable objects found:', interactableObjects.length);
          
          // 检测射线与对象的交点
          const intersects = raycaster.intersectObjects(interactableObjects, true);
          
          if (intersects.length > 0) {
            // 找到最近的交点
            const closestIntersect = intersects[0];
            const targetPoint = closestIntersect.point;
            
            console.log('Intersection found at:', targetPoint);
            
            // 基于模型尺寸动态计算合适的相机距离
            const intersectedObject = closestIntersect.object;
            let modelGroup = null;
            
            // 找到模型组（objModel 或 swcModel）
            if (intersectedObject.name === 'objModel' || intersectedObject.name === 'swcModel') {
              modelGroup = intersectedObject;
            } else if (intersectedObject.parent) {
              // 如果是子对象，找到父组
              let parent = intersectedObject.parent;
              while (parent && parent.name !== 'objModel' && parent.name !== 'swcModel') {
                parent = parent.parent;
              }
              if (parent) {
                modelGroup = parent;
              }
            }
            
            // 计算当前相机到目标点的距离
            const currentDistance = camera.position.distanceTo(targetPoint);
            
            // 使用传入的比例作为聚焦距离
            const distance = currentDistance * doubleClickDistance;
            
            console.log('Current distance:', currentDistance, 'Focus distance:', distance);
            
            // 计算相机新位置（保持当前方向，调整到合适距离）
            const direction = new THREE.Vector3().subVectors(camera.position, targetPoint).normalize();
            const finalPosition = new THREE.Vector3().copy(targetPoint).add(direction.multiplyScalar(distance));
            
            // 平滑过渡到新位置
            const startPosition = camera.position.clone();
            const startTarget = controls.target.clone();
            const endTarget = targetPoint.clone();
            
            let progress = 0;
            const duration = 500; // 动画持续时间（毫秒）- 改为0.5秒
            const startTime = Date.now();
            
            const animateCamera = () => {
              const elapsed = Date.now() - startTime;
              progress = Math.min(elapsed / duration, 1);
              
              // 使用缓动函数
              const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
              
              // 插值相机位置和目标
              camera.position.lerpVectors(startPosition, finalPosition, easeProgress);
              controls.target.lerpVectors(startTarget, endTarget, easeProgress);
              controls.update();
              
              if (progress < 1) {
                requestAnimationFrame(animateCamera);
              } else {
                // 动画完成，重置状态
                isAnimating = false;
              }
            };
            
            animateCamera();
            
            console.log('Double-click zoom to:', targetPoint);
          } else {
            // 如果没有点击到对象，则重置视角
            console.log('No intersection, resetting view');
            
            // 恢复初始相机状态
            if (initialCameraState.current.position && initialCameraState.current.target) {
              console.log('Restoring initial camera state');
              
              const startPosition = camera.position.clone();
              const startTarget = controls.target.clone();
              const endPosition = initialCameraState.current.position.clone();
              const endTarget = initialCameraState.current.target.clone();
              
              let progress = 0;
              const duration = 500; // 动画持续时间（毫秒）- 0.5秒
              const startTime = Date.now();
              
              const animateCamera = () => {
                const elapsed = Date.now() - startTime;
                progress = Math.min(elapsed / duration, 1);
                
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                
                camera.position.lerpVectors(startPosition, endPosition, easeProgress);
                controls.target.lerpVectors(startTarget, endTarget, easeProgress);
                controls.update();
                
                if (progress < 1) {
                  requestAnimationFrame(animateCamera);
                } else {
                  // 动画完成，重置状态
                  isAnimating = false;
                }
              };
              
              animateCamera();
              
              console.log('Double-click reset view to initial state');
            } else {
              // 如果没有初始状态，则使用默认视角
              console.log('No initial state, using default view');
              
              let group = null;
              if (viewModeRef.current === 'obj') {
                group = scene.getObjectByName('objModel');
              } else if (viewModeRef.current === 'swc') {
                group = scene.getObjectByName('swcModel');
              } else {
                group = scene.getObjectByName('objModel') || scene.getObjectByName('swcModel');
              }
              
              if (group) {
                const box = new THREE.Box3().setFromObject(group);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                
                // 相机自适应
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = camera.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
                cameraZ *= (viewModeRef.current === 'obj' ? 1.2 : 1.0);
                
                const startPosition = camera.position.clone();
                const startTarget = controls.target.clone();
                const endPosition = new THREE.Vector3(center.x, center.y, center.z + cameraZ);
                const endTarget = center.clone();
                
                let progress = 0;
                const duration = 500;
                const startTime = Date.now();
                
                const animateCamera = () => {
                  const elapsed = Date.now() - startTime;
                  progress = Math.min(elapsed / duration, 1);
                  
                  const easeProgress = 1 - Math.pow(1 - progress, 3);
                  
                  camera.position.lerpVectors(startPosition, endPosition, easeProgress);
                  controls.target.lerpVectors(startTarget, endTarget, easeProgress);
                  controls.update();
                  
                  if (progress < 1) {
                    requestAnimationFrame(animateCamera);
                  } else {
                    // 动画完成，重置状态
                    isAnimating = false;
                  }
                };
                
                animateCamera();
                
                console.log('Double-click reset view to model center');
              }
            }
          }
        }
      };
      
      // 添加单击事件监听器（手动检测双击）
      renderer.domElement.addEventListener('click', handleClick);
      
      // 保存双击处理函数引用，用于清理
      renderer.domElement._handleClick = handleClick;

      // 简化光照系统 - 环境光 + 点光源
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
      ambientLightRef.current = ambientLight;
      scene.add(ambientLight);

      // 添加多个点光源提供均匀照明
      const pointLight1 = new THREE.PointLight(0xffffff, 0.3, 0);
      pointLight1.position.set(5, 5, 5);
      pointLight1Ref.current = pointLight1;
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0xffffff, 0.3, 0);
      pointLight2.position.set(-5, 5, -5);
      pointLight2Ref.current = pointLight2;
      scene.add(pointLight2);

      const pointLight3 = new THREE.PointLight(0xffffff, 0.3, 0);
      pointLight3.position.set(5, -5, 5);
      pointLight3Ref.current = pointLight3;
      scene.add(pointLight3);

      const pointLight4 = new THREE.PointLight(0xffffff, 0.3, 0);
      pointLight4.position.set(-5, -5, -5);
      pointLight4Ref.current = pointLight4;
      scene.add(pointLight4);


      // 不显示坐标轴和网格，保持界面简洁
      // const axesHelper = new THREE.AxesHelper(5);
      // scene.add(axesHelper);

      // const gridHelper = new THREE.GridHelper(10, 10);
      // scene.add(gridHelper);
    } catch (error) {
      console.error('Failed to initialize 3D scene:', error);
      setError('Failed to initialize 3D scene: ' + error.message);
      setLoading(false);
      return;
    }
    };

    // 加载Draco模型（支持优先级选择）
    const loadDracoModel = (baseUrl) => {
      const dracoLoader = new DRACOLoader();
      // 使用CDN上的Draco解码器
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      
      // 尝试加载qp20版本，如果失败则加载qp14版本
      const tryLoadDraco = (url, fallbackUrl = null) => {
        dracoLoader.load(
          url,
        (geometry) => {
          // DRC 几何体处理：删除原有法向量，重新计算以确保平滑
          if (geometry.attributes.normal) {
            geometry.deleteAttribute('normal');
          }
          if (geometry.attributes.tangent) {
            geometry.deleteAttribute('tangent');
          }
          
          // 计算法向量
          geometry.computeVertexNormals();
          geometry.computeTangents();
          geometry.computeVertexNormals();
          geometry.normalizeNormals();
          
          // 根据 useEdgeSplit 参数决定是否使用 EdgeSplitModifier
          if (useEdgeSplit) {
            // 使用 EdgeSplitModifier 平滑边缘（在线建模专用）
            const edgeSplitModifier = new EdgeSplitModifier();
            geometry = edgeSplitModifier.modify(geometry, Math.PI / 6); // 30度阈值
            
            // 再次计算法向量以确保平滑
            geometry.computeVertexNormals();
            geometry.normalizeNormals();
          }
          
          // 标记几何体需要更新
          if (geometry.attributes.normal) {
            geometry.attributes.normal.needsUpdate = true;
          }
          if (geometry.attributes.position) {
            geometry.attributes.position.needsUpdate = true;
          }
          
          // 统一材质
          const material = createMeshMaterial();
          
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
          cameraRef.current.near = maxDim * 0.0001;  // 根据模型大小自适应近裁切面（模型尺寸的0.01%）
          cameraRef.current.far = maxDim * 10;
          cameraRef.current.updateProjectionMatrix();
          
          // 动态设置OrbitControls的距离限制
          if (controlsRef.current) {
            controlsRef.current.minDistance = 0;             // 最小距离：无限制，可以无限拉近
            controlsRef.current.maxDistance = maxDim * 5;     // 最大距离：模型尺寸的5倍
          }
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
          // 自适应光照
          updateLightsForModelSize(maxDim);
          
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
          // 如果有备用URL，尝试加载备用版本
          if (fallbackUrl) {
            console.log('Attempting to load fallback version:', fallbackUrl);
            tryLoadDraco(fallbackUrl);
          } else {
            setError('Failed to load Draco model');
            setLoading(false);
          }
        }
      );
      };
      
      // 根据baseUrl生成qp20和qp14的URL
      let qp20Url, qp14Url;
      if (baseUrl.includes('qp14')) {
        // 如果当前是qp14，尝试qp20
        qp20Url = baseUrl.replace('qp14', 'qp20');
        qp14Url = baseUrl; // 保留原qp14作为备用
      } else if (baseUrl.includes('qp20')) {
        // 如果当前是qp20，直接使用
        qp20Url = baseUrl;
        qp14Url = baseUrl.replace('qp20', 'qp14'); // qp14作为备用
      } else {
        // 如果URL中没有qp信息，尝试添加qp20
        qp20Url = baseUrl.replace('.drc', '_qp20.drc');
        qp14Url = baseUrl.replace('.drc', '_qp14.drc');
      }
      
      // 优先尝试qp20
      tryLoadDraco(qp20Url, qp14Url);
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
              // 完全忽略OBJ文件中的法向量，强制使用计算的法向量
              if (child.geometry) {
                // 删除所有现有法向量相关属性
                if (child.geometry.attributes.normal) {
                  child.geometry.deleteAttribute('normal');
                }
                // 删除可能存在的切线属性
                if (child.geometry.attributes.tangent) {
                  child.geometry.deleteAttribute('tangent');
                }
                
                // OBJ 几何体处理
                child.geometry.computeVertexNormals();
                child.geometry.computeTangents();
                child.geometry.computeVertexNormals();
                child.geometry.normalizeNormals();
                
                // 根据 useEdgeSplit 参数决定是否使用 EdgeSplitModifier
                if (useEdgeSplit) {
                  // 使用 EdgeSplitModifier 平滑边缘（在线建模专用）
                  const edgeSplitModifier = new EdgeSplitModifier();
                  child.geometry = edgeSplitModifier.modify(child.geometry, Math.PI / 6); // 30度阈值
                  
                  // 再次计算法向量以确保平滑
                  child.geometry.computeVertexNormals();
                  child.geometry.normalizeNormals();
                }
                
                // 确保几何体标记为需要更新
                child.geometry.attributes.normal.needsUpdate = true;
                child.geometry.attributes.position.needsUpdate = true;
              }
              // 使用统一的 MeshPhysicalMaterial
              child.material = createMeshMaterial();
              // 启用阴影
              child.castShadow = true;
              child.receiveShadow = true;
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
          cameraRef.current.near = maxDim * 0.0001;  // 根据模型大小自适应近裁切面（模型尺寸的0.01%）
          cameraRef.current.far = maxDim * 10;
          cameraRef.current.updateProjectionMatrix();
          
          // 动态设置OrbitControls的距离限制
          if (controlsRef.current) {
            controlsRef.current.minDistance = 0;             // 最小距离：无限制，可以无限拉近
            controlsRef.current.maxDistance = maxDim * 5;     // 最大距离：模型尺寸的5倍
          }
          // 控制器目标设置为原点
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
          // 自适应光照（OBJ）
          updateLightsForModelSize(maxDim);
          
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
          console.error('Error loading OBJ model', error);
          setError('Failed to load OBJ model');
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

          // 第二遍：创建圆柱体连接；soma仅渲染一个点（parent === -1）
          let somaAdded = false;
          for (let id in nodes) {
            const node = nodes[id];
            const parent = node.parent;
            
            // 只为 parent === -1 的第一个节点渲染一个红色点作为 soma
            if (!somaAdded && parent === -1) {
              const geom = new THREE.BufferGeometry();
              const positions = new Float32Array([node.x, node.y, node.z]);
              geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
              const mat = new THREE.PointsMaterial({ color: 0xff0000, size: 6, sizeAttenuation: true });
              const point = new THREE.Points(geom, mat);
              point.userData = { id: node.id, type: node.type };
              swcGroup.add(point);
              somaAdded = true;
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
                  16, // 径向分段（更细分，更接近圆形）
                  1, // 高度分段
                  true // 开放两端：仅保留侧面，不渲染上下底面
                );
                const cylinderMaterial = new THREE.MeshPhysicalMaterial({ 
                  color: randomColor(),
                  metalness: 0.2,
                  roughness: 0.1,
                  clearcoat: 0.9,
                  clearcoatRoughness: 0.02,
                  reflectivity: 0.8,
                  flatShading: false,
                  smoothShading: true,
                  side: THREE.DoubleSide,
                  transparent: false,
                  opacity: 1.0
                });
                const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
                cylinder.castShadow = true;
                cylinder.receiveShadow = true;
                
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
          // 自适应光照
          updateLightsForModelSize(maxDim);
          
          // 动态设置OrbitControls的距离限制
          if (controlsRef.current) {
            controlsRef.current.minDistance = 0;             // 最小距离：无限制，可以无限拉近
            controlsRef.current.maxDistance = maxDim * 5;     // 最大距离：模型尺寸的5倍
          }
          
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
          console.error('Error loading SWC file', error);
          setError('Failed to load SWC file');
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
      // 移除单击事件监听器
      if (rendererRef.current && rendererRef.current.domElement && rendererRef.current.domElement._handleClick) {
        rendererRef.current.domElement.removeEventListener('click', rendererRef.current.domElement._handleClick);
        delete rendererRef.current.domElement._handleClick;
      }
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
      cameraRef.current.near = maxDim * 0.0001;  // 根据模型大小自适应近裁切面（模型尺寸的0.01%）
      cameraRef.current.far = maxDim * 10;
      cameraRef.current.updateProjectionMatrix();
      controlsRef.current.update();
    }
  }, []); // 移除 viewMode 依赖，使用 ref 来获取当前值


  // 移除之前的函数暴露机制，现在使用ref
  // React.useEffect(() => {
  //   if (onResetView) {
  //     onResetView(resetView);
  //   }
  // }, [onResetView]); // 移除 resetView 依赖

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