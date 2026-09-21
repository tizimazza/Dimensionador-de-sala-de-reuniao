import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import FrontendView from './views/FrontendView';
import AdminView from './views/AdminView';
import './index.css';

const rootEl = document.getElementById('root');
const adminRootEl = document.getElementById('discabos-sala-admin-root');
const frontendRootEl = document.getElementById('discabos-sala-frontend-root');

if (adminRootEl) {
  createRoot(adminRootEl).render(
    <StrictMode>
      <AdminView />
    </StrictMode>
  );
} else if (frontendRootEl) {
  createRoot(frontendRootEl).render(
    <StrictMode>
      <FrontendView />
    </StrictMode>
  );
} else if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
