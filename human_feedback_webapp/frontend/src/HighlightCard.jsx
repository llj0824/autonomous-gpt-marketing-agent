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
  TextField
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Article as ArticleIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const HighlightCard = ({ highlight, index, onApprove, onReject }) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [comment, setComment] = useState('');

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
          <Chip
            icon={<PlayArrowIcon />}
            label={`Watch from ${startTime}`}
            clickable
            color="primary"
            variant="outlined"
            onClick={handleWatchFromTimestamp}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {highlight.content.split('\n').map((line, idx) => {
          if (!line.trim()) return null;
          if (line.includes('Topic:')) {
            return (
              <Box key={idx} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600 }}>🔬 Topic</Typography>
                <Typography variant="body2">{line.replace('🔬 Topic:', '').trim()}</Typography>
              </Box>
            );
          }
          if (line.includes('Quote:')) {
            return (
              <Box key={idx} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600 }}>✨ Quote</Typography>
                <Typography 
                  variant="body2"
                  sx={{ 
                    fontStyle: 'italic',
                    borderLeft: '3px solid',
                    borderColor: 'primary.main',
                    pl: 2,
                    py: 1,
                    bgcolor: 'action.hover'
                  }}
                >
                  {line.replace('✨ Quote:', '').trim()}
                </Typography>
              </Box>
            );
          }
          if (line.includes('Insight:')) {
            return (
              <Box key={idx} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600 }}>💎 Insight</Typography>
                <Typography variant="body2">{line.replace('💎 Insight:', '').trim()}</Typography>
              </Box>
            );
          }
          if (line.includes('TAKEAWAY:')) {
            return (
              <Box key={idx} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600 }}>🎯 TAKEAWAY</Typography>
                <Typography variant="body2">{line.replace('🎯 TAKEAWAY:', '').trim()}</Typography>
              </Box>
            );
          }
          if (line.includes('CONTEXT:')) {
            return (
              <Box key={idx} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600 }}>📝 CONTEXT</Typography>
                <Typography variant="body2">{line.replace('📝 CONTEXT:', '').trim()}</Typography>
              </Box>
            );
          }
          return (
            <Typography key={idx} variant="body1" sx={{ mb: 2 }}>
              {line}
            </Typography>
          );
        })}

        <Button
          startIcon={<ArticleIcon />}
          variant="outlined"
          onClick={() => setShowTranscript(true)}
          sx={{ mt: 2 }}
        >
          Show Transcript Context
        </Button>
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
          <Typography variant="body2">
            Transcript context will be displayed here...
          </Typography>
        </Box>
      </Dialog>
    </Card>
  );
};

export default HighlightCard;