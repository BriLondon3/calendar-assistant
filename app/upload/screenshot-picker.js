'use client';

import { useEffect, useRef, useState } from 'react';
import EventReview from './event-review';

const MAX_FILES = 10;
const MAX_BYTES = 3 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export default function ScreenshotPicker() {
  const [screenshots, setScreenshots] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [events, setEvents] = useState([]);
  const [progress, setProgress] = useState('');
  const extractionRequest = useRef(null);
  const processing = useRef(false);
  const mounted = useRef(true);
  const urls = useRef(new Set());

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
    setEvents(current => current.filter(item => item.screenshotId !== id));
  }

  async function extractEvents() {
    if (processing.current) return;
    processing.current = true;
    setBusy(true);
    setError('');
    const pending = screenshots.filter(image => image.status !== 'done');
    const failures = [];

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
        const response = await fetch('/api/extract', { method: 'POST', body: form, signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Couldn’t process this screenshot.');
        if (!mounted.current) break;
        const suggestions = data.events.map(event => ({ ...event, id: crypto.randomUUID(), screenshotId: image.id, source: image.name }));
        setEvents(current => [...current, ...suggestions]);
        setScreenshots(current => current.map(item => item.id === image.id ? { ...item, status: 'done', count: suggestions.length } : item));
      } catch (error) {
        if (controller.signal.aborted) break;
        failures.push(`${image.name}: ${error.message}`);
      }
    }
    processing.current = false;
    if (mounted.current) {
      setBusy(false);
      setProgress('');
      setError(failures.join(' '));
    }
  }

  return (
    <div>
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
      {error && <p className="auth-error" role="alert">{error}</p>}
      <p className="upload-note">Extract events sends your selected screenshots to Google Gemini to read the event details. Screenshots and edits stay in this tab until you leave or refresh.</p>
      {screenshots.some(image => image.status !== 'done') && <button className="primary-button" type="button" disabled={busy} onClick={extractEvents}>{busy ? 'Working…' : 'Extract events'}</button>}
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
      {events.length > 0 && <EventReview events={events} onChange={(id, field, value) => setEvents(current => current.map(event => event.id === id ? { ...event, [field]: value } : event))} onReject={id => setEvents(current => current.filter(event => event.id !== id))} />}
    </div>
  );
}
