import React, { useState } from 'react';

// 模型卡片组件
const ModelCard = ({ model }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {imageLoading && (
        <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      )}
      <CardMedia
        component="img"
        height="200"
        sx={{ display: imageLoading ? 'none' : 'block' }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/models/default-neuron.png';
          setImageError(true);
          setImageLoading(false);
        }}
        onLoad={() => setImageLoading(false)}
        image={model.imageUrl || `/models/${model.id}.png`}
        alt={model.name}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h5" component="h2">
          {model.name}
        </Typography>
        <Typography>
          {model.description}
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {model.formats.map(format => (
            <Chip key={format} label={format} size="small" color="primary" variant="outlined" />
          ))}
          {model.tags.map(tag => (
            <Chip key={tag} label={tag} size="small" />
          ))}
        </Box>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => window.open(`/models/${model.id}`, '_blank')}>
          Preview
        </Button>
        {model.formats.includes('SWC') && (
          <Button size="small" onClick={() => downloadFile(model.id, 'swc')}>
            Download SWC
          </Button>
        )}
        {model.formats.includes('OBJ') && (
          <Button size="small" onClick={() => downloadFile(model.id, 'obj')}>
            Download OBJ
          </Button>
        )}
      </CardActions>
      <Box sx={{ p: 2, pt: 0, textAlign: 'right' }}>
        <Typography variant="body2" color="text.secondary">
          Contributor: {model.contributor}
        </Typography>
      </Box>
    </Card>
  );
};

// 示例模型数据
const publicModels = [
  {
    id: 1,
    name: 'Standard Sphere Reference Model',
    description: 'A standard sphere model for testing and calibration, with a radius of 1.0 units',
    imageUrl: '/models/sphere.png', // 指定图片URL
    formats: ['SWC', 'OBJ'],
    tags: ['General', 'Reference Model'],
    contributor: 'Liu Sihu'
  },
  {
    id: 2,
    name: 'Mouse Pyramidal Cell',
    description: 'A pyramidal neuron from the mouse somatosensory cortex',
    imageUrl: '/models/mouse-pyramidal.png',
    formats: ['SWC', 'OBJ'],
    tags: ['Mouse', 'Cortex'],
    contributor: 'Zhang San'
  },
  {
    id: 3,
    name: 'Rat CA1 Pyramidal Cell',
    description: 'A reconstructed pyramidal neuron from the rat CA1 region',
    imageUrl: '/models/rat-ca1.png',
    formats: ['OBJ'],
    tags: ['Rat', 'Hippocampus'],
    contributor: 'Li Si'
  }
]; 