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

import TranscriptPanel from './TranscriptPanel';
import HighlightCard from './HighlightCard';
import { formatDuration } from './utils';

const API_BASE_URL = 'http://localhost:8000';

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

  const getTranscriptContext = (highlight) => {
    if (!processedTranscript) return null;

    // Split transcript into lines
    const lines = processedTranscript.split('\n');
    
    // Find the highlight's position in transcript
    const highlightStart = highlight.content.match(/\[(\d{2}:\d{2})\s*->/)[1];
    const startIdx = lines.findIndex(line => line.includes(highlightStart));
    
    if (startIdx === -1) return null;

    // Get 3 lines before and after the highlight
    const contextLines = {
      before: lines.slice(Math.max(0, startIdx - 3), startIdx),
      highlight: [lines[startIdx]], // You might need to adjust this based on your highlight format
      after: lines.slice(startIdx + 1, startIdx + 4)
    };

    return contextLines;
  };

  if (!video) return <div>Loading...</div>;

  const currentHighlight = highlights[currentIndex];

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
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
        {isProcessing ? 'Processing...' : 'Process Video'}
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button 
          onClick={() => setShowTranscriptModal(true)}
          variant="outlined"
        >
          View Full Transcript
        </Button>
        
        <Box>
          <Button 
            onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
            disabled={currentIndex === 0}
            sx={{ mr: 1 }}
          >
            Previous
          </Button>
          <Button
            onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, highlights.length - 1))}
            disabled={currentIndex === highlights.length - 1 || highlights.length === 0}
          >
            Next
          </Button>
        </Box>
      </Box>

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
    </Container>
  );
};

export default HighlightReview;