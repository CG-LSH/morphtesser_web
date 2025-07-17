import React from 'react';
import { Card, CardContent, CardActions, Typography, Button, CardMedia, Box, Chip, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import DownloadIcon from '@mui/icons-material/Download';
import SwcLinePreview from './SwcLinePreview';

function downloadFile(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename || url.split('/').pop());
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadFileByFetch(url, filename) {
  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || url.split('/').pop();
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
        {model.swcUrl && <SwcLinePreview swcUrl={model.swcUrl} height={120} />}
        {/* 删除3D图标和文字部分 */}
      </Box>
      {/* 中部名称描述 */}
      <CardContent sx={{ flexGrow: 1, textAlign: 'center', py: 2, background: 'transparent !important' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>{model.name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{model.description || <i>No description</i>}</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mb: 1 }}>
          {model.swcUrl && <Chip label="SWC" color="primary" size="small" />}
          {model.objUrl && <Chip label="OBJ" color="error" size="small" />}
          {model.species && <Chip label={model.species} color="default" size="small" />}
          {model.brainRegion && <Chip label={model.brainRegion} color="default" size="small" />}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Contributor: {model.username || <i>Unknown</i>}
        </Typography>
      </CardContent>
      {/* 底部按钮区 */}
      <CardActions sx={{ justifyContent: 'center', borderTop: '1px solid #f0f0f0', py: 1 }}>
        <Button size="small" onClick={() => onPreview(model)} startIcon={<ThreeDRotationIcon />}>Preview</Button>
        {model.swcUrl && <Button size="small" startIcon={<DownloadIcon />} onClick={() => downloadFileByFetch(model.swcUrl, model.name + '.swc')}>SWC</Button>}
        {model.objUrl && <Button size="small" startIcon={<DownloadIcon />} onClick={() => downloadFileByFetch(model.objUrl, model.name + '.obj')}>OBJ</Button>}
      </CardActions>
    </Card>
  );
};

export default ModelCard; 