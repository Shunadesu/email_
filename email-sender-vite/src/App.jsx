import React from 'react';
import { Toaster } from 'react-hot-toast';
import EmailSender from './components/EmailSender';
import { ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f7fa',
    }
  },
  typography: {
    h5: {
      fontWeight: 600,
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }
      }
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div style={{ 
        height: '100vh',
        backgroundColor: '#f5f7fa',
        padding: '1rem',
        overflow: 'hidden'
      }}>
        <Toaster position="top-right" />
        <EmailSender />
      </div>
    </ThemeProvider>
  );
}

export default App;
