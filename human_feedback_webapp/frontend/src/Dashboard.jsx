/**
 * Dashboard Component
 * 
 * Primary interface for channel management and video queue monitoring.
 * Features:
 * - Add/remove YouTube channels
 * - View channel processing status
 * - Access video review queue
 * - Monitor highlight generation progress
 * 
 * Communicates with backend API endpoints for data operations.
 */

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField
} from '@mui/material';
import axios from 'axios';

const Dashboard = () => {
  const [channels, setChannels] = useState([]);
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetchChannels();
    fetchVideos();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await axios.get('/api/channels');
      setChannels(response.data);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await axios.get('/api/videos');
      setVideos(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handleAddChannel = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/channels', { url: newChannelUrl });
      setNewChannelUrl('');
      fetchChannels();
    } catch (error) {
      console.error('Error adding channel:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Channel Management Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Channel Management
            </Typography>
            <form onSubmit={handleAddChannel}>
              <TextField
                fullWidth
                label="YouTube Channel URL"
                value={newChannelUrl}
                onChange={(e) => setNewChannelUrl(e.target.value)}
                margin="normal"
              />
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
              >
                Add Channel
              </Button>
            </form>
            <List>
              {channels.map((channel) => (
                <ListItem key={channel.id}>
                  <ListItemText 
                    primary={channel.name}
                    secondary={channel.url}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Video Queue Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Video Queue
            </Typography>
            <List>
              {videos.map((video) => (
                <ListItem 
                  key={video.id}
                  button
                  component={Link}
                  to={`/review/${video.id}`}
                >
                  <ListItemText 
                    primary={video.title}
                    secondary={`${video.processed_highlights} / ${video.total_highlights} highlights reviewed`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;