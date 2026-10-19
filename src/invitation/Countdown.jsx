import { Fragment, useEffect, useState } from 'react';
import { eventInstant } from '../../shared/invitation.mjs';
import { calendarText } from '../../shared/exports.mjs';
import { downloadFile } from '../lib/download.mjs';
import { Divider } from './Decorations.jsx';

export default function Countdown({ config, invitationId, translations: t, inert }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const diff = Math.max(0, eventInstant(config).getTime() - now);
  const parts = [
    Math.floor(diff / 86400000),
    Math.floor(diff / 3600000) % 24,
    Math.floor(diff / 60000) % 60,
    Math.floor(diff / 1000) % 60,
  ];

  function addToCalendar() {
    downloadFile(
      calendarText(config, invitationId),
      'text/calendar;charset=utf-8',
      'wedding-invitation.ics',
    );
  }

  return (
    <section className="section countdown" inert={inert}>
      <h2>{diff ? t.begins : t.today}</h2>
      <Divider />
      <div className="clock" aria-label="Countdown">
        {parts.map((value, index) => (
          <Fragment key={index}>
            {index > 0 && <b>:</b>}
            <div>
              <strong>{String(value).padStart(2, '0')}</strong>
              <span>{t[['days', 'hours', 'minutes', 'seconds'][index]]}</span>
            </div>
          </Fragment>
        ))}
      </div>
      <button className="calendar-link" id="calendar" onClick={addToCalendar}>
        ♧ &nbsp; {t.calendar}
      </button>
    </section>
  );
}
