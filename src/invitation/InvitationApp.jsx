import { useEffect, useState } from 'react';
import { defaults, dateText, eventInstant, timeText } from '../../shared/invitation.mjs';
import { api } from '../lib/api.mjs';
import Invitation from './Invitation.jsx';
import '../styles/invitation.css';

export default function InvitationApp() {
  const preview = location.pathname === '/preview';
  const invitationId = location.pathname.startsWith('/i/')
    ? location.pathname.split('/')[2]
    : 'demo';
  const [draft, setDraft] = useState(() => ({
    config: preview ? { ...defaults } : null,
    showEnvelope: !preview,
    revision: 0,
  }));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (preview) {
      function receive(event) {
        if (event.origin !== location.origin || event.source !== parent) return;
        if (event.data?.type === 'preview') {
          const config = { ...defaults, ...event.data.config };
          try {
            // Keep the last valid draft while a date or time field is incomplete.
            dateText(config);
            eventInstant(config);
            for (const field of ['reception', 'ceremony', 'dinner', 'party'])
              timeText(config, config[field]);
            setDraft((previous) => ({
              config,
              showEnvelope: false,
              revision: previous.revision + 1,
            }));
          } catch {
            /* Partial drafts cannot replace a working preview. */
          }
        } else if (event.data?.type === 'open-envelope') {
          setDraft((previous) => ({
            ...previous,
            showEnvelope: true,
            revision: previous.revision + 1,
          }));
        }
      }
      window.addEventListener('message', receive);
      parent.postMessage({ type: 'preview-ready' }, location.origin);
      return () => window.removeEventListener('message', receive);
    }
    const controller = new AbortController();
    api(`/api/invitations/${encodeURIComponent(invitationId)}`, { signal: controller.signal })
      .then((config) => setDraft({ config, showEnvelope: true, revision: 0 }))
      .catch((error) => {
        if (error.name !== 'AbortError') setError(true);
      });
    return () => controller.abort();
  }, [preview, invitationId]);

  if (error)
    return (
      <main id="invitation">
        <div className="error-page">
          <h1>Invitation not found</h1>
          <p>Check the invitation link, or create a new invitation.</p>
          <a href="/admin">Open the invitation editor</a>
        </div>
      </main>
    );
  if (!draft.config)
    return (
      <main id="invitation">
        <p className="loading">دعوة بكل الحب…</p>
      </main>
    );
  return (
    <Invitation
      key={draft.revision}
      config={draft.config}
      invitationId={invitationId}
      preview={preview}
      showEnvelope={draft.showEnvelope}
    />
  );
}
