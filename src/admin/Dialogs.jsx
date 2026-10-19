import { useEffect, useRef, useState } from 'react';
import { names } from '../../shared/invitation.mjs';
import { responsesCsv } from '../../shared/exports.mjs';
import { api } from '../lib/api.mjs';
import { downloadFile } from '../lib/download.mjs';

function Dialog({ id, open, onClose, children }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    if (open && !element.open) element.showModal();
    else if (!open && element.open) element.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      id={id}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {children}
    </dialog>
  );
}

export function InvitationManager({ open, invitations, error, onClose, onEdit, onResponses }) {
  return (
    <Dialog id="manager" open={open} onClose={onClose}>
      <div className="dialog-header">
        <h2>دعواتي</h2>
        <button className="close-dialog" aria-label="إغلاق" onClick={onClose}>
          ×
        </button>
      </div>
      <div id="invitation-list">
        {error ? (
          <p className="empty">تعذر تحميل الدعوات. تأكد إن السيرفر شغال.</p>
        ) : (
          invitations.map((invitation) => (
            <div className="invitation-row" key={invitation.id}>
              <div>
                <h3>
                  {names(invitation).join(' & ')}
                  {invitation.id === 'demo' && <small> · نموذج</small>}
                </h3>
                <p>{invitation.date}</p>
              </div>
              <div className="row-actions">
                <button onClick={() => onEdit(invitation.id)}>تعديل</button>
                <button onClick={() => onResponses(invitation.id)}>الحضور</button>
                <a
                  href={`/i/${invitation.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="فتح الدعوة"
                >
                  ↗
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </Dialog>
  );
}

export function ResponsesDialog({ invitationId, onClose }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!invitationId) return;
    const controller = new AbortController();
    setError(false);
    api(`/api/invitations/${encodeURIComponent(invitationId)}/responses`, {
      signal: controller.signal,
    })
      .then(setRows)
      .catch((error) => {
        if (error.name !== 'AbortError') setError(true);
      });
    return () => controller.abort();
  }, [invitationId, refresh]);
  const yes = rows.filter((row) => row.attendance === 'yes');
  const summary = [
    [yes.reduce((total, row) => total + row.guests, 0), 'إجمالي الحضور'],
    [yes.length, 'تأكيد حضور'],
    [rows.length - yes.length, 'اعتذار'],
  ];

  return (
    <Dialog id="responses" open={Boolean(invitationId)} onClose={onClose}>
      <div className="dialog-header">
        <div>
          <p className="eyebrow">كل اللي هيشاركوكم الفرحة</p>
          <h2>ردود الحضور</h2>
        </div>
        <button className="close-dialog" aria-label="إغلاق" onClick={onClose}>
          ×
        </button>
      </div>
      <div id="response-summary">
        {summary.map(([count, label]) => (
          <div className="stat" key={label}>
            <strong>{count}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="response-toolbar">
        <button id="refresh-responses" onClick={() => setRefresh((value) => value + 1)}>
          تحديث ↻
        </button>
        <button
          id="export-responses"
          onClick={() =>
            downloadFile(
              responsesCsv(rows),
              'text/csv;charset=utf-8',
              `wedding-rsvps-${invitationId}.csv`,
            )
          }
        >
          تصدير CSV ↓
        </button>
      </div>
      <div id="response-list">
        {error ? (
          <p className="empty">تعذّر تحميل الردود. جرّب تحديث الصفحة.</p>
        ) : rows.length ? (
          rows.map((row) => (
            <div className="response-card" key={row.visitor}>
              <strong>{row.name}</strong>
              <span>{row.attendance === 'yes' ? `حاضر · ${row.guests} أفراد` : 'معتذر'}</span>
              <p>{row.note || 'بدون ملاحظات'}</p>
              <p>
                {new Intl.DateTimeFormat('ar-EG', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'Africa/Cairo',
                }).format(new Date(row.updatedAt))}
              </p>
            </div>
          ))
        ) : (
          <p className="empty">
            لسه مفيش ردود ♡<br />
            أول ما ضيوفك يأكدوا حضورهم، ردودهم هتظهر هنا.
          </p>
        )}
      </div>
    </Dialog>
  );
}
