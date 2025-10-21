import React from 'react';
import { Box, Container, Typography, Card, CardContent, Grid, Button, AppBar, Toolbar, Tooltip } from '@mui/material';
// (imports moved below)
import { useNavigate } from 'react-router-dom';
import BuildIcon from '@mui/icons-material/Build';
import StorageIcon from '@mui/icons-material/Storage';
import ExtensionIcon from '@mui/icons-material/Extension';
import NeuronAnimation from '../components/NeuronAnimation';
import BeforeModelingImage from '../assets/images/before_modeling_new.png';
import AfterModelingImage from '../assets/images/after_modeling_new.png';

const NeuroMorphoPlugin = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      position: 'relative',
      pt: '84px',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        zIndex: 1
      }
    }}>
      {/* Navigation Bar (same as Home) */}
      <AppBar position="static" sx={{ 
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(0, 0, 0, 0.6) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        zIndex: 100,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        margin: 0,
        padding: 0
      }}>
        <Toolbar sx={{ minHeight: '64px', px: { xs: 2, sm: 3 }, justifyContent: 'space-between' }}>
          {/* Left MorphTesser Logo */}
          <Tooltip title="MorphTesser - 3D Neuron Modeling Platform" arrow>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexGrow: { xs: 1, sm: 0 }, 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }} onClick={() => navigate('/')} role="button" aria-label="Go Home">
              <img 
                src="/assets/images/logo_M.png" 
                alt="MorphTesser Logo" 
                style={{ height: '40px', width: 'auto', filter: 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.1))' }}
              />
            </Box>
          </Tooltip>
          {/* Right Navigation Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Create and customize 3D neuron models with our online modeling tools" arrow>
              <Button
                color="inherit"
                startIcon={<BuildIcon />}
                onClick={() => navigate('/online-builder')}
                sx={{ 
                  color: 'white',
                  position: 'relative',
                  zIndex: 101,
                  pointerEvents: 'auto',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minWidth: { xs: 'auto', sm: 'auto' },
                  px: { xs: 1.5, sm: 2.5 },
                  py: { xs: 1, sm: 1.5 },
                  borderRadius: '8px',
                  fontWeight: 500,
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)'
                  },
                  '&:active': {
                    transform: 'translateY(0px)'
                  }
                }}
              >
                Online Modeling
              </Button>
            </Tooltip>
            <Tooltip title="Browse and download 3D neuron models from our public database" arrow>
              <Button
                color="inherit"
                startIcon={<StorageIcon />}
                onClick={() => navigate('/public-database')}
                sx={{ 
                  color: 'white',
                  position: 'relative',
                  zIndex: 101,
                  pointerEvents: 'auto',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minWidth: { xs: 'auto', sm: 'auto' },
                  px: { xs: 1.5, sm: 2.5 },
                  py: { xs: 1, sm: 1.5 },
                  borderRadius: '8px',
                  fontWeight: 500,
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)'
                  },
                  '&:active': {
                    transform: 'translateY(0px)'
                  }
                }}
              >
                Data Repository
              </Button>
            </Tooltip>
            <Tooltip title="Learn about our NeuroMorpho.Org browser extension for seamless 3D model integration" arrow>
              <Button
                color="inherit"
                startIcon={<ExtensionIcon />}
                onClick={() => navigate('/neuromorpho-plugin')}
                sx={{ 
                  color: 'white',
                  position: 'relative',
                  zIndex: 101,
                  pointerEvents: 'auto',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minWidth: { xs: 'auto', sm: 'auto' },
                  px: { xs: 1.5, sm: 2.5 },
                  py: { xs: 1, sm: 1.5 },
                  borderRadius: '8px',
                  fontWeight: 500,
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)'
                  },
                  '&:active': {
                    transform: 'translateY(0px)'
                  }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  NeuroMorpho.Org Plugin
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Plugin
                </Box>
              </Button>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* No back button on plugin page; top nav is consistent with Home */}

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
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          background: `url('/assets/images/neuron-bg.png') center center/cover no-repeat`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom
            sx={{
              color: 'white',
              fontWeight: 700,
              textShadow: '0 0 10px rgba(62, 118, 244, 0.8), 0 0 20px rgba(62, 118, 244, 0.5)',
              fontFamily: '"Orbitron", "Arial Black", "Arial", sans-serif',
              letterSpacing: '0.02em',
              marginBottom: { xs: 1.5, sm: 2, md: 2.5 },
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem', lg: '3rem', xl: '3.5rem' },
              textAlign: 'center',
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
            variant="h6" 
            gutterBottom
            sx={{
              color: 'white',
              opacity: 0.8,
              fontWeight: 300,
              letterSpacing: '0.05em',
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              marginBottom: 4,
              fontSize: { xs: '1rem', sm: '1.2rem', md: '1.3rem' },
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              maxWidth: { xs: '100%', sm: '80%', md: '70%' },
              mx: 'auto'
            }}
          >
            Seamless integration with NeuroMorpho.Org database for enhanced neuron analysis
          </Typography>
        </Box>

        {/* Content Cards */}
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Card sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'white', mb: 3 }}>
                  What We've Accomplished with NeuroMorpho.Org Data
                </Typography>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h3" sx={{ color: 'rgba(62, 118, 244, 0.9)', fontWeight: 'bold', mb: 2, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                    270k+ Neuron Models
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 3 }}>
                    Based on NeuroMorpho.Org's SWC data, we have successfully modeled over 270,000 high-quality neuron 3D models,
                    covering multiple species and brain regions, providing powerful data support for neuroscience research.
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'rgba(62, 118, 244, 0.9)', fontWeight: 'bold', mb: 2, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                    3D Neuron Plugin Powered by MorphTesser
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    We developed a dedicated plugin for the NeuroMorpho.Org website, allowing users to directly experience
                    our 3D modeling technology on the NeuroMorpho.Org website, obtaining high-quality neuron 3D models without leaving the original site.
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
                  Plugin Installation and Usage Steps
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Step 1: Install Tampermonkey
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                        Install the Tampermonkey extension in your browser
                      </Typography>
                      <Tooltip title="Install Tampermonkey browser extension to enable user scripts" arrow>
                        <Button
                          variant="outlined"
                          size="small"
                          href="https://www.tampermonkey.net/"
                          target="_blank"
                          sx={{
                            color: 'white',
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                            '&:hover': {
                              borderColor: 'white',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                        >
                          Visit Tampermonkey
                        </Button>
                      </Tooltip>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Step 2: Copy Script
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                        Copy our provided script code into the Tampermonkey extension
                      </Typography>
                      <Tooltip title="Copy the Tampermonkey script code to your clipboard for installation" arrow>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            const script = `// ==UserScript==
// @name         NeuroMorpho: Insert "3D Mesh - MorphTesser" Button (above Java legacy)
// @namespace    https://neuromorpho.org/
// @version      1.1.2
// @description  Parse NMO_#### ID from page and insert a "3D Mesh - MorphTesser" button above "3D Cell Viewer - Java, legacy"
// @match        https://neuromorpho.org/neuron_info.jsp*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const BTN_ID = 'morphtesser_button_injected';
  const EMBED_BASE = 'http://10.3.2.217:3000/embed/mesh/';

  if (document.getElementById(BTN_ID)) return;

  /**
   * Extract numeric ID from "NeuroMorpho.Org ID : NMO_34773"
   * Returns "34773" if found, otherwise null
   */
  function extractNeuronNumericId() {
    const table = document.getElementById('NeuronInfotable12');
    const rx = /NMO[_\\s-]?(\\d+)/i;

    if (table) {
      const tds = table.querySelectorAll('td');
      for (let i = 0; i < tds.length; i++) {
        const label = (tds[i].textContent || '').trim();
        if (/NeuroMorpho\\.Org ID/i.test(label)) {
          const valTd = tds[i + 1];
          const valText = (valTd && valTd.textContent) ? valTd.textContent.trim() : '';
          const m = valText.match(rx);
          if (m) return m[1];
        }
      }
    }
    // Fallback: search whole page text
    const m2 = document.body.textContent.match(rx);
    return m2 ? m2[1] : null;
  }

  /** Create the new button */
  function createButton() {
    const btn = document.createElement('a');
    btn.id = BTN_ID;
    btn.href = 'javascript:void(0);';
    btn.textContent = '3D Mesh Viewer - MorphTesser';
    btn.style.cursor = 'pointer';

    btn.addEventListener('click', () => {
      const id = extractNeuronNumericId();
      if (!id) {
        alert('Could not parse NeuroMorpho.Org ID (expected format NMO_####).');
        return;
      }
      const url = EMBED_BASE + String(id);
      window.open(
        url,
        '_blank',
        'left=40,top=40,width=980,height=740,toolbar=0,resizable=1,noopener'
      );
    });

    return btn;
  }

  /**
   * Insert button directly above
   * "3D Cell Viewer - Java, legacy"
   */
  function injectAboveJavaLegacy() {
    // Target anchor: "Java, legacy" button
    let legacyA = document.getElementById('download_button');

    // Fallback: match by text
    if (!legacyA) {
      legacyA = Array.from(document.querySelectorAll('#main-copy a'))
        .find(a => /3D\\s*Cell\\s*Viewer\\s*-\\s*Java,\\s*legacy/i.test(a.textContent || ''));
    }
    if (!legacyA) return false;

    const btn = createButton();

    // Insert button right before legacy button
    legacyA.parentNode.insertBefore(btn, legacyA);

    // Add <br> before legacy button to preserve layout
    legacyA.parentNode.insertBefore(document.createElement('br'), legacyA);

    return true;
  }

  // Try immediately; if not found (dynamic page), watch briefly
  if (!injectAboveJavaLegacy()) {
    const observer = new MutationObserver(() => {
      if (injectAboveJavaLegacy()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 5000);
  }
})();`;
                            navigator.clipboard.writeText(script).then(() => {
                              alert('Script copied to clipboard! Please open Tampermonkey extension, click "Add new script", paste the code and save.');
                            }).catch(() => {
                              // If clipboard API fails, display script content
                              const newWindow = window.open('', '_blank');
                              newWindow.document.write(`<pre style="font-family: monospace; white-space: pre-wrap; padding: 20px;">${script}</pre>`);
                              newWindow.document.title = 'NeuroMorpho Plugin Script';
                            });
                          }}
                          sx={{
                            color: 'white',
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                            '&:hover': {
                              borderColor: 'white',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                        >
                          Get Script
                        </Button>
                      </Tooltip>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Step 3: Refresh and Use
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                        Refresh the NeuroMorpho.Org website to see our modeling button
                      </Typography>
                      <Tooltip title="Open NeuroMorpho.Org website to test the plugin functionality" arrow>
                        <Button
                          variant="outlined"
                          size="small"
                          href="https://neuromorpho.org/"
                          target="_blank"
                          sx={{
                            color: 'white',
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                            '&:hover': {
                              borderColor: 'white',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                        >
                          Visit NeuroMorpho.Org
                        </Button>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>
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
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                    <Typography variant="h4" component="span" gutterBottom sx={{ color: 'white', mb: 0, display: 'inline' }}>
                      Usage Demo
                    </Typography>
                    <a
                      href="https://neuromorpho.org/neuron_info.jsp?neuron_name=FC_5xFAD_6mpos_F_Animal02_Trace053"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ position: 'absolute', left: '100%', marginLeft: '8px', color: '#87CEEB', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                    >
                      (🔗 NMO_198924 ↗)
                    </a>
                  </Box>
                </Box>
                
                {/* SWC Before/After Comparison */}
                <Box sx={{ mb: 4 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 2 }}>
                          Traditional SWC Skeleton Structure
                        </Typography>
                        <Box sx={{
                          height: 400,
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <img 
                            src={BeforeModelingImage} 
                            alt="SWC Skeleton Structure"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              filter: 'brightness(1.2) contrast(1.1)'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)'
                          }}>
                            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              Wireframe Skeleton Structure
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 2 }}>
                          High-Quality Mesh Model
                        </Typography>
                        <Box sx={{
                          height: 400,
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <img 
                            src={AfterModelingImage} 
                            alt="3D Neuron Mesh Model"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              filter: 'brightness(1.2) contrast(1.1)'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)'
                          }}>
                            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              Volumetric 3D Neuron Model
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Video Demonstration */}
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>
                    Video Demonstration
                  </Typography>
                  <Box sx={{
                    height: 600,
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}>
                    <video
                      controls
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      poster="/assets/images/video_poster.png"
                    >
                      <source src="/assets/images/Plugin.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </Box>
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
