'use client';

import { useEffect, useRef, useState } from 'react';

const MAX_FILES = 10;
const MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export default function ScreenshotPicker() {
  const [screenshots, setScreenshots] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const processing = useRef(false);
  const mounted = useRef(true);
  const urls = useRef(new Set());

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
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
        errors.push(`${file.name} must be a PNG, JPG, or WebP image up to 10 MB.`);
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
        added.push({ id: crypto.randomUUID(), name: file.name, url });
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
        <p className="upload-limits">PNG, JPG, or WebP · Up to 10 images · 10 MB each</p>
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <p className="upload-note">Preview your screenshots here. They stay in this tab until you leave or refresh. Automatic event extraction and saving are coming next.</p>
      <p aria-live="polite">{screenshots.length > 0 && `${screenshots.length} screenshot${screenshots.length === 1 ? '' : 's'} selected`}</p>
      <ul className="screenshot-grid">
        {screenshots.map(image => (
          <li key={image.id}>
            <a href={image.url} target="_blank" rel="noreferrer" aria-label={`Open full preview of ${image.name}`}><img src={image.url} alt={`Screenshot preview of ${image.name}`} /></a>
            <div><span>{image.name}</span><button type="button" onClick={() => removeScreenshot(image.id)} aria-label={`Remove ${image.name}`}>Remove</button></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
