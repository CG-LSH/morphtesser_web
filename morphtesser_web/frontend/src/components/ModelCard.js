import React from 'react';
import { Card, CardContent, CardActions, Typography, Button, CardMedia, Box, Chip, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import DownloadIcon from '@mui/icons-material/Download';
import SwcLinePreview from './SwcLinePreview';
import { resolveApiUrl } from '../utils/api';

function downloadFile(url, filename) {
  const a = document.createElement('a');
  const resolvedUrl = resolveApiUrl(url);
  a.href = resolvedUrl;
  const defaultName = resolvedUrl.split('/').pop();
  a.setAttribute('download', filename || defaultName);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadFileByFetch(url, filename) {
  const resolvedUrl = resolveApiUrl(url);
  fetch(resolvedUrl)
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const defaultName = resolvedUrl.split('/').pop();
      a.download = filename || defaultName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    });
}

const ModelCard = ({ model, onPreview }) => {
  return (
    <Card sx={{ height: 380, display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: 3, backgroundColor: 'rgba(255,255,255,0.97)', overflow: 'hidden' }}>
      {/* 顶部3D区 */}
      <Box sx={{ py: 2, textAlign: 'center', borderBottom: '1px solid #f0f0f0', background: 'linear-gradient(180deg,#f7fafd 60%,#fff 100%)' }}>
        {model.swcUrl && <SwcLinePreview swcUrl={resolveApiUrl(model.swcUrl)} height={180} />}
        {/* 删除3D图标和文字部分 */}
      </Box>
      {/* 中部名称描述 */}
      <CardContent sx={{ flexGrow: 1, textAlign: 'center', py: 2, background: 'transparent !important' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>{model.name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{model.description || <i>No description</i>}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Contributor: {model.username || <i>Unknown</i>}
        </Typography>
      </CardContent>
      {/* 底部按钮区 */}
      <CardActions sx={{ justifyContent: 'center', borderTop: '1px solid #f0f0f0', py: 1 }}>
        <Button size="small" onClick={() => onPreview(model)} startIcon={<ThreeDRotationIcon />}>Preview</Button>
        {model.swcUrl && <Button size="small" startIcon={<DownloadIcon />} onClick={() => downloadFileByFetch(model.swcUrl, model.name + '.swc')} disabled={false}>SWC</Button>}
        {model.objUrl && <Button size="small" startIcon={<DownloadIcon />} onClick={() => downloadFileByFetch(model.objUrl, model.name + '.obj')} disabled={false}>OBJ</Button>}
      </CardActions>
    </Card>
  );
};

export default ModelCard; 