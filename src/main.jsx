import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

// Each page loads its own stylesheet so the editor and invitation stay isolated.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));
const InvitationApp = lazy(() => import('./invitation/InvitationApp.jsx'));
const isAdmin = ['/admin', '/create/blossom-oud'].includes(window.location.pathname);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<p className="loading">دعوة بكل الحب…</p>}>
      {isAdmin ? <AdminApp /> : <InvitationApp />}
    </Suspense>
  </StrictMode>,
);
