import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import DownloadIcon from '@mui/icons-material/Download';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import ModelViewer from '../components/ModelViewer';

// 轻量嵌入式页面：通过 /embed/mesh/:id 渲染 OBJ Mesh
// 规则：从本地文件夹 X:\morphtesser_exp\neuromorpho_08\results 下根据ID查找对应的 OBJ 文件
// 支持通过 ?quality=mc 强制使用 data_mc.obj，否则使用 data_refined.obj
// 查找路径：X:\morphtesser_exp\neuromorpho_08\results\{前三位}\{id}.swc\data_{quality}.obj

export default function EmbedMesh() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const [resolvedUrl, setResolvedUrl] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [showWireframe, setShowWireframe] = React.useState(false);
    const modelViewerRef = React.useRef(null);

    // 切换线框模式
    const toggleWireframe = () => {
        setShowWireframe(!showWireframe);
    };

    // 下载当前OBJ文件
    const handleDownload = async () => {
        if (!resolvedUrl) return;
        
        try {
            const response = await fetch(resolvedUrl);
            if (!response.ok) {
                throw new Error('下载失败');
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
        } catch (error) {
            console.error('下载失败:', error);
            alert('下载失败，请重试');
        }
    };

    React.useEffect(() => {
        let isCancelled = false;
        async function resolve() {
            setLoading(true);
            setError(null);
            const preferred = searchParams.get('quality') === 'mc' ? 'mc' : 'refined';

            // 优先尝试DRC文件，找不到时使用OBJ文件
            const dracoProxy = `/api/embed/mesh/${encodeURIComponent(id)}?quality=${preferred}&format=drc`;
            const objProxy = `/api/embed/mesh/${encodeURIComponent(id)}?quality=${preferred}&format=obj`;
            
            try {
                // 先尝试DRC文件
                const dracoResponse = await fetch(dracoProxy, { method: 'HEAD' });
                if (dracoResponse.ok) {
                    if (!isCancelled) setResolvedUrl(dracoProxy);
                    return;
                }
            } catch (error) {
                console.log('DRC文件不存在，尝试OBJ文件');
            }
            
            // DRC文件不存在，使用OBJ文件
            if (!isCancelled) setResolvedUrl(objProxy);
        }
        resolve().finally(() => {
            if (!isCancelled) setLoading(false);
        });
        return () => { isCancelled = true; };
    }, [id, searchParams]);

    return (
        <Box sx={{ 
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100vw',
            height: '100vh',
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
            
            {/* 顶部控制区域 - 小弹窗样式 */}
            {resolvedUrl && (
                <Box sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    left: 8, 
                    right: 8, 
                    zIndex: 10, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    borderRadius: 1,
                    px: 2,
                    py: 1
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: 'black', fontSize: '0.8rem' }}>
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
                                {showWireframe ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownload}
                            sx={{ 
                                color: 'black',
                                borderColor: 'rgba(0,0,0,0.3)',
                                fontSize: '0.7rem',
                                py: 0.5,
                                px: 1.5,
                                border: '1px solid rgba(0,0,0,0.3)',
                                minWidth: 'auto',
                                height: 32,
                                backgroundColor: 'rgba(255,255,255,0.8)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                    borderColor: 'rgba(0,0,0,0.5)'
                                }
                            }}
                        >
                            Download
                        </Button>

                    </Box>
                </Box>
            )}
            
            {/* 3D模型查看器 */}
            {resolvedUrl && (
                <Box sx={{ height: '100%', width: '100%' }}>
                    <ModelViewer
                        ref={modelViewerRef}
                        width="100%"
                        height="100%"
                        objUrl={resolvedUrl.includes('format=obj') ? resolvedUrl : null}
                        dracoUrl={resolvedUrl.includes('format=drc') ? resolvedUrl : null}
                        swcUrl={null}
                        viewMode="obj"
                        wireframeMode={showWireframe}
                        backgroundColor={0xffffff} // 白色背景
                    />
                </Box>
            )}
        </Box>
    );
}

