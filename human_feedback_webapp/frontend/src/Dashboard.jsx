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
import { Link } from 'react-router-dom';

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
      const response = await axios.get('/channels');
      setChannels(response.data);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await axios.get('/videos');
      setVideos(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  // Handle form submission for adding a new YouTube channel
  const handleAddChannel = async (e) => {
    e.preventDefault();
    try {
      // Extract channel ID from the provided URL
      const channelId = extractChannelId(newChannelUrl);

      // Make POST request to backend API to create new channel
      await axios.post('/channels', {
        id: channelId,
        name: `Channel ${channelId}`,  // TODO: Call YouTube API to get channel name & description
        url: newChannelUrl
      });
      
      // Reset form and refresh channel list
      setNewChannelUrl('');
      fetchChannels();
    } catch (error) {
      console.error('Error adding channel:', error);
    }
  };

  // Extract channel ID from different YouTube URL formats
  const extractChannelId = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'www.youtube.com') {
        // Handle /@[name] format
        if (urlObj.pathname.startsWith('/@')) {
          return urlObj.pathname.substring(2).split('/')[0];
        }
      }
      throw new Error('Invalid YouTube channel URL');
    } catch (error) {
      throw new Error('Please enter a valid YouTube channel URL');
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