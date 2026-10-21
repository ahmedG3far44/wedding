import { useState } from 'react';
import { ArrowDown, ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import { dateText, names, timeText, words } from '../../shared/invitation.mjs';

const durations = [12000, 7500, 12500, 6500, 14000, 0];
const arabicDisplay = (text) => ({
  'المهندس أسامة': 'الْمُهَنْدِس أُسَامَة',
  'الدكتورة صفاء': 'الدُّكْتُورَة صَفَاء',
  'قصر بصمات للاحتفالات': 'قَصْر بَصَمَات لِلِاحْتِفَالَات',
  'الاستقبال': 'الِاسْتِقْبَال',
  'العشاء': 'الْعَشَاء',
  'الحفل': 'الْحَفْل',
  'عقد القران': 'عَقْد الْقِرَان',
  'الخطوبة': 'الْخِطْبَة',
}[text] || text);
const copy = {
  ar: {
    story: ['بِقُلُوبٍ يَمْلَؤُهَا الْفَرَحُ', 'وَبِدُعَاءِ مَنْ أَحَبُّونَا، نَلْتَقِي وَنَكْتُبُ', 'فِي أُولَى خُطُوَاتِ حَيَاتِنَا', 'وَفِي لَيْلَةٍ نَكْتُبُ فِيهَا', 'بِدَايَةَ حِكَايَةٍ جَدِيدَةٍ'],
    blessing: ['وَيَجْمَعُ اللَّهُ فِيهَا قَلْبَيْنِ', 'عَلَى الْمَوَدَّةِ وَالرَّحْمَةِ', 'وَيَجْعَلُ مِنْ أُلْفَتِهِمَا فَرَحًا'],
    invitation: ['بكل حب وسرور', 'نتشرف بدعوتكم لمشاركتنا'],
    next: 'المشهد التالي', previous: 'المشهد السابق', pause: 'إيقاف العرض مؤقتًا',
    play: 'تشغيل العرض', replay: 'إعادة العرض', details: 'تفاصيل الدعوة',
  },
  en: {
    opening: ['A date unlike any other', 'A new chapter begins', 'And our joy becomes complete'],
    story: ['With hearts full of joy', 'And the love of those around us', 'We take our first steps together', 'On a night that marks', 'The beginning of our story'],
    blessing: ['May our hearts be brought together', 'In love and kindness', 'And our lives be filled with joy'],
    invitation: ['With love and joy', 'We invite you to celebrate'],
    next: 'Next scene', previous: 'Previous scene', pause: 'Pause invitation',
    play: 'Play invitation', replay: 'Replay invitation', details: 'Invitation details',
  },
  fr: {
    opening: ['Une date pas comme les autres', 'Un nouveau chapitre commence', 'Et notre joie devient complète'],
    story: ['Le cœur rempli de joie', 'Entourés de ceux qui nous aiment', 'Nous faisons nos premiers pas ensemble', 'En cette soirée qui marque', 'Le début de notre histoire'],
    blessing: ['Que nos cœurs soient unis', 'Dans l’amour et la tendresse', 'Et nos vies remplies de joie'],
    invitation: ['Avec amour et joie', 'Nous vous invitons à célébrer'],
    next: 'Scène suivante', previous: 'Scène précédente', pause: 'Mettre en pause',
    play: 'Lire l’invitation', replay: 'Revoir l’invitation', details: 'Les détails',
  },
};

export function Monogram({ className = '' }) {
  return (
    <span className={`monogram ${className}`} role="img" aria-label="أ · ص">
      <img src="/assets/last_version_logo.png" alt="" width="1254" height="1254" fetchPriority="high" />
    </span>
  );
}

function Line({ children, delay = 0, className = '' }) {
  return <div className={`story-line ${className}`} style={{ '--delay': `${delay}ms` }}>{children}</div>;
}

export default function InvitationStory({ config: c, started, inert }) {
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(true);
  const t = words[c.language] || words.en;
  const s = copy[c.language] || copy.en;
  const [groom, bride] = names(c);
  const last = scene === durations.length - 1;
  const date = c.date.split('-').reverse().join(' . ');
  const month = new Intl.DateTimeFormat('ar', { month: 'long', timeZone: 'UTC' }).format(new Date(`${c.date}T12:00:00Z`));
  const opening = c.language === 'ar' ? [`وَقَدْ كُتِبَ لِـ${month === 'نوفمبر' ? 'نُوفَمْبَر' : month} أَنْ يَكُونَ`, 'اسْتِثْنَاءً لِهَذَا الْعَامِ', 'فَفِيهِ تَكْتَمِلُ فَرْحَتُنَا'] : s.opening;

  function advance(event) {
    if (event.target === event.currentTarget && event.animationName === 'story-scene') {
      setScene((value) => Math.min(value + 1, durations.length - 1));
    }
  }

  return (
    <section className={`invitation-story${started && playing ? ' is-running' : ''}`} inert={inert} aria-label={`${groom} ${t.and} ${bride}`}>
      <video className="story-video" src="/assets/ivory-glass.mp4" poster="/assets/ivory-glass.png" autoPlay muted loop playsInline aria-hidden="true" tabIndex={-1} />
      <div className="glass-light" aria-hidden="true" />
      <div key={scene} className={`story-scene scene-${scene}${last ? ' is-last' : ''}`} style={{ '--duration': `${durations[scene]}ms` }} onAnimationEnd={advance} data-scene={scene}>
        {scene === 0 && <>
          <Line className="story-monogram"><Monogram /></Line>
          <Line delay={2500} className="story-numeric-date"><time dateTime={c.date}>{date}</time></Line>
          <div className="story-opening">{opening.map((line, i) => <Line key={i} delay={3800 + i * 1200}>{line}</Line>)}</div>
        </>}
        {scene === 1 && <div className="story-verse">
          <Line className="basmala-text">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Line>
          <Line delay={1200}>وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُمْ مِنْ أَنْفُسِكُمْ أَزْوَاجًا لِتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَوَدَّةً وَرَحْمَةً</Line>
          {c.language !== 'ar' && <Line delay={2400} className="verse-translation">{c.language === 'fr' ? 'Il a mis entre vous de l’affection et de la bonté.' : 'And He placed between you affection and mercy.'}</Line>}
        </div>}
        {scene === 2 && <div className="story-poem">{(c.greeting ? c.greeting.split('\n').filter(Boolean) : s.story).map((line, i) => <Line key={i} delay={i * 1400}>{line}</Line>)}</div>}
        {scene === 3 && <div className="story-poem">{s.blessing.map((line, i) => <Line key={i} delay={i * 1200}>{line}</Line>)}</div>}
        {scene === 4 && c.language === 'ar' && <div className="story-couple story-family-invitation">
          <Line>يَتَشَرَّفُ بِكُلِّ وُدٍّ وَمَحَبَّةٍ</Line>
          <Line delay={1400} className="story-hosts">
            <span>السَّيِّدُ: آل سِرِّ الْخَتْمِ عَبْدِ الْوَهَّابِ إِبْرَاهِيم</span>
            <span className="hosts-and">وَ</span>
            <span>السَّيِّدُ: آل مُحَمَّد سَيِّد أَحْمَد الْحَدَّاد</span>
          </Line>
          <Line delay={3600}>بِدَعْوَتِكُمْ لِمُشَارَكَةِ فَرْحَةِ {c.eventType === 'engagement' ? 'خِطْبَةِ' : 'زَفَافِ'} أَبْنَائِهِمْ</Line>
          <Line delay={5200} className="story-couple-names">
            <span>{arabicDisplay(groom)}</span>{' وَ '}<span>{arabicDisplay(bride)}</span>
          </Line>
        </div>}
        {scene === 4 && c.language !== 'ar' && <div className="story-couple">
          {s.invitation.map((line, i) => <Line key={i} delay={i * 900}>{line}</Line>)}
          <Line delay={1900}>{c.language === 'ar' ? `فرحة ${c.eventType === 'engagement' ? 'خطوبة' : 'زفاف'}` : `${t.join} ${t[c.eventType]}`}</Line>
          {/* <Line delay={3000} className="story-name">{groom}</Line>
          <Line delay={3900} className="story-and">{t.and}</Line>
          <Line delay={4600} className="story-name">{bride}</Line>
          <Line delay={6000} > Osama & Safaa</Line> */}
        </div>}
        {scene === 5 && <div className="story-event">
          <Line>{c.language === 'ar' ? 'وَذَلِكَ بِمَشِيئَةِ اللَّهِ تَعَالَى يَوْمَ' : t.on}</Line>
          <Line delay={800} className="story-event-date"><time dateTime={c.date}>{dateText(c, true)}</time></Line>
          <Line delay={1600} className="story-event-venue">{c.language === 'ar' ? arabicDisplay(c.venue) : c.venue}</Line>
          {c.timeline && <div className="story-schedule">{['reception', 'ceremony', 'dinner', 'party'].filter(stage => c[stage]).map((stage, i) => <Line key={stage} delay={2400 + i * 650}><span>{arabicDisplay(stage === 'ceremony' && c.eventType === 'engagement' ? t.engagementCeremony : t[stage])}</span><time>{timeText(c, c[stage])}</time></Line>)}</div>}
        </div>}
      </div>
      <div className="story-navigation" dir="ltr">
        <button type="button" aria-label={s.previous} onClick={() => { setScene(Math.max(0, scene - 1)); setPlaying(true); }} disabled={scene === 0}><ChevronLeft size={16} /></button>
        <div className="story-progress" aria-hidden="true">{durations.map((_, i) => <span key={i} className={i === scene ? 'active' : ''} />)}</div>
        <button type="button" aria-label={last ? s.replay : playing ? s.pause : s.play} onClick={() => { if (last) { setScene(0); setPlaying(true); } else setPlaying(value => !value); }}>{last ? <RotateCcw size={14} /> : playing ? <Pause size={14} /> : <Play size={14} />}</button>
        <button type="button" aria-label={s.next} onClick={() => { setScene(Math.min(durations.length - 1, scene + 1)); setPlaying(true); }} disabled={last}><ChevronRight size={16} /></button>
      </div>
      <a className="story-details" href="#invitation-details">{s.details}<ArrowDown size={13} aria-hidden="true" /></a>
    </section>
  );
}
