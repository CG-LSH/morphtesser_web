import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import ModelViewer from '../components/ModelViewer';

// 轻量嵌入式页面：通过 /embed/mesh/:id 渲染 OBJ Mesh
// 规则：从本地文件夹 Z:\lsh\morphtesser_exp\DataSet\guest 下随机选择一个 OBJ 文件
// 支持通过 ?quality=mc 强制使用 data_mc.obj，否则使用 data_refined.obj

export default function EmbedMesh() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [resolvedUrl, setResolvedUrl] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    // 关闭弹窗
    const handleClose = () => {
        navigate(-1); // 返回上一页
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

            // 通过后端代理读取本地文件
            const proxy = `/api/embed/mesh/${encodeURIComponent(id)}?quality=${preferred}`;
            if (!isCancelled) setResolvedUrl(proxy);
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
                    <Typography variant="body2" sx={{ color: 'black', fontSize: '0.8rem' }}>
                        ID: {id}
                    </Typography>
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
                            下载
                        </Button>
                        <IconButton 
                            size="small" 
                            onClick={handleClose}
                            sx={{ 
                                color: 'black',
                                p: 0.5,
                                '&:hover': {
                                    backgroundColor: 'rgba(0,0,0,0.1)'
                                }
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            )}
            
            {/* 3D模型查看器 */}
            {resolvedUrl && (
                <Box sx={{ height: '100%', width: '100%' }}>
                    <ModelViewer
                        ref={null}
                        width="100%"
                        height="100%"
                        objUrl={resolvedUrl}
                        swcUrl={null}
                        viewMode="obj"
                        backgroundColor={0xffffff} // 白色背景，与在线建模保持一致
                    />
                </Box>
            )}
        </Box>
    );
}

