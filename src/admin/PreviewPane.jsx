import { useEffect, useRef, useState } from 'react';
import { defaults } from '../../shared/invitation.mjs';

function sendPreview(frame, config) {
  const draft = { ...config };
  for (const key of ['date', 'groom', 'bride', 'venue', 'city']) {
    if (!draft[key]) draft[key] = defaults[key];
  }
  frame.current?.contentWindow.postMessage({ type: 'preview', config: draft }, location.origin);
}

export default function PreviewPane({ config, onBack }) {
  const frame = useRef(null);
  const [ready, setReady] = useState(0);
  useEffect(() => {
    function receive(event) {
      if (
        event.origin === location.origin &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === 'preview-ready'
      ) {
        setReady((count) => count + 1);
      }
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => sendPreview(frame, config), 220);
    return () => clearTimeout(timer);
  }, [config, ready]);

  return (
    <aside className="preview-panel">
      <div className="preview-sticky">
        <div className="preview-heading">
          <div>
            <span className="live-dot" /> معاينة مباشرة <small>تفاصيل حكايتكم، لحظة بلحظة</small>
          </div>
          <button
            id="replay-envelope"
            title="معاينة فتح الظرف"
            onClick={() =>
              frame.current?.contentWindow.postMessage({ type: 'open-envelope' }, location.origin)
            }
          >
            عرض الظرف ↗
          </button>
        </div>
        <div className="preview-frame">
          <iframe
            ref={frame}
            id="live-preview"
            src="/preview"
            title="معاينة الدعوة مباشرة"
            onLoad={() => setReady((count) => count + 1)}
          />
        </div>
        <p className="preview-caption">YOUR LOVE, BEAUTIFULLY TOLD</p>
        <button id="back-to-form" className="mobile-back" onClick={onBack}>
          الرجوع للتعديل →
        </button>
      </div>
    </aside>
  );
}
