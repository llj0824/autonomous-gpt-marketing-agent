/**
 * Highlight Review Component
 * 
 * Interface for reviewing and moderating generated video highlights.
 * Features:
 * - Video playback at highlight timestamps
 * - Approve/reject highlights
 * - Add reviewer comments
 * - Keyboard shortcuts for efficient review
 * 
 * Communicates with backend API for highlight status updates.
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Box,
  IconButton
} from '@mui/material';
import {
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  NavigateNext,
  NavigateBefore
} from '@mui/icons-material';
import axios from 'axios';

const HighlightReview = () => {
  const { videoId } = useParams();
  const [video, setVideo] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [highlights, setHighlights] = useState([]);

  useEffect(() => {
    fetchVideoData();
    fetchHighlights();
  }, [videoId]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      switch(event.key.toLowerCase()) {
        case 'a':
          handleApprove();
          break;
        case 'r':
          handleReject();
          break;
        case 'arrowright':
          handleNext();
          break;
        case 'arrowleft':
          handlePrevious();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, highlights]);

  const fetchVideoData = async () => {
    try {
      const response = await axios.get(`/videos/${videoId}`);
      setVideo(response.data);
    } catch (error) {
      console.error('Error fetching video:', error);
    }
  };

  const fetchHighlights = async () => {
    try {
      const response = await axios.get(`/videos/${videoId}/highlights`);
      setHighlights(response.data);
      setHighlight(response.data[0]);
    } catch (error) {
      console.error('Error fetching highlights:', error);
    }
  };

  const handleApprove = async () => {
    try {
      await axios.put(`/highlights/${highlight.id}`, {
        ...highlight,
        status: 'approved'
      });
      handleNext();
    } catch (error) {
      console.error('Error approving highlight:', error);
    }
  };

  const handleReject = async () => {
    try {
      await axios.put(`/highlights/${highlight.id}`, {
        ...highlight,
        status: 'rejected'
      });
      handleNext();
    } catch (error) {
      console.error('Error rejecting highlight:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < highlights.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setHighlight(highlights[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setHighlight(highlights[currentIndex - 1]);
    }
  };

  if (!video || !highlight) return <div>Loading...</div>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {video.title}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Highlight {currentIndex + 1} of {highlights.length}
        </Typography>

        {/* Video Player */}
        <Box sx={{ my: 2 }}>
          <iframe
            width="100%"
            height="400"
            src={`https://www.youtube.com/embed/${videoId}?start=${highlight.time_start}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </Box>

        {/* Highlight Details */}
        <Box sx={{ my: 2 }}>
          <TextField
            fullWidth
            label="Quote"
            multiline
            rows={4}
            value={highlight.quote}
            onChange={(e) => setHighlight({ ...highlight, quote: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Comments"
            multiline
            rows={2}
            value={highlight.comments || ''}
            onChange={(e) => setHighlight({ ...highlight, comments: e.target.value })}
            margin="normal"
          />
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <IconButton onClick={handlePrevious} disabled={currentIndex === 0}>
            <NavigateBefore />
          </IconButton>
          
          <Box>
            <Button
              startIcon={<ApproveIcon />}
              variant="contained"
              color="success"
              onClick={handleApprove}
              sx={{ mr: 1 }}
            >
              Approve (A)
            </Button>
            <Button
              startIcon={<RejectIcon />}
              variant="contained"
              color="error"
              onClick={handleReject}
            >
              Reject (R)
            </Button>
          </Box>

          <IconButton 
            onClick={handleNext}
            disabled={currentIndex === highlights.length - 1}
          >
            <NavigateNext />
          </IconButton>
        </Box>
      </Paper>
    </Container>
  );
};

export default HighlightReview;