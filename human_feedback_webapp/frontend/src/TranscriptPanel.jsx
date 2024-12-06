import React, { useState } from 'react';
import { Paper, Tab } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { formatTranscript } from './utils';

const TranscriptPanel = ({ processedTranscript, rawTranscript }) => {
  const [activeTab, setActiveTab] = useState('0');

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Paper sx={{ p: 2, height: '75vh', overflowY: 'auto' }}>
      <TabContext value={activeTab}>
        <TabList onChange={handleTabChange} aria-label="transcript tabs">
          <Tab label="Processed" value="0" />
          <Tab label="Raw" value="1" />
        </TabList>

        <TabPanel value="0" sx={{ '& p': { marginBottom: '0.5em' } }}>
          {formatTranscript(processedTranscript)}
        </TabPanel>
        <TabPanel value="1">
          {formatTranscript(rawTranscript)}
        </TabPanel>
      </TabContext>
    </Paper>
  );
};

export default TranscriptPanel;