import express from 'express';
import path from 'path';
import fs from 'fs';
import { agentStatus } from '../index';
import { getResponseData } from '../output';

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