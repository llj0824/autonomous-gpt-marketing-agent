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
  Typography,
  Button,
  Paper
} from '@mui/material';
import axios from 'axios';

import TranscriptPanel from './TranscriptPanel';
import HighlightCard from './HighlightCard';
import { formatDuration } from './utils';
import { CircularProgress } from '@mui/material';


const API_BASE_URL = 'http://localhost:8000';

const HighlightReview = () => {
  const { videoId } = useParams();

  const [video, setVideo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawTranscript, setRawTranscript] = useState('');
  const [processedTranscript, setProcessedTranscript] = useState('');
  const [highlights, setHighlights] = useState([]);

  useEffect(() => {
    // Load all data when videoId changes
    fetchAllData();
  }, [videoId]);

  const fetchAllData = async () => {
    await fetchVideoData();
    await fetchTranscript();
    await fetchHighlights();
  };

  const fetchVideoData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/videos/${videoId}`);
      setVideo(response.data);
    } catch (error) {
      console.error('Error fetching video:', error);
    }
  };

  const fetchTranscript = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/videos/${videoId}/transcript`);
      if (response.data) {
        setRawTranscript(response.data.raw_transcript);
        setProcessedTranscript(response.data.processed_transcript);
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
    }
  };

  const fetchHighlights = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/videos/${videoId}/highlights`);
      setHighlights(response.data);
    } catch (error) {
      console.error('Error fetching highlights:', error);
    }
  };

  const handleProcessVideo = async () => {
    setIsProcessing(true);
    try {
      await axios.post(`${API_BASE_URL}/videos/${videoId}/process`);
      // Refresh all data after processing
      await fetchAllData();
    } catch (error) {
      console.error('Error processing video:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async (highlightId) => {
    try {
      await axios.put(`${API_BASE_URL}/highlights/${highlightId}`, { status: 'approved' });
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    } catch (error) {
      console.error('Error approving highlight:', error);
    }
  };

  const handleReject = async (highlightId) => {
    try {
      await axios.put(`${API_BASE_URL}/highlights/${highlightId}`, { status: 'rejected' });
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    } catch (error) {
      console.error('Error rejecting highlight:', error);
    }
  };

  if (!video) return <div>Loading...</div>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        {video.title}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Channel: {video.channel_id} • Duration: {formatDuration(video.duration)}
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={handleProcessVideo}
        disabled={isProcessing}
        sx={{ mb: 2 }}
      >
        {isProcessing ? (
          <>
            Processing... <CircularProgress size={20} sx={{ ml: 1, color: 'white' }} />
          </>
        ) : (
          'Process Video'
        )}
      </Button>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <TranscriptPanel
            processedTranscript={processedTranscript}
            rawTranscript={rawTranscript}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '75vh', overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Highlights ({highlights.length} remaining)
            </Typography>
            {highlights.length === 0 ? (
              <Typography variant="body1">All highlights have been reviewed.</Typography>
            ) : (
              highlights.map((highlight, index) => (
                <HighlightCard
                  key={highlight.id}
                  highlight={highlight}
                  index={index}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HighlightReview;