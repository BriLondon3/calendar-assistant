'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/*
 * An animated, self-contained recreation of the real review screen
 * (app/upload/event-review.js). It uses made-up sample events and never
 * touches the API — it only exists to show visitors how the flow feels.
 */

const START_HOUR = 9;
const END_HOUR = 24;

// Camera-roll tiles on the phone. The three with a `source` are the event screenshots.
const ROLL = [
  { source: 'GroupMe', kind: 'chat' }, { kind: 'photo', tone: 'a' }, { kind: 'photo', tone: 'b' },
  { kind: 'photo', tone: 'c' }, { source: 'Flare', kind: 'invite' }, { kind: 'photo', tone: 'd' },
  { kind: 'photo', tone: 'e' }, { kind: 'photo', tone: 'f' }, { source: 'Email', kind: 'email' },
];

const UPLOADS = [
  { source: 'GroupMe', label: 'Club Soccer chat' },
  { source: 'Flare', label: 'Fall Formal invite' },
  { source: 'Email', label: 'Prof. Diaz' },
];

const EVENTS = [
  { id: 'e0', day: 'thu', title: 'Office hours · Prof. Diaz', date: 'Thu, Nov 20', time: '3:00 PM – 4:00 PM', where: 'Hamilton Hall 312', start: 15, end: 16, from: 'Email' },
  { id: 'e1', day: 'sat', title: 'IM Soccer vs. Delta', date: 'Sat, Nov 22', time: '4:00 PM – 5:00 PM', where: 'Field 3', start: 16, end: 17, from: 'GroupMe' },
  { id: 'e2', day: 'sat', title: 'Fall Formal', date: 'Sat, Nov 22', time: '9:00 PM – 12:00 AM', where: 'The Boathouse', start: 21, end: 24, from: 'Flare' },
];

const DAYS = {
  thu: { label: 'Thursday, Nov 20', existing: [
    { title: 'BIO 201 Lecture', start: 10, end: 11.25, color: '#7986cb' },
    { title: 'Library desk shift', start: 12, end: 14, color: '#33b679' },
    { title: 'Gym', start: 17.5, end: 18.5, color: '#f4511e' },
  ] },
  sat: { label: 'Saturday, Nov 22', existing: [
    { title: 'Tailgate 🏈', start: 11, end: 13, color: '#e8a800' },
    { title: 'Chem study group', start: 16.5, end: 18, color: '#8e24aa', overlaps: 'e1' },
  ] },
};

const STEPS = ['Upload screenshots from your phone', 'It syncs to your laptop', 'Check each plan against your calendar', 'Add it in one click — or skip it'];
const STEP_OF = { pick: 0, extract: 0, sync: 1, handoff: 1, review: 2, done: 3 };
const PHONE_PHASES = ['pick', 'extract', 'sync', 'handoff'];

const INITIAL = { phase: 'pick', selected: 'e0', status: { e0: 'idle', e1: 'idle', e2: 'idle' }, cursor: null, click: false };

const set = patch => state => ({ ...state, ...patch });
const status = (id, value) => state => ({ ...state, status: { ...state.status, [id]: value } });

const TIMELINE = [
  [2900, set({ phase: 'extract' })],
  [2400, set({ phase: 'sync' })],
  [1900, set({ phase: 'handoff', selected: 'e0' })],
  [800, set({ phase: 'review' })],
  [1000, set({ cursor: 'add-e0' })],
  [800, set({ click: true })],
  [180, s => status('e0', 'adding')(set({ click: false })(s))],
  [700, status('e0', 'added')],
  [1100, set({ cursor: 'title-e1' })],
  [800, set({ click: true, selected: 'e1' })],
  [180, set({ click: false })],
  [1500, set({ cursor: 'skip-e1' })],
  [800, set({ click: true })],
  [180, s => status('e1', 'skipped')(set({ click: false, selected: 'e2' })(s))],
  [900, set({ cursor: 'add-e2' })],
  [800, set({ click: true })],
  [180, s => status('e2', 'adding')(set({ click: false })(s))],
  [700, status('e2', 'added')],
  [600, set({ phase: 'done', cursor: null })],
  [3600, () => INITIAL],
];

function Phone({ phase }) {
  return (
    <div className="demo-phone" data-phase={phase}>
      <span className="demo-phone-notch" />
      {phase === 'pick' && (
        <div className="demo-phone-screen">
          <p className="demo-phone-head"><span>Cancel</span><b>Recents</b><span /></p>
          <div className="demo-roll">
            {ROLL.map((tile, index) => (
              <span key={index} className={`demo-tile demo-tile-${tile.kind} ${tile.tone ? `tone-${tile.tone}` : ''}`} data-picked={Boolean(tile.source)} style={{ '--pick': ROLL.slice(0, index).filter(t => t.source).length }}>
                {tile.source && <i className="demo-tile-check">✓</i>}
              </span>
            ))}
          </div>
          <span className="demo-phone-btn demo-tap">Add 3 screenshots</span>
        </div>
      )}
      {phase !== 'pick' && (
        <div className="demo-phone-screen">
          <p className="demo-phone-brand">Booked and Busy<span className="brand-dot">.</span></p>
          <p className="demo-phone-title">{phase === 'extract' ? 'Finding your events…' : '3 events found'}</p>
          <ul className="demo-uploads">
            {UPLOADS.map((item, index) => (
              <li key={item.source} style={{ '--i': index }}>
                <span className={`demo-upload-thumb thumb-${item.source.toLowerCase()}`} />
                <div><b>{item.label}</b><small>{item.source}</small></div>
                <i className="demo-upload-status" />
              </li>
            ))}
          </ul>
          <div className="demo-phone-progress"><span /></div>
          {phase === 'extract'
            ? <span className="demo-phone-btn is-busy">Extracting events…</span>
            : <p className="demo-phone-synced">✓ Saved to your account<small>Review on any device</small></p>}
        </div>
      )}
    </div>
  );
}

function hourLabel(hour) {
  const h = hour % 24;
  return `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
}

function DayView({ day, state }) {
  const info = DAYS[day];
  const proposed = EVENTS.filter(event => event.day === day && state.status[event.id] !== 'skipped');
  const top = hour => `calc(var(--h) * ${hour - START_HOUR})`;
  const height = (start, end) => `calc(var(--h) * ${end - start} - 2px)`;
  const conflict = proposed.some(event => event.id === 'e1');

  return (
    <div className="demo-day">
      <p className="demo-day-heading">{info.label}</p>
      <div className="demo-day-grid" style={{ height: `calc(var(--h) * ${END_HOUR - START_HOUR})` }}>
        {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
          <span key={i} className="demo-hour" style={{ top: `calc(var(--h) * ${i})` }}>{hourLabel(START_HOUR + i)}</span>
        ))}
        {info.existing.map(event => {
          const split = event.overlaps && conflict;
          return (
            <div key={event.title} className="demo-event" style={{ top: top(event.start), height: height(event.start, event.end), background: event.color, ...(split && { left: '50%' }) }}>
              <strong>{event.title}</strong>
            </div>
          );
        })}
        {proposed.map(event => {
          const added = state.status[event.id] === 'added';
          const focused = state.selected === event.id;
          const split = event.id === 'e1';
          return (
            <div key={event.id} className={`demo-event ${added ? 'demo-event-added' : 'demo-event-proposed'}`} data-focused={focused && !added} style={{ top: top(event.start), height: height(event.start, event.end), ...(split && { right: '50%' }) }}>
              <strong>{event.title}</strong>
              <span>{event.time}</span>
            </div>
          );
        })}
        {conflict && state.selected === 'e1' && (
          <span className="demo-overlap-flag" style={{ top: `calc(var(--h) * ${16.5 - START_HOUR} - 11px)` }} aria-hidden="true">overlap</span>
        )}
      </div>
    </div>
  );
}

export default function ReviewDemo() {
  const [state, setState] = useState(INITIAL);
  const [playing, setPlaying] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: '72%', y: '82%' });
  const step = useRef(0);
  const frame = useRef(null);
  const visible = useRef(false);
  const userPaused = useRef(false);

  // Autoplay only while on screen, and never for people who prefer reduced motion.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      userPaused.current = true;
      setState({ ...INITIAL, phase: 'review', selected: 'e1', status: { e0: 'added', e1: 'idle', e2: 'idle' } });
      return;
    }
    // "On screen" means a good chunk of the viewport shows the demo. Measuring
    // against the viewport (not the demo's own height) keeps it playing on
    // phones, where the stacked review screen is taller than the screen.
    const observer = new IntersectionObserver(([entry]) => {
      const viewport = entry.rootBounds?.height || window.innerHeight;
      const needed = 0.35 * Math.min(entry.boundingClientRect.height, viewport);
      const onScreen = entry.isIntersecting && entry.intersectionRect.height >= needed;
      visible.current = onScreen;
      if (!userPaused.current) setPlaying(onScreen);
    }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const [delay, apply] = TIMELINE[step.current];
    const timer = setTimeout(() => {
      setState(apply);
      step.current = (step.current + 1) % TIMELINE.length;
    }, delay);
    return () => clearTimeout(timer);
  }, [playing, state]);

  const placeCursor = useCallback(() => {
    if (!state.cursor || !frame.current) return;
    const target = frame.current.querySelector(`[data-target="${state.cursor}"]`);
    if (!target) return;
    const box = frame.current.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    setCursorPos({ x: rect.left - box.left + Math.min(rect.width * 0.55, 60), y: rect.top - box.top + rect.height * 0.6 });
  }, [state.cursor]);

  useLayoutEffect(placeCursor, [placeCursor, state.status]);
  useEffect(() => {
    window.addEventListener('resize', placeCursor);
    return () => window.removeEventListener('resize', placeCursor);
  }, [placeCursor]);

  function toggle() {
    if (playing) {
      userPaused.current = true;
      setPlaying(false);
    } else {
      userPaused.current = false;
      setPlaying(true);
    }
  }

  function restart() {
    step.current = 0;
    userPaused.current = false;
    setState(INITIAL);
    setPlaying(true);
  }

  const selected = EVENTS.find(event => event.id === state.selected);
  const reviewing = ['handoff', 'review', 'done'].includes(state.phase);
  const onPhone = PHONE_PHASES.includes(state.phase);
  const added = Object.values(state.status).filter(value => value === 'added').length;
  const skipped = Object.values(state.status).filter(value => value === 'skipped').length;
  const phaseIndex = STEP_OF[state.phase];

  return (
    <div className="demo">
      <div className="demo-window" ref={frame} data-phase={state.phase}>
        <div className="demo-chrome" aria-hidden="true">
          <span className="demo-dots"><i /><i /><i /></span>
          <span className="demo-url">calendar-assistant-tau.vercel.app/upload</span>
        </div>

        <div className="demo-body" aria-hidden="true">
          {!reviewing && (
            <div className="demo-waiting">
              <div className="demo-review-head">
                <p className="demo-title">Review events</p>
                <span className="demo-link">Upload more screenshots</span>
              </div>
              <div className="demo-empty" data-incoming={state.phase === 'sync'}>
                <span className="demo-empty-icon">{state.phase === 'sync' ? '↓' : '💻'}</span>
                <p>{state.phase === 'sync' ? '3 events syncing from your phone…' : 'Waiting for screenshots from your phone'}</p>
              </div>
            </div>
          )}

          {reviewing && (
            <div className="demo-review">
              <div className="demo-review-head">
                <p className="demo-title">Review events</p>
                <span className="demo-link">Upload more screenshots</span>
              </div>
              <div className="demo-review-layout">
                <div className="demo-list">
                  {['thu', 'sat'].map(day => (
                    <div key={day} className="demo-group">
                      <p className="demo-divider">{DAYS[day].label}</p>
                      {EVENTS.filter(event => event.day === day).map((event, index) => {
                        const value = state.status[event.id];
                        return (
                          <div key={event.id} className="demo-card" data-selected={state.selected === event.id} data-status={value} style={{ '--i': index + (day === 'sat' ? 1 : 0) }}>
                            <div className="demo-card-inner">
                              <div className="demo-card-heading">
                                <span className="demo-card-title" data-target={`title-${event.id}`}>{event.title}</span>
                                <span className="demo-from">from {event.from}</span>
                              </div>
                              <div className="demo-meta">
                                <span><b>{event.date}</b></span>
                                <span>{event.time}</span>
                                <span>{event.where}</span>
                              </div>
                              {value === 'added' ? (
                                <p className="demo-added">✓ Added to Google Calendar</p>
                              ) : (
                                <div className="demo-actions">
                                  <span className="demo-add" data-target={`add-${event.id}`}>{value === 'adding' ? 'Adding…' : 'Add to calendar'}</span>
                                  <span className="demo-skip" data-target={`skip-${event.id}`}>Skip this</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="demo-calendar">
                  <p className="demo-calendar-title">Your calendar</p>
                  <DayView day={selected.day} state={state} />
                </div>
              </div>
            </div>
          )}

          {onPhone && <div className="demo-scrim" data-leaving={state.phase === 'handoff'} />}
          {onPhone && <Phone phase={state.phase} />}
          {(state.phase === 'sync') && <span className="demo-sync-pill">✓ Synced to your laptop</span>}

          {state.phase === 'done' && (
            <div className="demo-toast">
              <span className="demo-toast-spark" aria-hidden="true">✳</span>
              <strong>{added} plans booked</strong>
              <span>{skipped} skipped · 0 typed by hand</span>
            </div>
          )}

          {state.cursor && (
            <svg className="demo-cursor" data-click={state.click} style={{ transform: `translate(${typeof cursorPos.x === 'number' ? `${cursorPos.x}px` : cursorPos.x}, ${typeof cursorPos.y === 'number' ? `${cursorPos.y}px` : cursorPos.y})` }} width="26" height="30" viewBox="0 0 26 30">
              <path d="M3 2 L3 24 L9 18.5 L13.5 28 L17.5 26.2 L13 17 L21 17 Z" fill="#172536" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      <div className="demo-controls">
        <ol className="demo-steps">
          {STEPS.map((label, index) => (
            <li key={label} data-active={index === phaseIndex} data-past={index < phaseIndex}>
              <span>{index + 1}</span>{label}
            </li>
          ))}
        </ol>
        <div className="demo-buttons">
          <button type="button" onClick={toggle} aria-label={playing ? 'Pause demo' : 'Play demo'}>{playing ? '❚❚ Pause' : '▶ Play'}</button>
          <button type="button" onClick={restart} aria-label="Restart demo">↺ Restart</button>
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">{`Demo: ${STEPS[phaseIndex]}.`}</p>
    </div>
  );
}
