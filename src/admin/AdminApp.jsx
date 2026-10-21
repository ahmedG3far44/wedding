import { useEffect, useRef, useState } from 'react';
import { defaults } from '../../shared/invitation.mjs';
import { api, jsonRequest } from '../lib/api.mjs';
import EditorForm from './EditorForm.jsx';
import PreviewPane from './PreviewPane.jsx';
import { InvitationManager, ResponsesDialog } from './Dialogs.jsx';
import '../styles/admin.css';

export default function AdminApp() {
  const [authed, setAuthed] = useState(() => {
    try {
      return sessionStorage.getItem('wedding-admin') === 'admin:admin';
    } catch {
      return false;
    }
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [config, setConfig] = useState({ ...defaults });
  const [id, setId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [toast, setToast] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [listError, setListError] = useState(false);
  const [responseId, setResponseId] = useState(null);
  const [listRevision, setListRevision] = useState(0);
  const savedResult = useRef(null);
  const linkInput = useRef(null);
  const loadingRequest = useRef(null);
  const saveRequest = useRef(null);
  const editVersion = useRef(0);
  const link = id ? `${location.origin}/i/${id}` : '';

  useEffect(() => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    document.title = 'ميثاق — Blossom & Oud | صمّم دعوتك';
    document.querySelector('meta[name="theme-color"]').content = '#f9f5ed';
    const edit = new URLSearchParams(location.search).get('edit');
    const controller = new AbortController();
    if (authed && edit) {
      const version = editVersion.current;
      api(`/api/invitations/${encodeURIComponent(edit)}`, { signal: controller.signal })
        .then((invitation) => {
          if (version !== editVersion.current) return;
          setConfig({ ...defaults, ...invitation });
          setId(invitation.id);
        })
        .catch((error) => {
          if (error.name !== 'AbortError') setToast(error.message);
        });
    }
    return () => {
      controller.abort();
      loadingRequest.current?.abort();
      saveRequest.current?.abort();
    };
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    const controller = new AbortController();
    api('/api/invitations', { signal: controller.signal })
      .then((rows) => {
        setInvitations(rows);
        setListError(false);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setListError(true);
      });
    return () => controller.abort();
  }, [listRevision, authed]);

  useEffect(() => {
    if (!dirty) return;
    function warn(event) {
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    document.body.classList.toggle('showing-preview', showPreview);
    return () => document.body.classList.remove('showing-preview');
  }, [showPreview]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  function login(event) {
    event.preventDefault();
    if (username === 'admin' && password === 'admin') {
      try {
        sessionStorage.setItem('wedding-admin', 'admin:admin');
      } catch {}
      setAuthed(true);
      return;
    }
    location.href = '/';
  }

  function change(event) {
    const { name, value, checked, type } = event.target;
    editVersion.current += 1;
    setConfig((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
    setDirty(true);
    setStatus('');
  }

  async function save(event) {
    event.preventDefault();
    if (saveRequest.current) return;
    const controller = new AbortController();
    saveRequest.current = controller;
    const version = editVersion.current;
    setSaving(true);
    setStatus('');
    try {
      const invitation = await api('/api/invitations' + (id ? `/${encodeURIComponent(id)}` : ''), {
        ...jsonRequest(id ? 'PUT' : 'POST', config),
        signal: controller.signal,
      });
      setId(invitation.id);
      if (version === editVersion.current) setDirty(false);
      history.replaceState(null, '', `/admin?edit=${invitation.id}`);
      setToast('تم حفظ دعوتك بكل الحب');
      setListRevision((value) => value + 1);
      // The saved panel is mounted already, so the next frame sees its updated visibility.
      requestAnimationFrame(() =>
        savedResult.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      );
    } catch (error) {
      if (error.name !== 'AbortError') setStatus('تعذّر حفظ الدعوة: ' + error.message);
    } finally {
      saveRequest.current = null;
      if (!controller.signal.aborted) setSaving(false);
    }
  }

  async function loadForEditing(value) {
    if (saving || (dirty && !confirm('عندك تعديلات لسه متحفظتش. تفتح الدعوة التانية؟'))) return;
    loadingRequest.current?.abort();
    const controller = new AbortController();
    loadingRequest.current = controller;
    const version = ++editVersion.current;
    try {
      const invitation = await api(`/api/invitations/${encodeURIComponent(value)}`, {
        signal: controller.signal,
      });
      if (version !== editVersion.current) return;
      setId(invitation.id);
      setConfig({ ...defaults, ...invitation });
      setDirty(false);
      setStatus('');
      history.replaceState(null, '', `/admin?edit=${invitation.id}`);
      setManagerOpen(false);
      setShowPreview(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      if (error.name !== 'AbortError') setToast(error.message);
    }
  }

  function newInvitation() {
    if (saving || (dirty && !confirm('تبدأ دعوة جديدة من غير حفظ التعديلات الحالية؟'))) return;
    loadingRequest.current?.abort();
    editVersion.current += 1;
    setId(null);
    setConfig({ ...defaults });
    setDirty(false);
    setStatus('');
    setShowPreview(false);
    history.replaceState(null, '', '/admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openResponses(value) {
    setManagerOpen(false);
    setResponseId(value);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setToast('تم نسخ الرابط');
    } catch {
      linkInput.current?.select();
      setToast('حدد الرابط وانسخه من الخانة');
    }
  }

  if (!authed) {
    return (
      <main className="admin-login">
        <form onSubmit={login}>
          <a className="brand" href="/">
            ميثاق <span>MITHAQ</span>
          </a>
          <h1>دخول الإدارة</h1>
          <label htmlFor="admin-username">اسم المستخدم</label>
          <input
            id="admin-username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            autoFocus
          />
          <label htmlFor="admin-password">كلمة المرور</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button type="submit">دخول</button>
        </form>
      </main>
    );
  }

  return (
    <>
      <header className="topbar">
        <a className="brand" href="/admin">
          ميثاق <span>MITHAQ</span>
        </a>
        <nav>
          <button id="new-invitation" onClick={newInvitation} disabled={saving}>
            دعوة جديدة <span>＋</span>
          </button>
          <button
            id="manage-invitations"
            onClick={() => {
              setListRevision((value) => value + 1);
              setManagerOpen(true);
            }}
          >
            دعواتي <span id="invitation-count">{invitations.length || ''}</span>
          </button>
          <a href="/" target="_blank" rel="noopener noreferrer">
            شاهد التصميم ↗
          </a>
        </nav>
      </header>
      <main className="editor-layout">
        <section className="form-panel">
          <a className="back-link" href="/">
            → &nbsp; رجوع للتصميم
          </a>
          <p className="design-name">
            <span lang="en" dir="ltr">
              Blossom &amp; Oud
            </span>{' '}
            — ميثاق
          </p>
          <h1>
            اعمل دعوة زفاف أو خطوبة
            <br className="desktop-break" /> تليق بيك
          </h1>
          <p className="intro">
            إملا البيانات، شوف الدعوة بتصميمها الحقيقي وهي بتتبني قصادك، وبعدين اضغط إنشاء.
          </p>
          <div className="local-note">
            <span>✧</span> كل حكاية حب تستاهل دعوة مميزة
          </div>
          <div className="mobile-tabs">
            <button className="active" id="show-form" onClick={() => setShowPreview(false)}>
              تفاصيل الدعوة
            </button>
            <button id="show-preview" onClick={() => setShowPreview(true)}>
              معاينة الدعوة
            </button>
          </div>
          <EditorForm
            config={config}
            id={id}
            saving={saving}
            status={status}
            onChange={change}
            onSubmit={save}
          />
          <section id="saved-result" ref={savedResult} hidden={!id}>
            <div className="success-heading">
              ✓ <h2>دعوتك جاهزة بكل الحب</h2>
            </div>
            <p>افتح الدعوة أو انسخ لينك المعاينة المحلية.</p>
            <div className="share-link">
              <input
                ref={linkInput}
                id="invitation-link"
                value={link}
                readOnly
                aria-label="رابط الدعوة"
                dir="ltr"
              />
              <button id="copy-link" type="button" onClick={copyLink}>
                نسخ
              </button>
            </div>
            <div className="result-actions">
              <a id="open-invitation" href={link} target="_blank" rel="noopener noreferrer">
                افتح الدعوة ↗
              </a>
              <button id="view-responses" type="button" onClick={() => openResponses(id)}>
                ردود الحضور
              </button>
            </div>
            <p className="field-help">
              اللينك ده محلي، وبيشتغل على جهازك طول ما السيرفر شغال. مشاركة الدعوة مع الضيوف تحتاج
              استضافة.
            </p>
          </section>
          <footer className="editor-footer">
            صُنع للحظات اللي بتعيش للأبد <span>♡</span>
          </footer>
        </section>
        <PreviewPane config={config} onBack={() => setShowPreview(false)} />
      </main>
      <InvitationManager
        open={managerOpen}
        invitations={invitations}
        error={listError}
        onClose={() => setManagerOpen(false)}
        onEdit={loadForEditing}
        onResponses={openResponses}
      />
      {responseId && (
        <ResponsesDialog
          key={responseId}
          invitationId={responseId}
          onClose={() => setResponseId(null)}
        />
      )}
      <div id="toast" role="status" hidden={!toast}>
        {toast}
      </div>
    </>
  );
}
