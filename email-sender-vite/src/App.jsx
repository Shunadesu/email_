import React from 'react';
import { Toaster } from 'react-hot-toast';
import EmailSender from './components/EmailSender';
import { ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Toaster position="top-right" />
      <EmailSender />
    </ThemeProvider>
  );
}

export default App;
