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
  TextField,
  Box,
  Collapse
} from '@mui/material';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import YouTubeIcon from '@mui/icons-material/YouTube';

const API_BASE_URL = 'http://localhost:8000'; // Adjust port if your FastAPI backend uses a different one

// Add styled components
const DashboardContainer = styled(Container)(({ theme }) => ({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: theme.spacing(3),
}));

const ChannelSection = styled(Paper)(({ theme }) => ({
  borderRadius: '16px',
  overflow: 'hidden',
  marginBottom: theme.spacing(3),
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[3],
  },
}));

const VideoCard = styled(ListItem)(({ theme }) => ({
  borderRadius: '12px',
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[2],
  },
}));

const Dashboard = () => {
  // State for storing the list of YouTube channels from the backend
  const [channels, setChannels] = useState([]);
  // State for the input field where users enter new channel URLs
  const [newChannelUrl, setNewChannelUrl] = useState('');
  // State for storing the list of videos across all channels
  const [videos, setVideos] = useState([]);
  const [showChannels, setShowChannels] = useState(false);
  // Add new state for loading
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);

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
    e.preventDefault();
    setIsAddingChannel(true);
    try {
      // Extract channel handle from URL
      const channelHandle = extractChannelIdentifier(newChannelUrl);

      // Updated API call with base URL
      await axios.post(`${API_BASE_URL}/add_channel`, null, {
        params: { channel_handle: channelHandle }
      });

      // Reset form
      setNewChannelUrl('');
      
      // Refresh both channels and videos after adding a new channel
      await Promise.all([fetchChannels(), fetchVideos()]);

    } catch (error) {
      console.error('Error adding channel:', error);
    } finally {
      setIsAddingChannel(false);
    }
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    setIsAddingVideo(true);
    
    try {      
      if (!newVideoUrl.trim()) {
        throw new Error('Please enter a valid YouTube URL');
      }

      // Add video via API
      await axios.post(`${API_BASE_URL}/add_video`, null, {
        params: { video_url: newVideoUrl }
      });

      // Reset form and states
      setNewVideoUrl('');
      setShowAddVideo(false);
  
      // Refresh both channels and videos after adding a new video
      await Promise.all([fetchChannels(), fetchVideos()]);
    } catch (error) {
      console.error('Error adding video:', error.message || 'Failed to add video. Please try again.');
    } finally {
      setIsAddingVideo(false);
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
    <DashboardContainer>
      {/* Content Management Section */}
      <ChannelSection>
        <Box
          onClick={() => setShowChannels(!showChannels)}
          sx={{
            p: 2,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <YouTubeIcon color="error" />
            <Typography variant="h6">
              Content Management
            </Typography>
          </Box>
          <ExpandMoreIcon
            sx={{
              transform: showChannels ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }}
          />
        </Box>

        <Collapse in={showChannels}>
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            {/* Channel Management Section */}
            <form onSubmit={handleAddChannel}>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                mb: 3,
                alignItems: 'center',
                width: '100%'
              }}>
                <TextField
                  fullWidth
                  label="https://www.youtube.com/@hubermanlab"
                  value={newChannelUrl}
                  onChange={(e) => setNewChannelUrl(e.target.value)}
                  size="small"
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                    flexGrow: 1,
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={isAddingChannel}
                  sx={{ 
                    borderRadius: '12px',
                    minWidth: '160px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isAddingChannel ? 'Processing...' : ' Channel'}
                </Button>
              </Box>
            </form>

            {/* Video Management Section */}
            <form onSubmit={handleAddVideo}>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                mb: 3,
                alignItems: 'center',
                width: '100%'
              }}>
                <TextField
                  fullWidth
                  label="https://www.youtube.com/watch?v=lIo9FcrljDk"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  size="small"
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                    flexGrow: 1,
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={isAddingVideo}
                  sx={{ 
                    borderRadius: '12px',
                    minWidth: '160px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isAddingVideo ? 'Processing...' : ' Video'}
                </Button>
              </Box>
            </form>

            {/* Channel List */}
            {channels.length > 0 && (
              <>
                <Typography variant="subtitle1" sx={{ mt: 4, mb: 2 }}>
                  Managed Channels
                </Typography>
                <List>
                  {channels.map((channel) => (
                    <ListItem
                      key={channel.id}
                      sx={{
                        borderRadius: '12px',
                        mb: 1,
                        backgroundColor: 'background.default',
                      }}
                    >
                      <ListItemText
                        primary={channel.name}
                        secondary={channel.url}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        </Collapse>
      </ChannelSection>

      {/* Video Queue Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography variant="h6">
          Video Queue
        </Typography>
      </Box>
      
      <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            component={Link}
            to={`/review/${video.id}`}
            sx={{ display: 'flex', gap: 2 }}
          >
            <img 
              src={video.thumbnail_url} 
              alt={video.title}
              style={{
                width: '160px',
                height: '90px',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
            />
            <ListItemText
              primary={
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {video.title}
                </Typography>
              }
              secondary={
                <>
                  <Typography variant="body2" color="text.secondary" display="block">
                    {`Channel: ${video.channel_id || 'Unknown'} • Duration: ${formatDuration(video.duration)}`}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="primary"
                    sx={{ mt: 0.5 }}
                  >
                    {/* TODO: Add highlight status tracking */}
                    {/* Need to track:
                        - Number of pending highlights
                        - Number of approved highlights 
                        - Number of rejected highlights
                        - Add status field to highlight model
                        - Update UI to show highlight status breakdown
                    */}
                    {`${video.highlights.length} highlights`}
                  </Typography>
                </>
              }
            />
          </VideoCard>
        ))}
      </List>
    </DashboardContainer>
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