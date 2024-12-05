/**
 * Highlight Review Component
 * 
 * Interface for reviewing and moderating generated video highlights.
 * Features:
 * - Split-screen layout with transcript on the left
 * - Stack of highlight cards on the right
 * - Approve/reject highlights
 * - Both panels are independently scrollable
 * - Timestamps to help correlate content
 * 
 * Communicates with backend API for highlight status updates.
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import { TabPanel } from '@mui/lab';

import {
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // Ensure this matches your backend URL

const HighlightReview = () => {
  const { videoId } = useParams();
  const [video, setVideo] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [rawTranscript, setRawTranscript] = useState('');
  const [processedTranscript, setProcessedTranscript] = useState('');
  const [transcript, setTranscript] = useState('');
  const [highlights, setHighlights] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchVideoData();
    fetchTranscript();
    fetchHighlights();
  }, [videoId]);

  // ##########################################
  // #                                        #
  // #              update states             #
  // #                                        #
  // ##########################################

  // Fetch video metadata
  const fetchVideoData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/videos/${videoId}`);
      setVideo(response.data);
    } catch (error) {
      console.error('Error fetching video:', error);
    }
  };

  // Fetch video transcript
  const fetchTranscript = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/videos/${videoId}/transcript`);
      setRawTranscript(response.data.raw_content);
      setProcessedTranscript(response.data.processed_content);
    } catch (error) {
      console.error('Error fetching transcript:', error);
    }
  };

  // Fetch highlights for the video
  const fetchHighlights = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/videos/${videoId}/highlights`);
      setHighlights(response.data);
    } catch (error) {
      console.error('Error fetching highlights:', error);
    }
  };

  // ##########################################
  // #                                        #
  // #              Handlers                  #
  // #                                        #
  // ##########################################

  const handleProcessVideo = async () => {
    setIsProcessing(true);
    try {
      await axios.post(`${API_BASE_URL}/videos/${videoId}/process`);
      // Optionally, refresh state after processing
      fetchVideoData();
    } catch (error) {
      console.error('Error processing video:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle highlight approval
  const handleApprove = async (highlightId) => {
    try {
      await axios.put(`${API_BASE_URL}/highlights/${highlightId}`, {
        status: 'approved',
      });
      // Remove the highlight from the list
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    } catch (error) {
      console.error('Error approving highlight:', error);
    }
  };

  // Handle highlight rejection
  const handleReject = async (highlightId) => {
    try {
      await axios.put(`${API_BASE_URL}/highlights/${highlightId}`, {
        status: 'rejected',
      });
      // Remove the highlight from the list
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    } catch (error) {
      console.error('Error rejecting highlight:', error);
    }
  };

  // Update transcript display
  const TranscriptPanel = () => (
    <Paper sx={{ p: 2, height: '75vh', overflowY: 'auto' }}>
      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tab label="Processed" />
        <Tab label="Raw" />
      </Tabs>
      
      <TabPanel value={activeTab} index={0}>
        {formatTranscript(processedTranscript)}
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        {formatTranscript(rawTranscript)}
      </TabPanel>
    </Paper>
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (!video) return <div>Loading...</div>;

  if (processingStatus !== 'completed') {
    return (
      <Container>
        <Typography variant="h4">{video.title}</Typography>
        <Alert severity="warning">This video has not been processed yet.</Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={handleProcessVideo}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Process Video'}
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Video Title and Info */}
      <Typography variant="h4" gutterBottom>
        {video.title}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Channel: {video.channel_id} • Duration: {formatDuration(video.duration)}
      </Typography>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {/* Transcript Panel */}
        <Grid item xs={12} md={6}>
          <TranscriptPanel />
        </Grid>

        {/* Highlights Panel */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '75vh', overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Highlights ({highlights.length} remaining)
            </Typography>
            {highlights.length === 0 ? (
              <Typography variant="body1">All highlights have been reviewed.</Typography>
            ) : (
              highlights.map((highlight, index) => (
                <Card key={highlight.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1">
                      Highlight #{index + 1}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {formatTime(highlight.time_start)} - {formatTime(highlight.time_end)}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {highlight.quote}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      startIcon={<ApproveIcon />}
                      color="success"
                      onClick={() => handleApprove(highlight.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      startIcon={<RejectIcon />}
                      color="error"
                      onClick={() => handleReject(highlight.id)}
                    >
                      Reject
                    </Button>
                  </CardActions>
                </Card>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

// Helper function to format duration in seconds to HH:MM:SS
const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const hh = h > 0 ? `${h}:` : '';
  const mm = `${m < 10 ? '0' : ''}${m}:`;
  const ss = `${s < 10 ? '0' : ''}${s}`;

  return `${hh}${mm}${ss}`;
};

// Helper function to format transcript text with timestamps
const formatTranscript = (transcript) => {
  // Assuming transcript is a string where each line starts with [MM:SS] timestamp
  return transcript.split('\n').map((line, index) => (
    <Typography key={index} variant="body1" component="p">
      {line}
    </Typography>
  ));
};

// Helper function to format time in seconds to MM:SS
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);

  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default HighlightReview;