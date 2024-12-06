import React from 'react';
import { Typography } from '@mui/material';

export const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const hh = h > 0 ? `${h}:` : '';
  const mm = `${m < 10 ? '0' : ''}${m}:`;
  const ss = `${s < 10 ? '0' : ''}${s}`;

  return `${hh}${mm}${ss}`;
};

export const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const formatTranscript = (transcript) => {
  if (!transcript) return null;
  return transcript.split('\n').map((line, index) => (
    <Typography key={index} variant="body1" component="p">
      {line + '\n'}
    </Typography>
  ));
};