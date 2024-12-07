import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import Dashboard from './Dashboard';
import HighlightReview from './HighlightReview';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: {
      default: '#f7f7f7',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
    body1: {
      lineHeight: 1.6,
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/review/:videoId" element={<HighlightReview />} />
          </Routes>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;