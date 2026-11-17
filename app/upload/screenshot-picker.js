'use client';

import { useEffect, useRef, useState } from 'react';
import EventReview from './event-review';

async function queueRequest(method = 'GET', body) {
  const response = await fetch('/api/review', {
    method, cache: 'no-store',
    ...(body && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Couldn’t sync your review queue.');
  return result;
}

const MAX_FILES = 10;
const MAX_BYTES = 3 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export default function ScreenshotPicker() {
  const [screenshots, setScreenshots] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [events, setEvents] = useState([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const reviewing = reviewOpen && events.length > 0;
  const [progress, setProgress] = useState('');
  const [syncError, setSyncError] = useState('');
  const queueRevision = useRef(0);
  const writing = useRef(false);
  const unsavedExtractions = useRef(new Map());
  const extractionRequest = useRef(null);
  const processing = useRef(false);
  const mounted = useRef(true);
  const urls = useRef(new Set());

  async function refreshQueue() {
    if (writing.current) return;
    const revision = ++queueRevision.current;
    try {
      const { events } = await queueRequest();
      if (mounted.current && revision === queueRevision.current) {
        setEvents(events);
        setSyncError('');
      }
    } catch (error) {
      if (mounted.current && revision === queueRevision.current) setSyncError(error.message);
    }
  }

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') refreshQueue();
    }
    refreshQueue();
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const interval = window.setInterval(refreshWhenVisible, 15000);
    return () => {
      queueRevision.current++;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  async function changeEvent(event, fields) {
    if (writing.current) throw new Error('Another change is syncing. Try again shortly.');
    writing.current = true;
    queueRevision.current++;
    try {
      const { event: updated } = await queueRequest(fields ? 'PATCH' : 'DELETE', {
        queueId: event.queueId, version: event.version, fields,
      });
      setEvents(current => updated
        ? current.map(item => item.queueId === event.queueId ? updated : item)
        : current.filter(item => item.queueId !== event.queueId));
      return updated;
    } finally {
      writing.current = false;
      void refreshQueue();
    }
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      extractionRequest.current?.abort();
      urls.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  async function addFiles(files) {
    if (processing.current) return;
    processing.current = true;
    setBusy(true);
    setError('');
    const added = [];
    const errors = [];
    for (const file of files) {
      if (screenshots.length + added.length >= MAX_FILES) {
        errors.push('Choose up to 10 screenshots at a time.');
        break;
      }
      if (!IMAGE_TYPES.includes(file.type) || file.size > MAX_BYTES || file.size === 0) {
        errors.push(`${file.name} must be a PNG, JPG, or WebP image up to 3 MB.`);
        continue;
      }
      const url = URL.createObjectURL(file);
      try {
        const image = new Image();
        image.src = url;
        await image.decode();
        if (!mounted.current) {
          URL.revokeObjectURL(url);
          break;
        }
        urls.current.add(url);
        added.push({ id: crypto.randomUUID(), name: file.name, url, file, status: 'ready' });
      } catch {
        URL.revokeObjectURL(url);
        errors.push(`${file.name} couldn’t be opened. Choose another image.`);
      }
    }
    processing.current = false;
    if (mounted.current) {
      setScreenshots(current => [...current, ...added]);
      setError(errors.join(' '));
      setBusy(false);
    }
  }

  function removeScreenshot(id) {
    const image = screenshots.find(item => item.id === id);
    URL.revokeObjectURL(image.url);
    urls.current.delete(image.url);
    setScreenshots(current => current.filter(item => item.id !== id));
    unsavedExtractions.current.delete(id);
  }

  async function extractEvents() {
    if (processing.current) return;
    processing.current = true;
    setBusy(true);
    setError('');
    const pending = screenshots.filter(image => image.status !== 'done');
    const failures = [];
    let foundEvents = false;

    for (const [index, image] of pending.entries()) {
      if (!mounted.current) break;
      setProgress(`Reading screenshot ${index + 1} of ${pending.length}…`);
      const form = new FormData();
      form.set('screenshot', image.file);
      form.set('timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);
      const now = new Date();
      form.set('referenceDate', `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
      const controller = new AbortController();
      extractionRequest.current = controller;
      try {
        let suggestions = unsavedExtractions.current.get(image.id);
        if (!suggestions) {
          const response = await fetch('/api/extract', { method: 'POST', body: form, signal: controller.signal });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Couldn’t process this screenshot.');
          suggestions = data.events;
          unsavedExtractions.current.set(image.id, suggestions);
        }
        if (suggestions.length) await queueRequest('POST', { events: suggestions });
        unsavedExtractions.current.delete(image.id);
        if (suggestions.length > 0) foundEvents = true;
        setScreenshots(current => current.map(item => item.id === image.id ? { ...item, status: 'done', count: suggestions.length } : item));
      } catch (error) {
        if (controller.signal.aborted) break;
        failures.push(`${image.name}: ${error.message}`);
      }
    }
    processing.current = false;
    if (mounted.current) {
      if (foundEvents) await refreshQueue();
      setBusy(false);
      setProgress('');
      setError(failures.join(' '));
      if (foundEvents) setReviewOpen(true);
    }
  }

  return (
    <div>
      <ol className="workflow" aria-label="Event workflow">
        <li aria-current={reviewing ? undefined : 'step'}><span>1</span>Upload screenshots</li>
        <li aria-current={reviewing ? 'step' : undefined}><span>2</span>Review events</li>
        <li><span>3</span>Add your plans</li>
      </ol>
      {reviewing && <EventReview events={events} onUploadMore={() => setReviewOpen(false)} onChange={changeEvent} onReject={changeEvent} />}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {syncError && <p role="status">{syncError} <button className="text-button" type="button" onClick={refreshQueue}>Retry sync</button></p>}
      <section hidden={reviewing} aria-labelledby="upload-heading">
        <h1 id="upload-heading">Start with a screenshot.</h1>
        <p className="upload-description">Choose screenshots from group chats, flyers, or invites. Make sure the event name, date, time, and location are visible.</p>
        <div className="upload-dropzone" onDragOver={event => event.preventDefault()} onDrop={event => {
          event.preventDefault();
          addFiles(Array.from(event.dataTransfer.files));
        }}>
          <span className="upload-symbol" aria-hidden="true">↑</span>
          <h2>Drop your screenshots here</h2>
          <p>or choose images from your device</p>
          <label className="primary-button file-picker">
            Choose screenshots
            <input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={busy} onChange={event => {
              addFiles(Array.from(event.target.files));
              event.target.value = '';
            }} />
          </label>
          <p className="upload-limits">PNG, JPG, or WebP · Up to 10 images · 3 MB each</p>
        </div>
        <p className="upload-note">Extract events sends your screenshots to Google Gemini. Extracted events sync to your account so you can review them on another device.</p>
        {screenshots.some(image => image.status !== 'done') && <button className="primary-button" type="button" disabled={busy} onClick={extractEvents}>{busy ? 'Working…' : 'Extract events'}</button>}
        {events.length > 0 && <button className="primary-button" type="button" disabled={busy} onClick={() => setReviewOpen(true)}>Review events ({events.length})</button>}
        <p role="status">{progress}</p>
        <p aria-live="polite">{screenshots.length > 0 && `${screenshots.length} screenshot${screenshots.length === 1 ? '' : 's'} selected`}</p>
        <ul className="screenshot-grid">
          {screenshots.map(image => (
            <li key={image.id}>
              <a href={image.url} target="_blank" rel="noreferrer" aria-label={`Open full preview of ${image.name}`}><img src={image.url} alt={`Screenshot preview of ${image.name}`} /></a>
              <div><span>{image.name}</span>{image.status === 'done' && <span>{image.count === 0 ? 'No events found. Try a clearer screenshot if details were missed.' : `${image.count} event suggestion(s) found`}</span>}<button type="button" disabled={busy} onClick={() => removeScreenshot(image.id)} aria-label={`Remove ${image.name}`}>Remove</button></div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
