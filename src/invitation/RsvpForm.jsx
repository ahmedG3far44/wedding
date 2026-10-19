import { useEffect, useRef, useState } from 'react';
import { api, jsonRequest } from '../lib/api.mjs';
import { Divider } from './Decorations.jsx';

function visitorId() {
  try {
    let visitor = localStorage.getItem('wedding-visitor');
    if (!visitor) {
      visitor = crypto.randomUUID();
      localStorage.setItem('wedding-visitor', visitor);
    }
    return visitor;
  } catch {
    return crypto.randomUUID();
  }
}

export default function RsvpForm({ invitationId, preview, translations: t, inert }) {
  const [visitor] = useState(visitorId);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [guests, setGuests] = useState('1');
  const [attendance, setAttendance] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);

  async function submit(event) {
    event.preventDefault();
    if (request.current) return;
    if (preview) {
      setStatus(t.preview);
      return;
    }
    if (!attendance) {
      setStatus(t.select);
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setSending(true);
    setStatus('');
    try {
      await api(`/api/invitations/${encodeURIComponent(invitationId)}/responses`, {
        ...jsonRequest('POST', {
          name: name.trim(),
          note: note.trim(),
          guests: Number(guests),
          attendance,
          visitor,
        }),
        signal: controller.signal,
      });
      setSaved(true);
    } catch (error) {
      if (error.name !== 'AbortError') setStatus(t.error);
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setSending(false);
    }
  }

  return (
    <section className="section" id="rsvp" inert={inert}>
      <h2>{t.rsvp}</h2>
      <Divider />
      <p className="dress-intro">{t.rsvpIntro}</p>
      <div id="rsvp-area">
        <form className="rsvp-form" onSubmit={submit} hidden={saved}>
          <label htmlFor="guest-name">{t.name}</label>
          <input
            id="guest-name"
            name="name"
            required
            maxLength={150}
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <fieldset>
            <legend>{t.attendance}</legend>
            <div className="attendance">
              {['yes', 'no'].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={attendance === value}
                  onClick={() => {
                    setAttendance(value);
                    setStatus('');
                  }}
                >
                  {t[value]}
                </button>
              ))}
            </div>
          </fieldset>
          <div id="guest-count" hidden={attendance !== 'yes'}>
            <label htmlFor="guests">{t.guests}</label>
            <select
              id="guests"
              name="guests"
              value={guests}
              onChange={(event) => setGuests(event.target.value)}
            >
              {Array.from({ length: 10 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1}
                </option>
              ))}
            </select>
          </div>
          <label htmlFor="guest-note">{t.note}</label>
          <textarea
            id="guest-note"
            name="note"
            rows={2}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <p id="rsvp-status" className="form-status" role="status">
            {status}
          </p>
          <button type="submit" className="submit-rsvp" disabled={sending}>
            {sending ? t.sending : t.send}
          </button>
        </form>
        {saved && (
          <div className="success" role="status">
            <p>{attendance === 'yes' ? t.thanks : t.declineThanks}</p>
            <button type="button" onClick={() => setSaved(false)}>
              {t.edit}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
