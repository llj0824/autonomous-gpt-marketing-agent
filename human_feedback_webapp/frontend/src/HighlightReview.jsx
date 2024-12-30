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
  Dialog,
  Chip
} from '@mui/material';
import axios from 'axios';
import { styled } from '@mui/material/styles';
import ArticleIcon from '@mui/icons-material/Article';
import ViewListIcon from '@mui/icons-material/ViewList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import PublishIcon from '@mui/icons-material/Publish';

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
  const [activeFilter, setActiveFilter] = useState('pending');
  const [allHighlights, setAllHighlights] = useState([]);
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
      setAllHighlights(response.data);
    } catch (error) {
      console.error('Error fetching highlights:', error);
    }
  };

  const getFilteredHighlights = () => {
    switch (activeFilter) {
      case 'approved':
        return allHighlights.filter(h => h.review_status === ReviewStatus.APPROVED);
      case 'pending':
        return allHighlights.filter(h => 
          h.review_status !== ReviewStatus.APPROVED && 
          h.review_status !== ReviewStatus.REJECTED &&
          h.review_status !== ReviewStatus.PUBLISHED
        );
      case 'published':
        return allHighlights.filter(h => h.review_status === ReviewStatus.PUBLISHED);
      case 'all':
      default:
        return allHighlights;
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

  const handlePublish = async (highlightId, comment) => {
    try {
      await axios.put(`${API_BASE_URL}/highlights/${highlightId}`, { 
        review_status: ReviewStatus.PUBLISHED,
        review_comment: comment
      });
      // Update the allHighlights state
      setAllHighlights(prevHighlights => 
        prevHighlights.map(h => 
          h.id === highlightId 
            ? { ...h, review_status: ReviewStatus.PUBLISHED, review_comment: comment }
            : h
        )
      );
    } catch (error) {
      console.error('Error publishing highlight:', error);
    }
  };

  const FilterChips = ({ activeFilter, setActiveFilter, counts }) => (
    <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
      <Chip
        icon={<ViewListIcon />}
        label={`All (${counts.all})`}
        onClick={() => setActiveFilter('all')}
        color="primary"
        variant={activeFilter === 'all' ? 'filled' : 'outlined'}
      />
      <Chip
        icon={<PendingIcon />}
        label={`Pending (${counts.pending})`}
        onClick={() => setActiveFilter('pending')}
        variant={activeFilter === 'pending' ? 'filled' : 'outlined'}
      />
      <Chip
        icon={<CheckCircleIcon />}
        label={`Approved (${counts.approved})`}
        onClick={() => setActiveFilter('approved')}
        color="success"
        variant={activeFilter === 'approved' ? 'filled' : 'outlined'}
      />
      <Chip
        icon={<PublishIcon />}
        label={`Published (${counts.published})`}
        onClick={() => setActiveFilter('published')}
        color="info"
        variant={activeFilter === 'published' ? 'filled' : 'outlined'}
      />
    </Box>
  );

  // Calculate filtered highlights and counts before the return statement
  const filteredHighlights = getFilteredHighlights();
  const counts = {
    all: allHighlights.length,
    approved: allHighlights.filter(h => h.review_status === ReviewStatus.APPROVED).length,
    pending: allHighlights.filter(h => 
      h.review_status !== ReviewStatus.APPROVED && 
      h.review_status !== ReviewStatus.REJECTED &&
      h.review_status !== ReviewStatus.PUBLISHED
    ).length,
    published: allHighlights.filter(h => h.review_status === ReviewStatus.PUBLISHED).length
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
        
        <FilterChips 
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          counts={counts}
        />
      </ControlsSection>

      {filteredHighlights.length === 0 ? (
        <Typography variant="h6">
          No {activeFilter} highlights found.
        </Typography>
      ) : (
        <HighlightCard
          highlight={filteredHighlights[0]}
          video={video}
          onApprove={handleApprove}
          onReject={handleReject}
          onPublish={handlePublish}
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