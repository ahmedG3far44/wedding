import { Fragment, useEffect, useRef, useState } from 'react';
import { Pause } from 'lucide-react';
import { dateText, mapLinks, names, timeText, words } from '../../shared/invitation.mjs';
import Countdown from './Countdown.jsx';
import RsvpForm from './RsvpForm.jsx';
import { Decoration, Divider } from './Decorations.jsx';
import InvitationStory, { Monogram } from './InvitationStory.jsx';

export default function Invitation({ config: c, invitationId, preview, showEnvelope }) {
  const t = words[c.language] || words.en;
  const [groom, bride] = names(c);
  const map = mapLinks(c);
  const [opened, setOpened] = useState(!showEnvelope);
  const [hidden, setHidden] = useState(!showEnvelope);
  const [playing, setPlaying] = useState(false);
  const audio = useRef(null);
  const heading = useRef(null);
  const inert = !opened;

  useEffect(() => {
    document.documentElement.lang = c.language;
    document.documentElement.dir = c.language === 'ar' ? 'rtl' : 'ltr';
    document.title = `${groom} ${t.and} ${bride}`;
    document.querySelector('meta[name="theme-color"]').content = '#eee5d9';
  }, [c.language, groom, bride, t.and]);

  useEffect(() => {
    const player = audio.current;
    return () => player?.pause();
  }, []);

  useEffect(() => {
    if (!showEnvelope || !opened) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(
      () => {
        setHidden(true);
        heading.current?.focus({ preventScroll: true });
      },
      reduced ? 0 : 2000,
    );
    return () => clearTimeout(timer);
  }, [opened, showEnvelope]);

  function openEnvelope() {
    if (opened) return;
    setOpened(true);
    audio.current?.play().catch(() => setPlaying(false));
  }

  function toggleMusic() {
    if (audio.current.paused) audio.current.play().catch(() => setPlaying(false));
    else audio.current.pause();
  }

  return (
    <main id="invitation">
      {preview && <div className="preview-badge">LIVE PREVIEW</div>}
      <InvitationStory config={c} started={hidden} inert={inert} />
      <section id="invitation-details" className="invitation-card" inert={inert}>
        <Decoration name="small-icon" className="floret" />
        <h1 ref={heading} tabIndex={-1} className="card-names">
          {groom}<small>{t.and}</small>{bride}
        </h1>
        <p className='text-hero'>
          {c.greeting || (
            <>
              {t.invite}
              <br />
              {t.join} {t[c.eventType]}
            </>
          )}
        </p>
        <p>
          {t.on}
          <br />
          <time className="event-date" dateTime={c.date}>{dateText(c, true)}</time>
          <br />
          <time className="event-time">{timeText(c, c.reception)}</time>
        </p>
        <p>
          {t.at} {c.venue}
        </p>
        <Decoration name="flower-line" className="divider" />
      </section>
      {c.countdown && (
        <Countdown config={c} invitationId={invitationId} translations={t} inert={inert} />
      )}
      {c.timeline && (
        <section className="section" inert={inert}>
          <h2>{t.schedule}</h2>
          <Divider />
          <div className="timeline-line" />
          <div className="timeline">
            {['reception', 'ceremony', 'dinner', 'party'].filter(stage => c[stage]).map((stage) => (
              <Fragment key={stage}>
                <time>{timeText(c, c[stage])}</time>
                <Decoration name="ornament" />
                <span>
                  {stage === 'ceremony' && c.eventType === 'engagement'
                    ? t.engagementCeremony
                    : t[stage]}
                </span>
              </Fragment>
            ))}
          </div>
        </section>
      )}
      <section className="section" inert={inert}>
        <h2>{t.venue}</h2>
        <Divider />
        <Decoration name="pin" className="floret" />
        <h3 className="venue-name">{c.venue}</h3>
        <p className="city">{c.city}</p>
        {c.showMap && <a className="venue-link" href={map.direct} target="_blank" rel="noopener noreferrer">{t.directions} ↗</a>}
      </section>
      {c.dressCode && (
        <section className="section" inert={inert}>
          <h2>{t.dress}</h2>
          <Divider />
          <p>{t.palette}</p>
          <div className="palette">
            {['#ede3d3', '#d6c3a7', '#b49a63', '#8e7861', '#67584b'].map((color) => (
              <i key={color} style={{ '--swatch': color }} />
            ))}
          </div>
          <p className="dress-intro">{t.attire}</p>
          <Decoration name="dress-code" className="dress-image" />
          <div className="dress-descriptions">
            <div>
              <h3>{t.ladies}</h3>
              <p>{c.ladies || t.ladiesDesc}</p>
            </div>
            <div>
              <h3>{t.gentlemen}</h3>
              <p>{c.gentlemen || t.gentlemenDesc}</p>
            </div>
          </div>
        </section>
      )}
      {c.rsvp && (
        <RsvpForm invitationId={invitationId} preview={preview} translations={t} inert={inert} />
      )}
      {c.showMap && (
        <section className="section" inert={inert}>
          <h2>{t.map}</h2>
          <Divider />
          <div className="map-frame">
            <iframe
              title={t.map}
              src={map.embed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <a className="directions" href={map.direct} target="_blank" rel="noopener noreferrer">
            {t.directions} ↗
          </a>
        </section>
      )}
      <footer className="section closing" inert={inert}>
        <Monogram className="closing-monogram" />
        <h2>{t.footer}</h2>
        <Decoration name="footer-divider" className="divider" />
        <Decoration name="fine-flower" className="floret" />
      </footer>
      {c.music && (
        <>
          <audio
            ref={audio}
            id="music"
            src="/assets/music.mp3"
            loop
            preload="none"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          <button
            className="music-toggle"
            aria-label={playing ? t.musicOn : t.musicOff}
            title={playing ? t.musicOn : t.musicOff}
            aria-pressed={playing}
            inert={inert}
            onClick={toggleMusic}
          >
            {playing ? <Pause aria-hidden="true" focusable="false" /> : '▶'}
          </button>
        </>
      )}
      <div className={`envelope${opened ? ' opened' : ''}`} hidden={hidden}>
        <div className="envelope-flap" />
        <button type="button" className="seal-button" aria-label={t.open} onClick={openEnvelope}>
          <img className="open-seal" src="/assets/open_button.png" alt="" width="1512" height="1512" fetchPriority="high" />
          <span>{t.open}</span>
        </button>
      </div>
    </main>
  );
}
