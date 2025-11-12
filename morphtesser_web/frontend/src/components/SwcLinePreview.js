import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { resolveApiUrl } from '../utils/api';

const SwcLinePreview = ({ swcUrl, width = '100%', height = 120 }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!swcUrl || !containerRef.current) return;

    // 初始化Three.js
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = containerRef.current ? new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / height, 0.1, 1000) : null;
    camera.position.z = 80;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0); // 完全透明
    if (containerRef.current) {
      renderer.setSize(containerRef.current.clientWidth, height);
    }
    containerRef.current.appendChild(renderer.domElement);

    // 解析SWC并生成线段
    fetch(resolveApiUrl(swcUrl))
      .then(res => res.text())
      .then(text => {
        const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'));
        const nodes = {};
        lines.forEach(line => {
          const [id, type, x, y, z, r, parent] = line.trim().split(/\s+/);
          nodes[id] = { id, x: +x, y: +y, z: +z, parent };
        });
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        lines.forEach(line => {
          const [id, , x, y, z, , parent] = line.trim().split(/\s+/);
          if (parent !== '-1' && nodes[parent]) {
            positions.push(+x, +y, +z, nodes[parent].x, nodes[parent].y, nodes[parent].z);
          }
        });
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const material = new THREE.LineBasicMaterial({ color: 0x3f51b5 });
        const lineseg = new THREE.LineSegments(geometry, material);
        scene.add(lineseg);

        // 自动居中并调整相机视角以包含全部模型
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        const center = box.getCenter(new THREE.Vector3());
        lineseg.position.sub(center);

        const size = box.getSize(new THREE.Vector3());
        // 找到最长轴
        let maxAxis = 'x';
        if (size.y > size.x && size.y > size.z) maxAxis = 'y';
        if (size.z > size.x && size.z > size.y) maxAxis = 'z';
        // 旋转到最长轴为x轴（横向）
        if (maxAxis === 'y') {
          lineseg.rotation.z = Math.PI / 2;
        } else if (maxAxis === 'z') {
          lineseg.rotation.y = Math.PI / 2;
        }

        // 重新计算旋转后的bounding box
        const box2 = new THREE.Box3().setFromObject(lineseg);
        const center2 = box2.getCenter(new THREE.Vector3());
        lineseg.position.sub(center2);

        const size2 = box2.getSize(new THREE.Vector3());
        const modelAspect = size2.x / size2.y;
        const containerAspect = containerRef.current ? containerRef.current.clientWidth / height : 1;
        let scale = 1;
        if (containerRef.current && size2.x) {
          scale = containerRef.current.clientWidth / size2.x * 0.85;
        } else {
          scale = height / size2.y * 0.85;
        }
        lineseg.scale.set(scale, scale, scale);

        // 再次计算缩放后的bounding box和居中
        const box3 = new THREE.Box3().setFromObject(lineseg);
        const size3 = box3.getSize(new THREE.Vector3());
        const center3 = box3.getCenter(new THREE.Vector3());
        lineseg.position.sub(center3);

        // 动态调整相机z
        const fov = camera.fov * (Math.PI / 180);
        const maxW = size3.x;
        const maxH = size3.y;
        const requiredZByW = (maxW / 2) / Math.tan(fov / 2) / containerAspect;
        const requiredZByH = (maxH / 2) / Math.tan(fov / 2);
        let cameraZ = Math.max(requiredZByW, requiredZByH) * 1.2;
        camera.position.set(0, 0, cameraZ);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();

        renderer.render(scene, camera);
      });

    // 清理
    return () => {
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
    };
  }, [swcUrl, height]);

  return <div ref={containerRef} style={{ width, height }} />;
};

export default SwcLinePreview; 