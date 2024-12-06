import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Collapse,
  Dialog,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Article as ArticleIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled expand button that rotates when expanded
const ExpandButton = styled(IconButton)(({ theme, expanded }) => ({
  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const HighlightCard = ({ highlight, index, onApprove, onReject }) => {
  const [expanded, setExpanded] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Extract first timestamp from content for the "Watch from" link
  const timeMatch = highlight.content.match(/\[(\d{2}:\d{2})\s*->/);
  const startTime = timeMatch ? timeMatch[1] : '00:00';

  // Get first topic as summary
  const topicMatch = highlight.content.match(/🔬\s*Topic:\s*([^\n]+)/);
  const summary = topicMatch ? topicMatch[1].trim() : 'No topic available';

  return (
    <Card 
      sx={{ 
        mb: 2,
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          boxShadow: 3,
        }
      }}
    >
      {/* Card Header */}
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" component="div">
              Highlight #{index + 1}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                maxWidth: '600px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {summary}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<PlayArrowIcon />}
              label={`Watch from ${startTime}`}
              clickable
              color="primary"
              variant="outlined"
              onClick={() => {/* TODO: Add video link handler */}}
            />
            <ExpandButton
              expanded={expanded ? 1 : 0}
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label="show more"
            >
              <ExpandMoreIcon />
            </ExpandButton>
          </Box>
        </Box>
      </CardContent>

      {/* Expandable Content */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0 }}>
          <Divider sx={{ my: 2 }} />
          
          {/* Parse and display highlight content */}
          {highlight.content.split('\n').map((line, idx) => {
            if (line.includes('Topic:')) {
              return (
                <Box key={idx} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" color="primary">🔬 Topic</Typography>
                  <Typography>{line.replace('🔬 Topic:', '').trim()}</Typography>
                </Box>
              );
            }
            if (line.includes('Quote:')) {
              return (
                <Box key={idx} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" color="primary">✨ Quote</Typography>
                  <Typography sx={{ 
                    fontStyle: 'italic',
                    borderLeft: '3px solid',
                    borderColor: 'primary.main',
                    pl: 2
                  }}>
                    {line.replace('✨ Quote:', '').trim()}
                  </Typography>
                </Box>
              );
            }
            // ... similar handling for Insight, Takeaway, Context
            return null;
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
      </Collapse>

      {/* Action Buttons */}
      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Button
          variant="contained"
          startIcon={<ApproveIcon />}
          color="success"
          onClick={() => onApprove(highlight.id)}
        >
          Approve
        </Button>
        <Button
          variant="contained"
          startIcon={<RejectIcon />}
          color="error"
          onClick={() => onReject(highlight.id)}
        >
          Reject
        </Button>
      </CardActions>

      {/* Transcript Dialog */}
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
          {/* TODO: Add transcript context content */}
          <Typography>
            Transcript context will be displayed here...
          </Typography>
        </Box>
      </Dialog>
    </Card>
  );
};

export default HighlightCard;