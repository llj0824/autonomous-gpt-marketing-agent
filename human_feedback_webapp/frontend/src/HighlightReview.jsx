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
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

  useEffect(() => {
    // Load all data when videoId changes
    fetchAllData();
  }, [videoId]);

  // Duplicated from backend/enums.py
  const ReviewStatus = {
    PENDING: "PENDING",
    APPROVED: "APPROVED", 
    REJECTED: "REJECTED"
  };

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
      // Filter OUT highlights that are approved or rejected
      const pendingHighlights = response.data.filter(h => 
        h.review_status !== ReviewStatus.APPROVED && h.review_status !== ReviewStatus.REJECTED
      );
      setHighlights(pendingHighlights);
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

  const handleApprove = async (highlightId, comment) => {
    try {
      await axios.put(`${API_BASE_URL}/highlights/${highlightId}`, { 
        review_status: ReviewStatus.APPROVED,
        review_comment: comment
      });
      // sync with database
      await fetchHighlights();
    } catch (error) {
      console.error('Error approving highlight:', error);
    }
  };

  const handleReject = async (highlightId, comment) => {
    try {
      await axios.put(`${API_BASE_URL}/highlights/${highlightId}`, { 
        review_status: ReviewStatus.REJECTED,
        review_comment: comment
      });
      // sync with database
      await fetchHighlights();
    } catch (error) {
      console.error('Error rejecting highlight:', error);
    }
  };

  if (!video) return <div>Loading...</div>;

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
        
        <Typography variant="body2">
          {highlights.length} highlights remaining
        </Typography>
      </ControlsSection>

      {highlights.length === 0 ? (
        <Typography variant="h6">All highlights have been reviewed.</Typography>
      ) : (
        <HighlightCard
          highlight={highlights[0]}
          onApprove={handleApprove}
          onReject={handleReject}
        />
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