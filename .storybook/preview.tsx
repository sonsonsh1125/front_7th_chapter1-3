import type { Preview } from '@storybook/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import React from 'react';

const theme = createTheme();

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <React.StrictMode>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SnackbarProvider>
            <Story />
          </SnackbarProvider>
        </ThemeProvider>
      </React.StrictMode>
    ),
  ],
};

export default preview;

