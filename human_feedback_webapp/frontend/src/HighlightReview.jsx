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
  Chip,
  Popover,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  TextField,
} from '@mui/material';
import axios from 'axios';
import { styled } from '@mui/material/styles';
import ArticleIcon from '@mui/icons-material/Article';
import ViewListIcon from '@mui/icons-material/ViewList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import PublishIcon from '@mui/icons-material/Publish';
import {
  Download as DownloadIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

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

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const HMSInput = ({ label, value, onChange }) => {
  const parseTimeInput = (input) => {
    // Remove any non-numeric and non-colon characters
    input = input.replace(/[^\d:]/g, '');
    
    // Handle different formats
    let parts;
    if (input.includes(':')) {
      parts = input.split(':').map(Number);
    } else {
      // Handle numeric-only input
      input = input.padStart(6, '0');
      parts = [
        parseInt(input.slice(0, 2)),
        parseInt(input.slice(2, 4)),
        parseInt(input.slice(4, 6))
      ];
    }
    
    // Pad array if incomplete (e.g., "1:30" → [1, 30, 0])
    while (parts.length < 3) parts.push(0);
    
    // Validate and constrain values
    let [hours, minutes, seconds] = parts;
    minutes = Math.min(59, minutes || 0);
    seconds = Math.min(59, seconds || 0);
    
    // Format to HH:MM:SS
    const formatted = [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
    
    return formatted;
  };

  const handleChange = (e) => {
    const formatted = parseTimeInput(e.target.value);
    onChange(formatted);
  };

  return (
    <Box>
      <Typography variant="caption" display="block" gutterBottom>
        {label}
      </Typography>
      <TextField
        value={value}
        onChange={handleChange}
        size="small"
        placeholder="HH:MM:SS"
        inputProps={{
          style: { fontFamily: 'monospace' }
        }}
        helperText="Format: HH:MM:SS, MM:SS, or seconds"
      />
    </Box>
  );
};

const HighlightReview = () => {
  const { videoId } = useParams();

  const [video, setVideo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawTranscript, setRawTranscript] = useState('');
  const [processedTranscript, setProcessedTranscript] = useState('');
  const [activeFilter, setActiveFilter] = useState('pending');
  const [allHighlights, setAllHighlights] = useState([]);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [downloadState, setDownloadState] = useState('idle');
  const [downloadError, setDownloadError] = useState(null);

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

  const handleDownload = async (type, startTime = null, endTime = null) => {
    try {
      setDownloadState('loading');
      setDownloadError(null);
      
      let response;
      let filename;

      if (type === 'full') {
        response = await axios.get(`${API_BASE_URL}/videos/${videoId}/download`, {
          responseType: 'blob'
        });
        filename = `${video.channel_id}_${video.title}.mp4`;
      } else {
        // Validate time format
        const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
          throw new Error('Invalid time format. Use HH:MM:SS');
        }

        response = await axios.get(
          `${API_BASE_URL}/videos/${videoId}/download_clip`, {
            params: { start_time: startTime, end_time: endTime },
            responseType: 'blob'
          }
        );
        filename = `${video.channel_id}_${video.title}_clip_${startTime}-${endTime}.mp4`;
      }

      const safeFilename = filename.replace(/[^a-z0-9.]/gi, '_');
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', safeFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setDownloadState('complete');
      setTimeout(() => setDownloadState('idle'), 2000);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadError(error.message);
      setDownloadState('idle');
    }
  };

  const DownloadButton = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [downloadType, setDownloadType] = useState('clip');
    const [startTime, setStartTime] = useState('00:00:00');
    const [endTime, setEndTime] = useState('00:00:00');

    const handleClose = () => {
      setAnchorEl(null);
      setDownloadError(null);
    };

    const open = Boolean(anchorEl);

    return (
      <>
        <Tooltip title={downloadState === 'loading' ? 'Downloading...' : 'Download Video'}>
          <IconButton
            color="primary"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            disabled={downloadState !== 'idle'}
          >
            {downloadState === 'loading' ? (
              <CircularProgress size={24} />
            ) : downloadState === 'complete' ? (
              <CheckIcon />
            ) : (
              <DownloadIcon />
            )}
          </IconButton>
        </Tooltip>

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
        >
          <Box sx={{ p: 2, width: 300 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Download Options
            </Typography>
            
            <RadioGroup
              value={downloadType}
              onChange={(e) => setDownloadType(e.target.value)}
            >
              <FormControlLabel value="clip" control={<Radio />} label="Time Range" />
              {downloadType === 'clip' && (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <HMSInput
                    label="Start"
                    value={startTime}
                    onChange={(val) => setStartTime(val)}
                  />
                  <HMSInput
                    label="End"
                    value={endTime}
                    onChange={(val) => setEndTime(val)}
                  />
                </Stack>
              )}
              <FormControlLabel value="full" control={<Radio />} label="Full Video" />
            </RadioGroup>

            {downloadError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {downloadError}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                handleDownload(
                  downloadType,
                  downloadType === 'clip' ? startTime : null,
                  downloadType === 'clip' ? endTime : null
                );
                handleClose();
              }}
              sx={{ mt: 2 }}
            >
              Download
            </Button>
          </Box>
        </Popover>
      </>
    );
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
          <DownloadButton />
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