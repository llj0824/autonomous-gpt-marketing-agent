import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Dialog,
  IconButton,
  Chip,
  Divider,
  TextField,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Article as ArticleIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  Close as CloseIcon,
  Publish as PublishIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import RegenerateDialog from './RegenerateDialog';

const API_BASE_URL = 'http://localhost:8000';

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const HMSInput = ({ label, value, onChange }) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Typography variant="caption" display="block">
        {label}
      </Typography>
      <TextField
        size="small"
        sx={{ width: 120 }}
        value={value}
        onChange={(e) => {
          let val = e.target.value;
          
          // Only allow numbers and colons
          if (!/^[\d:]*$/.test(val)) return;
          
          // Remove any existing colons first
          val = val.replace(/:/g, '');
          
          // Limit to 6 digits (HHMMSS)
          val = val.slice(0, 6);
          
          // Format with colons
          let formatted = val;
          if (val.length >= 4) {
            formatted = `${val.slice(0, 2)}:${val.slice(2, 4)}:${val.slice(4)}`;
          } else if (val.length >= 2) {
            formatted = `${val.slice(0, 2)}:${val.slice(2)}`;
          }
          
          onChange(formatted);
        }}
        placeholder="HH:MM:SS"
        inputProps={{ 
          maxLength: 8
        }}
      />
    </Box>
  );
};

const HighlightCard = ({ highlight, video, onApprove, onReject, onPublish }) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [comment, setComment] = useState('');
  const [timeRange, setTimeRange] = useState([0, video?.duration || 3600]); // Duration in seconds
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  useEffect(() => {
    setComment('');
  }, [highlight.id]);

  const timeMatch = highlight.content.match(/\[(\d{2}:\d{2})\s*->/);
  const startTime = timeMatch ? timeMatch[1] : '00:00';

  const topicMatch = highlight.content.match(/🔬\s*Topic:\s*([^\n]+)/);
  const summary = topicMatch ? topicMatch[1].trim() : 'No topic available';

  const handleWatchFromTimestamp = () => {
    const [minutes, seconds] = startTime.split(':').map(Number);
    const timeInSeconds = minutes * 60 + seconds;
    const videoUrl = `https://www.youtube.com/watch?v=${highlight.video_id}&t=${timeInSeconds}s`;
    window.open(videoUrl, '_blank');
  };

  const handleApprove = () => {
    onApprove(highlight.id, comment);
    setComment('');
  };

  const handleReject = () => {
    onReject(highlight.id, comment);
    setComment('');
  };

  const handlePublish = () => {
    onPublish(highlight.id, comment);
    setComment('');
  };

  const handleRegenerate = async (newContent) => {
    // Update the highlight content locally
    highlight.content = newContent;
    setShowRegenerateDialog(false);
  };

  const renderContent = (content) => {
    const blocks = content.split('\n\n').filter(block => block.trim());  // Split by double newline
    
    return blocks.map((block, idx) => {
      const lines = block.trim().split('\n');
      const firstLine = lines[0];
      
      // Check if block starts with an emoji
      if (firstLine.match(/^[🔬✨💎🎯📝🔍]/)) {
        const [title, ...content] = firstLine.split(':');
        return (
          <Box key={idx} sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600 }}>
              {title.trim()}
            </Typography>
            <Typography 
              variant="body2"
              sx={title.includes('✨') ? {  // Special styling for quotes
                fontStyle: 'italic',
                borderLeft: '3px solid',
                borderColor: 'primary.main',
                pl: 2,
                py: 1,
                bgcolor: 'action.hover'
              } : undefined}
            >
              {content.join(':').trim()}  {/* Rejoin in case content had colons */}
            </Typography>
            {/* Render any additional lines in the block */}
            {lines.slice(1).map((line, lineIdx) => (
              <Typography key={lineIdx} variant="body2">
                {line.trim()}
              </Typography>
            ))}
          </Box>
        );
      }
      
      // Regular text block without emoji
      return (
        <Typography key={idx} variant="body1" sx={{ mb: 2 }}>
          {block}
        </Typography>
      );
    });
  };

  return (
    <Card 
      sx={{ 
        mb: 3,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: 4,
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {summary}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              icon={<PlayArrowIcon />}
              label={`Watch from ${startTime}`}
              clickable
              color="primary"
              variant="outlined"
              onClick={handleWatchFromTimestamp}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {renderContent(highlight.content)}

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            startIcon={<ArticleIcon />}
            variant="outlined"
            onClick={() => setShowTranscript(true)}
          >
            Show Transcript Context
          </Button>
        </Box>
      </CardContent>

      <CardActions sx={{ flexDirection: 'column', alignItems: 'stretch', p: 2, gap: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={2}
          variant="outlined"
          label="Review Comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          size="small"
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, width: '100%' }}>
          <Button
            variant="contained"
            startIcon={<PublishIcon />}
            color="info"
            onClick={handlePublish}
          >
            Publish
          </Button>
          <Button
            variant="contained"
            startIcon={<ApproveIcon />}
            color="success"
            onClick={handleApprove}
          >
            Approve
          </Button>
          <Button
            variant="contained"
            startIcon={<RejectIcon />}
            color="error"
            onClick={handleReject}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            sx={{ bgcolor: 'grey.500', '&:hover': { bgcolor: 'grey.600' } }}
            onClick={() => setShowRegenerateDialog(true)}
          >
            Regenerate
          </Button>
        </Box>
      </CardActions>

      <Dialog
        open={showTranscript}
        onClose={() => setShowTranscript(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
          <Typography variant="h6">Transcript Context</Typography>
          <IconButton onClick={() => setShowTranscript(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {highlight.prompt || 'No transcript context available.'}
          </Typography>
        </Box>
      </Dialog>

      {showRegenerateDialog && (
        <RegenerateDialog
          highlight={highlight}
          onClose={() => setShowRegenerateDialog(false)}
          onRegenerate={handleRegenerate}
        />
      )}
    </Card>
  );
};

export default HighlightCard;