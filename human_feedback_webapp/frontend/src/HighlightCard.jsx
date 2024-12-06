import React from 'react';
import { Card, CardContent, CardActions, Typography, Button } from '@mui/material';
import { ThumbUp as ApproveIcon, ThumbDown as RejectIcon } from '@mui/icons-material';
import { formatTime } from './utils';

const HighlightCard = ({ highlight, index, onApprove, onReject }) => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle1">
          Highlight #{index + 1}
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {formatTime(highlight.time_start)} - {formatTime(highlight.time_end)}
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          {highlight.quote}
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          startIcon={<ApproveIcon />}
          color="success"
          onClick={() => onApprove(highlight.id)}
        >
          Approve
        </Button>
        <Button
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