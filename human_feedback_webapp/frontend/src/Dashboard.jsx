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

const API_BASE_URL = 'http://localhost:8000'; // Adjust port if your FastAPI backend uses a different one

const Dashboard = () => {
  // State for storing the list of YouTube channels from the backend
  const [channels, setChannels] = useState([]);
  // State for the input field where users enter new channel URLs
  const [newChannelUrl, setNewChannelUrl] = useState('');
  // State for storing the list of videos across all channels
  const [videos, setVideos] = useState([]);

  // Fetch initial data when component mounts
  useEffect(() => {
    // Get list of channels from /channels endpoint
    fetchChannels();
    // Get list of videos from /videos endpoint 
    fetchVideos();
  }, []); // Empty dependency array means this only runs once on initial load

  const fetchChannels = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/channels`);
      setChannels(response.data);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/videos`);
      console.log('Fetched Videos response:', response.data);
      setVideos(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  // Handle form submission for adding a new YouTube channel
  const handleAddChannel = async (e) => {
    // Prevent the default form submission behavior that would refresh the page
    e.preventDefault();
    try {
      // Extract channel handle from URL
      const channelHandle = extractChannelIdentifier(newChannelUrl);

      // Updated API call with base URL
      await axios.post(`${API_BASE_URL}/add_channel`, null, {
        params: { channel_handle: channelHandle }
      });

      // Reset form and refresh channel list
      setNewChannelUrl('');
      fetchChannels();

    } catch (error) {
      console.error('Error adding channel:', error);
    }
  };

  /**
   * Extracts the channel identifier from a YouTube channel URL
   * 
   * @param {string} url - YouTube channel URL (e.g. "https://www.youtube.com/@Bankless" or "https://www.youtube.com/@Bankless/videos")
   * @returns {string} Channel identifier (e.g. "@Bankless")
   * @throws {Error} If URL is invalid or not a YouTube channel URL
   */
  const extractChannelIdentifier = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'www.youtube.com') {
        // Handle /@[name] format
        if (urlObj.pathname.startsWith('/@')) {
          return urlObj.pathname.split('/')[1]; 
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
                  sx={{ display: 'flex', gap: 2 }}
                >
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title}
                    style={{
                      width: '120px',
                      height: '67px',
                      objectFit: 'cover',
                      borderRadius: '4px'
                    }}
                  />
                  <ListItemText
                    primary={video.title}
                    secondary={
                      <>
                        <Typography component="span" display="block">
                          {`Channel: ${video.channel_id || 'Unknown'} • Duration: ${formatDuration(video.duration)}`}
                        </Typography>
                        <Typography component="span" display="block">
                          {`${video.processed_highlights} / ${video.total_highlights} highlights reviewed`}
                        </Typography>
                      </>
                    }
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

// Helper function to format duration in seconds to HH:MM:SS
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

export default Dashboard;