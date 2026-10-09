import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { SimulationProvider } from './context/SimulationContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <SimulationProvider>
          <App />
        </SimulationProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
