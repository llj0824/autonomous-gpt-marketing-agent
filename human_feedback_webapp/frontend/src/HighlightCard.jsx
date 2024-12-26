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
  CircularProgress,
  Tooltip,
  Popover,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Article as ArticleIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const HighlightCard = ({ highlight, video, onApprove, onReject }) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [comment, setComment] = useState('');
  const [downloadState, setDownloadState] = useState('idle');

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

  const handleDownload = async () => {
    try {
      setDownloadState('loading');
      
      const response = await axios.get(`${API_BASE_URL}/videos/${highlight.video_id}/download`, {
        responseType: 'blob'
      });
      
      // Sanitize filename parts
      const safeChannelName = video.channel_id.replace(/[@<>:"/\\|?*]/g, '');
      const safeTitle = video.title.replace(/[@<>:"/\\|?*]/g, '');
      const filename = `${safeChannelName}_${safeTitle}_${highlight.id}.mp4`;
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadState('complete');
      setTimeout(() => setDownloadState('idle'), 1500);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadState('idle');
    }
  };

  const DownloadButton = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [downloadType, setDownloadType] = useState('custom');
    const [startTime, setStartTime] = useState('00:00:00');
    const [endTime, setEndTime] = useState('00:00:00');

    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    let icon;
    let tooltipTitle = "Download Video";

    switch (downloadState) {
      case 'loading':
        icon = <CircularProgress size={20} color="inherit" />;
        tooltipTitle = "Downloading...";
        break;
      case 'complete':
        icon = <CheckIcon />;
        tooltipTitle = "Download Complete!";
        break;
      default:
        icon = <DownloadIcon />;
    }

    return (
      <>
        <Tooltip title={tooltipTitle}>
          <IconButton
            color="primary"
            onClick={handleClick}
            disabled={downloadState !== 'idle'}
            sx={{ 
              transition: 'all 0.2s ease-in-out',
              '&:hover': { 
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                transform: downloadState === 'idle' ? 'scale(1.1)' : 'none'
              },
              '&:active': {
                transform: downloadState === 'idle' ? 'scale(0.95)' : 'none'
              }
            }}
          >
            {icon}
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
          transformOrigin={{
            vertical: 'top',
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
              <FormControlLabel 
                value="custom" 
                control={<Radio />} 
                label="Time Range" 
              />
              {downloadType === 'custom' && (
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box>
                  <Typography variant="caption" display="block" gutterBottom>
                    Start Time
                  </Typography>
                  <TextField
                    size="small"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="HH:MM:SS"
                    inputProps={{ pattern: "[0-9]{2}:[0-9]{2}:[0-9]{2}" }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" display="block" gutterBottom>
                    End Time
                  </Typography>
                  <TextField
                    size="small"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="HH:MM:SS"
                    inputProps={{ pattern: "[0-9]{2}:[0-9]{2}:[0-9]{2}" }}
                  />
                </Box>
              </Stack>
            )}
              <FormControlLabel 
                value="full" 
                control={<Radio />} 
                label="Full Video" 
              />
            </RadioGroup>

            <Button
              fullWidth
              variant="contained"
              onClick={handleDownload}
              sx={{ mt: 2 }}
            >
              Download
            </Button>
          </Box>
        </Popover>
      </>
    );
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
            <DownloadButton />
          </Box>
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