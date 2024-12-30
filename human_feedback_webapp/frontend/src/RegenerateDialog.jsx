import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Typography, Box, Paper, TextField, Alert, CircularProgress, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from './Dashboard';

const RegenerateDialog = ({ highlight, onClose, onRegenerate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [systemRole, setSystemRole] = useState(highlight.system_role);
  const [newContent, setNewContent] = useState(null);

  const handleRegenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/highlights/${highlight.id}/regenerate`,
        systemRole,
        {
          headers: {
            'Content-Type': 'text/plain'
          }
        }
      );
      
      setNewContent(response.data.content);
      
    } catch (err) {
      console.error('Regeneration error:', err.response?.data || err);
      const errorMessage = err.response?.data?.detail?.error || 
                          (Array.isArray(err.response?.data?.detail) ? err.response?.data?.detail[0]?.msg : err.message);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyNewVersion = () => {
    onRegenerate({
      ...highlight,
      content: newContent,
      system_role: systemRole
    });
    onClose();
  };

  const handleCopyHighlight = () => {
    const highlightData = {
      SystemRole: highlight.system_role,
      Prompt: highlight.prompt,
      Result: highlight.content
    };
    
    navigator.clipboard.writeText(JSON.stringify(highlightData, null, 2))
      .catch(err => console.error('Failed to copy:', err));
  };

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="copy-btn"
            onClick={handleCopyHighlight}
          >
            Copy Highlight
          </button>
          <Typography variant="h6" component="span">
            Regenerate Highlight
          </Typography>
          <IconButton onClick={onClose} sx={{ ml: 1 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={2}>
          {/* Left side - Original */}
          <Grid item xs={6}>
            <Typography variant="h6">Original</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">System Role:</Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
                <Box sx={{ whiteSpace: 'pre-wrap' }}>
                  {highlight.system_role}
                </Box>
              </Paper>
              
              <Typography variant="subtitle2">Content:</Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Box sx={{ whiteSpace: 'pre-wrap' }}>
                  {highlight.content}
                </Box>
              </Paper>

              <Typography variant="subtitle2">Prompt:</Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
                <Box sx={{ whiteSpace: 'pre-wrap' }}>
                  {highlight.prompt}
                </Box>
              </Paper>
            </Box>
          </Grid>

          {/* Right side - New Version */}
          <Grid item xs={6}>
            <Typography variant="h6">New Version</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">System Role:</Typography>
              <TextField
                fullWidth
                multiline
                rows={15}
                value={systemRole}
                onChange={(e) => setSystemRole(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              {newContent && (
                <>
                  <Typography variant="subtitle2">Generated Content:</Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                    <Box sx={{ whiteSpace: 'pre-wrap' }}>
                      {newContent}
                    </Box>
                  </Paper>
                </>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {newContent ? (
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleApplyNewVersion}
          >
            Apply New Version
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleRegenerate}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Generate New Version
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RegenerateDialog; 