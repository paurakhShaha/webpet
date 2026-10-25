import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/assets';
import { App } from '@/components/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App variant="popup" />
  </StrictMode>,
);
