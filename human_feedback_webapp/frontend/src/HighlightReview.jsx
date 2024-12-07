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
  Typography,
  Button,
  Box,
  Dialog
} from '@mui/material';
import axios from 'axios';
import { styled } from '@mui/material/styles';
import ArticleIcon from '@mui/icons-material/Article';

import TranscriptPanel from './TranscriptPanel';
import HighlightCard from './HighlightCard';
import { formatDuration } from './utils';

const API_BASE_URL = 'http://localhost:8000';

// Add styled components
const ReviewContainer = styled(Box)(({ theme }) => ({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: theme.spacing(3),
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  borderBottom: `1px solid ${theme.palette.divider}`,
  paddingBottom: theme.spacing(3),
}));

const ControlsSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
}));

const HighlightReview = () => {
  const { videoId } = useParams();

  const [video, setVideo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawTranscript, setRawTranscript] = useState('');
  const [processedTranscript, setProcessedTranscript] = useState('');
  const [highlights, setHighlights] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

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
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching highlights:', error);
    }
  };

  const handleProcessVideo = async () => {
    setIsProcessing(true);
    try {
      await axios.post(`${API_BASE_URL}/videos/${videoId}/process`);
      // Refresh video data after processing
      await fetchVideoData();
    } catch (error) {
      console.error('Error processing video:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async (highlightId) => {
    try {
      await axios.put(`${API_BASE_URL}/highlights/${highlightId}`, { status: 'approved' });
      const newHighlights = highlights.filter((h) => h.id !== highlightId);
      setHighlights(newHighlights);
      if (currentIndex >= newHighlights.length) {
        setCurrentIndex(newHighlights.length - 1);
      }
    } catch (error) {
      console.error('Error approving highlight:', error);
    }
  };

  const handleReject = async (highlightId) => {
    try {
      await axios.put(`${API_BASE_URL}/highlights/${highlightId}`, { status: 'rejected' });
      const newHighlights = highlights.filter((h) => h.id !== highlightId);
      setHighlights(newHighlights);
      if (currentIndex >= newHighlights.length) {
        setCurrentIndex(newHighlights.length - 1);
      }
    } catch (error) {
      console.error('Error rejecting highlight:', error);
    }
  };

  if (!video) return <div>Loading...</div>;

  const currentHighlight = highlights[currentIndex];

  return (
    <ReviewContainer>
      <HeaderSection>
        <Typography variant="h4" gutterBottom>
          {video.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle1">
            Channel: {video.channel_id} • Duration: {formatDuration(video.duration)}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleProcessVideo}
            disabled={isProcessing}
            size="small"
          >
            {isProcessing ? 'Processing...' : 'Process Video'}
          </Button>
        </Box>
      </HeaderSection>

      <ControlsSection>
        <Button 
          onClick={() => setShowTranscriptModal(true)}
          variant="outlined"
          startIcon={<ArticleIcon />}
        >
          View Full Transcript
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Highlight {currentIndex + 1} of {highlights.length}
          </Typography>
          <Button 
            onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
            disabled={currentIndex === 0}
            variant="outlined"
            size="small"
          >
            Previous
          </Button>
          <Button
            onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, highlights.length - 1))}
            disabled={currentIndex === highlights.length - 1 || highlights.length === 0}
            variant="outlined"
            size="small"
          >
            Next
          </Button>
        </Box>
      </ControlsSection>

      {highlights.length === 0 ? (
        <Typography variant="h6">All highlights have been reviewed.</Typography>
      ) : (
        currentHighlight && (
          <HighlightCard
            highlight={currentHighlight}
            index={currentIndex}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )
      )}

      <Dialog
        open={showTranscriptModal}
        onClose={() => setShowTranscriptModal(false)}
        fullWidth
        maxWidth="md"
      >
        <TranscriptPanel processedTranscript={processedTranscript} rawTranscript={rawTranscript} />
      </Dialog>
    </ReviewContainer>
  );
};

export default HighlightReview;