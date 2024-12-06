import React from 'react';
import { Card, CardContent, CardActions, Typography, Button, Box, Divider } from '@mui/material';
import { ThumbUp as ApproveIcon, ThumbDown as RejectIcon } from '@mui/icons-material';

const HighlightCard = ({ highlight, index, onApprove, onReject }) => {
  // Parse the content string into segments
  const parseContent = (content) => {
    return content.split(/\[\d{2}:\d{2}\s*->\s*\d{2}:\d{2}\]/)
      .filter(Boolean)
      .map(segment => {
        const parts = {};
        
        // Extract each section using regex
        const topicMatch = segment.match(/🔬\s*Topic:\s*([^\n]+)/);
        const quoteMatch = segment.match(/✨\s*Quote:\s*([^\n]+)/);
        const insightMatch = segment.match(/💎\s*Insight:\s*([^\n]+)/);
        const takeawayMatch = segment.match(/🎯\s*TAKEAWAY:\s*([^\n]+)/);
        const contextMatch = segment.match(/📝\s*CONTEXT:\s*([^\n]+)/);
        
        // Get the timestamp from the previous segment
        const timeMatch = content.match(/\[(\d{2}:\d{2}\s*->\s*\d{2}:\d{2})\]/);

        if (topicMatch) parts.topic = topicMatch[1].trim();
        if (quoteMatch) parts.quote = quoteMatch[1].trim();
        if (insightMatch) parts.insight = insightMatch[1].trim();
        if (takeawayMatch) parts.takeaway = takeawayMatch[1].trim();
        if (contextMatch) parts.context = contextMatch[1].trim();
        if (timeMatch) parts.timeRange = timeMatch[0];

        return parts;
      });
  };

  const segments = parseContent(highlight.content);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Highlight #{index + 1}
        </Typography>

        {segments.map((segment, idx) => (
          <Box key={idx} sx={{ mb: 3 }}>
            {segment.timeRange && (
              <Typography 
                variant="subtitle2" 
                color="primary" 
                sx={{ 
                  mb: 2,
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}
              >
                {segment.timeRange}
              </Typography>
            )}

            {segment.topic && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  🔬 Topic
                </Typography>
                <Typography variant="body1">{segment.topic}</Typography>
              </Box>
            )}

            {segment.quote && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  ✨ Quote
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontStyle: 'italic',
                    borderLeft: '3px solid #e0e0e0',
                    pl: 2 
                  }}
                >
                  {segment.quote}
                </Typography>
              </Box>
            )}

            {segment.insight && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  💎 Insight
                </Typography>
                <Typography variant="body1">{segment.insight}</Typography>
              </Box>
            )}

            {segment.takeaway && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  🎯 Takeaway
                </Typography>
                <Typography variant="body1">{segment.takeaway}</Typography>
              </Box>
            )}

            {segment.context && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  📝 Context
                </Typography>
                <Typography variant="body1">{segment.context}</Typography>
              </Box>
            )}

            {idx < segments.length - 1 && (
              <Divider sx={{ my: 2 }} />
            )}
          </Box>
        ))}
      </CardContent>
      
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
    </Card>
  );
};

export default HighlightCard;