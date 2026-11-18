'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/*
 * An animated, self-contained recreation of the real review screen
 * (app/upload/event-review.js). It uses made-up sample events and never
 * touches the API — it only exists to show visitors how the flow feels.
 */

const START_HOUR = 9;
const END_HOUR = 24;

const SHOTS = [
  { id: 's0', kind: 'chat', source: 'GroupMe', from: 'Club Soccer 🥅', lines: ['IM game vs Delta this Sat 4pm, field 3', 'be there!! 🔥'] },
  { id: 's1', kind: 'invite', source: 'Flare', title: '✨ Fall Formal', meta: ['Sat, Nov 22 · 9 PM', 'The Boathouse'] },
  { id: 's2', kind: 'email', source: 'Email', from: 'Prof. Diaz', subject: 'Office hours moved', lines: ['This week only: Thu 3–4pm', 'Hamilton Hall 312'] },
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
    { title: 'Brunch w/ roommates', start: 11, end: 12, color: '#e8a800' },
    { title: 'Chem study group', start: 16.5, end: 18, color: '#8e24aa', overlaps: 'e1' },
  ] },
};

const CAPTIONS = {
  upload: 'Drop in screenshots from anywhere',
  scan: 'Booked and Busy reads the details',
  review: 'Check each plan against your real calendar',
  done: 'Add it in one click — or skip it',
};

const INITIAL = { phase: 'upload', selected: 'e0', status: { e0: 'idle', e1: 'idle', e2: 'idle' }, cursor: null, click: false };

const set = patch => state => ({ ...state, ...patch });
const status = (id, value) => state => ({ ...state, status: { ...state.status, [id]: value } });

const TIMELINE = [
  [1900, set({ phase: 'scan' })],
  [2000, set({ phase: 'review', selected: 'e0' })],
  [1300, set({ cursor: 'add-e0' })],
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

function Shot({ shot, index }) {
  return (
    <figure className={`demo-shot demo-shot-${shot.kind}`} style={{ '--i': index }}>
      <figcaption>{shot.source}</figcaption>
      {shot.kind === 'chat' && <>
        <p className="demo-shot-from"><span aria-hidden="true">👥</span>{shot.from}</p>
        {shot.lines.map(line => <p key={line} className="demo-bubble">{line}</p>)}
      </>}
      {shot.kind === 'invite' && <>
        <div className="demo-invite-art" aria-hidden="true" />
        <p className="demo-invite-title">{shot.title}</p>
        {shot.meta.map(line => <p key={line} className="demo-invite-meta">{line}</p>)}
        <span className="demo-rsvp">RSVP</span>
      </>}
      {shot.kind === 'email' && <>
        <p className="demo-shot-from"><span aria-hidden="true">✉️</span>{shot.from}</p>
        <p className="demo-email-subject">{shot.subject}</p>
        {shot.lines.map(line => <p key={line} className="demo-email-line">{line}</p>)}
      </>}
    </figure>
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
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      if (!userPaused.current) setPlaying(entry.isIntersecting);
    }, { threshold: 0.35 });
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
  const reviewing = state.phase === 'review' || state.phase === 'done';
  const added = Object.values(state.status).filter(value => value === 'added').length;
  const skipped = Object.values(state.status).filter(value => value === 'skipped').length;
  const phaseIndex = ['upload', 'scan', 'review', 'done'].indexOf(state.phase);

  return (
    <div className="demo">
      <div className="demo-window" ref={frame} data-phase={state.phase}>
        <div className="demo-chrome" aria-hidden="true">
          <span className="demo-dots"><i /><i /><i /></span>
          <span className="demo-url">calendar-assistant-tau.vercel.app/upload</span>
        </div>

        <div className="demo-body" aria-hidden="true">
          {!reviewing && (
            <div className="demo-upload">
              <p className="demo-eyebrow">STEP 1 · UPLOAD</p>
              <p className="demo-title">Start with a screenshot.</p>
              <div className="demo-shots">
                {SHOTS.map((shot, index) => <Shot key={shot.id} shot={shot} index={index} />)}
              </div>
              <div className="demo-progress"><span /></div>
              <p className="demo-progress-label">{state.phase === 'scan' ? 'Finding events in 3 screenshots…' : '3 screenshots selected'}</p>
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
          {['upload', 'scan', 'review', 'done'].map((phase, index) => (
            <li key={phase} data-active={index === phaseIndex} data-past={index < phaseIndex}>
              <span>{index + 1}</span>{CAPTIONS[phase]}
            </li>
          ))}
        </ol>
        <div className="demo-buttons">
          <button type="button" onClick={toggle} aria-label={playing ? 'Pause demo' : 'Play demo'}>{playing ? '❚❚ Pause' : '▶ Play'}</button>
          <button type="button" onClick={restart} aria-label="Restart demo">↺ Restart</button>
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">{`Demo: ${CAPTIONS[state.phase]}.`}</p>
    </div>
  );
}
