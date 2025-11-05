import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import DownloadIcon from '@mui/icons-material/Download';
import GridOnIcon from '@mui/icons-material/GridOn';
import GridOffIcon from '@mui/icons-material/GridOff';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ModelViewer from '../components/ModelViewer';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';

// 轻量嵌入式页面：通过 /embed/mesh/:id 渲染 OBJ Mesh
// 规则：从本地文件夹 X:\morphtesser_exp\neuromorpho_08\results 下根据ID查找对应的 OBJ 文件
// 支持通过 ?quality=mc 强制使用 data_mc.obj，否则使用 data_refined.obj
// 查找路径：X:\morphtesser_exp\neuromorpho_08\results\{前三位}\{id}.swc\data_{quality}.obj

export default function EmbedMesh() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const [resolvedUrl, setResolvedUrl] = React.useState(null);
    const [swcUrl, setSwcUrl] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [showWireframe, setShowWireframe] = React.useState(false);
    const modelViewerRef = React.useRef(null);

    // 切换线框模式
    const toggleWireframe = () => {
        setShowWireframe(!showWireframe);
    };

    // 处理Reset View
    const handleResetView = () => {
        console.log('Reset View clicked');
        if (modelViewerRef.current && modelViewerRef.current.resetView) {
            modelViewerRef.current.resetView();
        } else {
            console.log('ModelViewer ref or resetView method not available');
        }
    };


    // 下载逻辑：优先DRC解压为OBJ，否则直接下载OBJ
    const handleDownload = async () => {
        if (!resolvedUrl) return;
        
        try {
            // 检查是否是DRC文件
            if (resolvedUrl.includes('format=drc')) {
                console.log('Downloading DRC file and decompressing to OBJ');
                
                // 下载DRC文件
                const drcResponse = await fetch(resolvedUrl);
                if (!drcResponse.ok) {
                    throw new Error('Failed to download DRC file');
                }
                
                const drcArrayBuffer = await drcResponse.arrayBuffer();
                
                // 前端解压DRC为OBJ
                const dracoLoader = new DRACOLoader();
                dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
                
                const geometry = await new Promise((resolve, reject) => {
                    dracoLoader.parse(drcArrayBuffer, resolve, reject);
                });
                
                // 转换为OBJ格式字符串
                const objString = geometryToObjString(geometry);
                
                // 创建OBJ文件并下载
                const blob = new Blob([objString], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `model_${id}.obj`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
            } else {
                // 直接下载OBJ文件
                console.log('Downloading OBJ file directly');
                const response = await fetch(resolvedUrl);
                if (!response.ok) {
                    throw new Error('Failed to download OBJ file');
                }
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `model_${id}.obj`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
            
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed, please try again');
        }
    };

    // 将Three.js几何体转换为OBJ格式字符串
    const geometryToObjString = (geometry) => {
        const vertices = geometry.attributes.position.array;
        const normals = geometry.attributes.normal ? geometry.attributes.normal.array : null;
        const indices = geometry.index ? geometry.index.array : null;
        
        let objString = '';
        
        // 写入顶点
        for (let i = 0; i < vertices.length; i += 3) {
            objString += `v ${vertices[i]} ${vertices[i + 1]} ${vertices[i + 2]}\n`;
        }
        
        // 写入法向量
        if (normals) {
            for (let i = 0; i < normals.length; i += 3) {
                objString += `vn ${normals[i]} ${normals[i + 1]} ${normals[i + 2]}\n`;
            }
        }
        
        // 写入面
        if (indices) {
            for (let i = 0; i < indices.length; i += 3) {
                const v1 = indices[i] + 1;
                const v2 = indices[i + 1] + 1;
                const v3 = indices[i + 2] + 1;
                if (normals) {
                    objString += `f ${v1}//${v1} ${v2}//${v2} ${v3}//${v3}\n`;
                } else {
                    objString += `f ${v1} ${v2} ${v3}\n`;
                }
            }
        }
        
        return objString;
    };

    // 设置页面标题
    React.useEffect(() => {
        document.title = '3D Mesh Viewer - MorphTesser';
    }, []);

    React.useEffect(() => {
        let isCancelled = false;
        async function resolve() {
            setLoading(true);
            setError(null);
            const preferred = searchParams.get('quality') === 'mc' ? 'mc' : 'refined';

            // 渲染逻辑：DRC → OBJ → SWC快速建模
            const dracoProxy = `/api/embed/mesh/${encodeURIComponent(id)}?quality=${preferred}&format=drc`;
            const objProxy = `/api/embed/mesh/${encodeURIComponent(id)}?quality=${preferred}&format=obj`;
            const swcProxy = `/api/embed/mesh/${encodeURIComponent(id)}?quality=${preferred}&format=swc`;
            
            try {
                // 步骤1: 尝试DRC文件
                const dracoResponse = await fetch(dracoProxy, { method: 'HEAD' });
                if (dracoResponse.ok) {
                    console.log('Found DRC file, using for rendering');
                    if (!isCancelled) setResolvedUrl(dracoProxy);
                    return;
                }
                
                // 步骤2: 尝试OBJ文件
                const objResponse = await fetch(objProxy, { method: 'HEAD' });
                if (objResponse.ok) {
                    console.log('Found OBJ file, using for rendering');
                    if (!isCancelled) setResolvedUrl(objProxy);
                    return;
                }
                
                // 步骤3: 使用SWC进行快速建模
                console.log('No DRC/OBJ found, attempting SWC quick modeling');
                const swcResponse = await fetch(swcProxy, { method: 'HEAD' });
                if (swcResponse.ok) {
                    console.log('Found SWC file, performing quick modeling');
                    // 调用快速建模API
                    const modelingResponse = await fetch(`/api/embed/mesh/${encodeURIComponent(id)}/quick-model`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ quality: preferred })
                    });
                    
                    if (modelingResponse.ok) {
                        const result = await modelingResponse.json();
                        if (result.objUrl && !isCancelled) {
                            setResolvedUrl(result.objUrl);
                            return;
                        }
                    }
                }
                
                // 如果所有方法都失败
                if (!isCancelled) {
                    setError('No model files found for this ID');
                }
                
            } catch (error) {
                console.error('Error resolving model:', error);
                if (!isCancelled) {
                    setError('Failed to load model');
                }
            }
            
        }
        resolve().finally(() => {
            if (!isCancelled) setLoading(false);
        });
        return () => { isCancelled = true; };
    }, [id, searchParams]);

    return (
        <Box sx={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: '#000',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            zIndex: 1000
        }}>
            {loading && (
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', zIndex: 10 }}>
                    <CircularProgress size={42} sx={{ color: '#bbb' }} />
                </Box>
            )}
            {error && (
                <Box sx={{ position: 'absolute', top: 24, left: 24, color: '#fff', zIndex: 10 }}>
                    <Typography variant="body2" color="error">{error}</Typography>
                </Box>
            )}
            
            {/* 顶部控制区域 - 无背景 */}
            {resolvedUrl && (
                <Box sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    left: 8, 
                    zIndex: 10, 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 2
                }}>
                    <Typography variant="body2" sx={{ color: 'white', fontSize: '0.8rem' }}>
                        ID: {id}
                    </Typography>
                    <Tooltip title={showWireframe ? "Switch to solid mode" : "Switch to wireframe mode"}>
                        <IconButton
                            onClick={toggleWireframe}
                            size="small"
                            sx={{
                                color: 'black',
                                backgroundColor: 'rgba(255,255,255,0.8)',
                                border: '1px solid rgba(0,0,0,0.3)',
                                width: 32,
                                height: 32,
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                },
                            }}
                        >
                            {showWireframe ? <GridOffIcon sx={{ fontSize: 16 }} /> : <GridOnIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            {/* Reset View 按钮 - 右上角 */}
            {resolvedUrl && (
                <Button
                    variant="outlined"
                    size="small"
                    sx={{ 
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'black',
                        borderColor: 'rgba(0,0,0,0.2)',
                        fontSize: '0.7rem',
                        py: 0.5,
                        px: 1.5,
                        border: '1px solid rgba(0,0,0,0.2)',
                        minWidth: 'auto',
                        height: 32,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        zIndex: 10,
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            borderColor: 'rgba(0,0,0,0.4)'
                        }
                    }}
                    onClick={handleResetView}
                >
                    Reset View
                </Button>
            )}

            {/* Download 按钮 - 右下角 */}
            {resolvedUrl && (
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    sx={{ 
                        position: 'absolute',
                        bottom: 16,
                        right: 16,
                        color: 'black',
                        borderColor: 'rgba(0,0,0,0.3)',
                        fontSize: '0.7rem',
                        py: 0.5,
                        px: 1.5,
                        border: '1px solid rgba(0,0,0,0.3)',
                        minWidth: 'auto',
                        height: 32,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        zIndex: 10,
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            borderColor: 'rgba(0,0,0,0.5)'
                        }
                    }}
                >
                    Download
                </Button>
            )}
            
            {/* 3D模型查看器 */}
            {resolvedUrl && (
                <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
                    <ModelViewer
                        ref={modelViewerRef}
                        width="100%"
                        height="100%"
                        objUrl={resolvedUrl.includes('format=obj') ? resolvedUrl : null}
                        dracoUrl={resolvedUrl.includes('format=drc') ? resolvedUrl : null}
                        swcUrl={swcUrl}
                        viewMode="obj"
                        wireframeMode={showWireframe}
                        backgroundColor={0x000000} // 黑色背景
                    />
                    
                    {/* Help icon in bottom left corner */}
                    <Tooltip 
                        title={
                            <Box sx={{ p: 1 }}>
                                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                                    View Controls:
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                                    • Mouse: Rotate view
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                                    • Scroll: Zoom in/out
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                                    • Right-click + drag: Pan view
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                                    • Double-click object: Focus on object
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                                    • Double-click empty: Reset view
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                                    • Shift + Left-click + drag: Move view
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                                    • Reset View: Return to initial position
                                </Typography>
                            </Box>
                        } 
                        arrow
                        placement="top"
                    >
                        <IconButton
                            sx={{
                                position: 'absolute',
                                bottom: 16,
                                left: 16,
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                color: 'white',
                                width: 40,
                                height: 40,
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                    transform: 'scale(1.1)'
                                },
                                transition: 'all 0.3s ease',
                                zIndex: 5
                            }}
                        >
                            <HelpOutlineIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}
        </Box>
    );
}

