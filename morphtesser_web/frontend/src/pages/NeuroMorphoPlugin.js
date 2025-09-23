import React from 'react';
import { Box, Container, Typography, Card, CardContent, Grid, Button, AppBar, Toolbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BuildIcon from '@mui/icons-material/Build';
import StorageIcon from '@mui/icons-material/Storage';
import ExtensionIcon from '@mui/icons-material/Extension';
import NeuronAnimation from '../components/NeuronAnimation';

const NeuroMorphoPlugin = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: 1
      }
    }}>
      {/* Navigation Bar */}
      <AppBar position="static" sx={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Toolbar>
          {/* Left MorphTesser Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Typography 
              variant="h5" 
              component="div" 
              sx={{ 
                color: 'white',
                fontWeight: 'bold',
                fontFamily: '"Orbitron", "Roboto", sans-serif',
                background: 'linear-gradient(45deg, #9c27b0, #3f51b5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              MorphTesser
            </Typography>
          </Box>
          
          {/* Right Navigation Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              color="inherit"
              startIcon={<BuildIcon />}
              onClick={() => navigate('/online-builder')}
              sx={{ 
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Online Modeling
            </Button>
            <Button
              color="inherit"
              startIcon={<StorageIcon />}
              onClick={() => navigate('/public-database')}
              sx={{ 
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Data Repository
            </Button>
            <Button
              color="inherit"
              startIcon={<ExtensionIcon />}
              onClick={() => navigate('/neuromorpho-plugin')}
              sx={{ 
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              NeuroMorpho.Org Plugin
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Full Page Line Animation */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2,
          opacity: 0.3,
          overflow: 'hidden',
          pointerEvents: 'none'
        }}
      >
        <NeuronAnimation />
      </Box>

      {/* Full Page Background Image */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 0,
          background: `url('/assets/images/neuron-bg.png') center center/cover no-repeat`,
          opacity: 0.4,
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 3, py: 8 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom
            sx={{
              color: 'white',
              fontWeight: 700,
              textShadow: '0 0 10px rgba(62, 118, 244, 0.8), 0 0 20px rgba(62, 118, 244, 0.5)',
              fontFamily: '"Orbitron", "Roboto", sans-serif',
              letterSpacing: '0.02em',
              marginBottom: 3,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(62, 118, 244, 0.8), transparent)'
              }
            }}
          >
            NeuroMorpho.Org Plugin
          </Typography>
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{
              color: 'white',
              opacity: 0.8,
              fontWeight: 300,
              letterSpacing: '0.05em',
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              marginBottom: 4,
              fontSize: '1.3rem',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}
          >
            Seamless integration with NeuroMorpho.Org database for enhanced neuron analysis
          </Typography>
        </Box>

        {/* Content Cards */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'white', mb: 3 }}>
                  What is NeuroMorpho.Org?
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 3 }}>
                  NeuroMorpho.Org is the largest publicly accessible collection of digitally reconstructed neurons. 
                  It contains over 100,000 neuron reconstructions from various species and brain regions, 
                  providing researchers with invaluable data for morphological analysis.
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Our plugin seamlessly integrates with this vast database, allowing you to access, 
                  analyze, and visualize neuron data directly within MorphTesser's powerful modeling environment.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'white', mb: 3 }}>
                  Key Features
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                    • Direct Database Access
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', ml: 2 }}>
                    Browse and search NeuroMorpho.Org's extensive neuron database
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                    • Advanced Filtering
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', ml: 2 }}>
                    Filter neurons by species, brain region, and morphological parameters
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                    • 3D Visualization
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', ml: 2 }}>
                    Interactive 3D rendering and analysis of neuron structures
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                    • Export & Analysis
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', ml: 2 }}>
                    Export data in multiple formats and perform comparative analysis
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'white', mb: 3 }}>
                  How to Use
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Step 1: Access
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Navigate to the Data Repository and select "NeuroMorpho.Org" tab
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Step 2: Search
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Use filters to find neurons by species, region, or other criteria
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Step 3: Analyze
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Visualize in 3D, download data, or perform morphological analysis
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/public-database')}
                    sx={{
                      backgroundColor: 'rgba(62, 118, 244, 0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(62, 118, 244, 1)'
                      }
                    }}
                  >
                    Try NeuroMorpho.Org Plugin
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default NeuroMorphoPlugin;
