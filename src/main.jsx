import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initDb } from './api/db.js';
import App from './App.jsx';
import './styles/style.css';
import './styles/pages.css';
import './styles/store.css';
import './styles/admin.css';

// the demo "backend" must be seeded/loaded before anything reads it
initDb().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
