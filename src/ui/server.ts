import express from 'express';
import path from 'path';
import fs from 'fs';
import { agentStatus } from '../index';
import { getResponseData } from '../output';

// Stage data cache
const stageData = {
  tweets: [] as any[],
  decisions: [] as any[],
  toolOutputs: [] as any[],
  responses: [] as any[]
};

// Function to update stage data
export function updateStageData(
  tweets: any[] = [], 
  decisions: any[] = [], 
  toolOutputs: any[] = [], 
  responses: any[] = []
) {
  stageData.tweets = tweets;
  stageData.decisions = decisions;
  stageData.toolOutputs = toolOutputs;
  stageData.responses = responses;
}

export function startServer(port: number) {
  const app = express();
  
  // Serve static files from the ui/public directory
  app.use(express.static(path.join(__dirname, 'public')));
  
  // API endpoint for agent status
  app.get('/api/status', (req, res) => {
    res.json(agentStatus);
  });
  
  // API endpoint for responses data
  app.get('/api/responses', async (req, res) => {
    try {
      const responses = await getResponseData();
      res.json(responses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch responses' });
    }
  });
  
  // API endpoints for each stage data
  app.get('/api/stage/tweets', (req, res) => {
    res.json(stageData.tweets);
  });
  
  app.get('/api/stage/decisions', (req, res) => {
    res.json(stageData.decisions);
  });
  
  app.get('/api/stage/tools', (req, res) => {
    res.json(stageData.toolOutputs);
  });
  
  app.get('/api/stage/generated-responses', (req, res) => {
    res.json(stageData.responses);
  });
  
  // Serve the main HTML file for all other routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  
  // Start the server
  app.listen(port, () => {
    console.log(`UI server running at http://localhost:${port}`);
  });
  
  return app;
}