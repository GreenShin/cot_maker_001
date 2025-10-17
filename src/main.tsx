import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { CssBaseline } from '@mui/material';
import { store } from './store';
import { AppWithTheme } from './components/AppWithTheme';
import './styles/globals.css';
import './styles/a11y.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <CssBaseline />
      <AppWithTheme />
    </Provider>
  </React.StrictMode>
);


