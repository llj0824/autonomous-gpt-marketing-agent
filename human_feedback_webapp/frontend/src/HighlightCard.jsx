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
  Alert,
  Slider
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

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const HMSInput = ({ label, value, onChange }) => {
  const [h, setH] = useState('00');
  const [m, setM] = useState('00');
  const [s, setS] = useState('00');

  useEffect(() => {
    onChange(`${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`);
  }, [h, m, s]);

  useEffect(() => {
    if (value && value.match(/^\d{2}:\d{2}:\d{2}$/)) {
      const [hh, mm, ss] = value.split(':');
      setH(hh);
      setM(mm);
      setS(ss);
    }
  }, [value]);

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Typography variant="caption" display="block">
        {label}
      </Typography>
      <TextField
        size="small"
        sx={{ width: 60 }}
        value={h}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 2); 
          setH(val);
        }}
        placeholder="HH"
        inputProps={{ maxLength: 2 }}
      />
      <Typography variant="body2">:</Typography>
      <TextField
        size="small"
        sx={{ width: 60 }}
        value={m}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 2);
          setM(val);
        }}
        placeholder="MM"
        inputProps={{ maxLength: 2 }}
      />
      <Typography variant="body2">:</Typography>
      <TextField
        size="small"
        sx={{ width: 60 }}
        value={s}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 2);
          setS(val);
        }}
        placeholder="SS"
        inputProps={{ maxLength: 2 }}
      />
    </Box>
  );
};

const HighlightCard = ({ highlight, video, onApprove, onReject }) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [comment, setComment] = useState('');
  const [downloadState, setDownloadState] = useState('idle');
  const [downloadError, setDownloadError] = useState(null);
  const [timeRange, setTimeRange] = useState([0, video?.duration || 3600]); // Duration in seconds

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

  const handleDownload = async (type, startTime = null, endTime = null) => {
    try {
      setDownloadState('loading');
      setDownloadError(null);
      
      let response;
      let filename;

      if (type === 'full') {
        response = await axios.get(`${API_BASE_URL}/videos/${highlight.video_id}/download`, {
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
          `${API_BASE_URL}/videos/${highlight.video_id}/download_clip`, {
            params: { start_time: startTime, end_time: endTime },
            responseType: 'blob'
          }
        );
        filename = `${video.channel_id}_${video.title}_clip_${startTime}-${endTime}.mp4`;
      }

      // Create safe filename
      const safeFilename = filename.replace(/[^a-z0-9.]/gi, '_');
      
      // Trigger download
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

  const TimeSelector = ({ value, onChange, duration }) => {
    const [inputMode, setInputMode] = useState('slider');
    
    const presets = [
      { label: 'Last 5 min', getValue: (duration) => [Math.max(0, duration - 300), duration] },
      { label: 'First 5 min', getValue: () => [0, 300] },
      { label: 'Middle 5 min', getValue: (duration) => [duration/2 - 150, duration/2 + 150] },
    ];

    return (
      <Box sx={{ mt: 2 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            size="small"
            variant={inputMode === 'slider' ? 'contained' : 'outlined'}
            onClick={() => setInputMode('slider')}
          >
            Slider
          </Button>
          <Button
            size="small"
            variant={inputMode === 'manual' ? 'contained' : 'outlined'}
            onClick={() => setInputMode('manual')}
          >
            Manual
          </Button>
        </Stack>

        <Stack spacing={2}>
          {inputMode === 'slider' ? (
            <>
              <Typography>
                {formatTime(value[0])} - {formatTime(value[1])}
              </Typography>
              <Slider
                value={value}
                onChange={(_, newValue) => onChange(newValue)}
                valueLabelDisplay="auto"
                valueLabelFormat={formatTime}
                min={0}
                max={duration}
              />
            </>
          ) : (
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                size="small"
                label="Start"
                value={formatTime(value[0])}
                onChange={(e) => {
                  const [h, m, s] = e.target.value.split(':').map(Number);
                  const seconds = h * 3600 + m * 60 + s;
                  onChange([seconds, value[1]]);
                }}
                placeholder="HH:MM:SS"
              />
              <Typography>to</Typography>
              <TextField
                size="small"
                label="End"
                value={formatTime(value[1])}
                onChange={(e) => {
                  const [h, m, s] = e.target.value.split(':').map(Number);
                  const seconds = h * 3600 + m * 60 + s;
                  onChange([value[0], seconds]);
                }}
                placeholder="HH:MM:SS"
              />
            </Stack>
          )}

          <Stack direction="row" spacing={1}>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                size="small"
                variant="outlined"
                onClick={() => onChange(preset.getValue(duration))}
              >
                {preset.label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Box>
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