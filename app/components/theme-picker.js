'use client';

import { useState } from 'react';
import { THEMES } from '../themes';
import { saveTheme } from '../account/theme-actions';

// Pick a color theme. Hovering or focusing an option previews the homepage in
// that palette; clicking applies it right away and saves it to the account.
export default function ThemePicker({ current = 'default' }) {
  const [selected, setSelected] = useState(current);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const shown = preview || selected;
  const shownTheme = THEMES.find(theme => theme.id === shown);

  async function choose(id) {
    if (saving || id === selected) return;
    const previous = selected;
    setSelected(id);
    setSaving(true);
    setStatus('Saving…');
    document.documentElement.dataset.theme = id;
    const result = await saveTheme(id).catch(() => ({ error: 'Couldn’t save your colors. Try again.' }));
    setSaving(false);
    if (result?.error) {
      setSelected(previous);
      document.documentElement.dataset.theme = previous;
      setStatus(result.error);
    } else {
      setStatus(`Saved. You’re using ${THEMES.find(theme => theme.id === id).name}.`);
    }
  }

  return (
    <div className="theme-picker">
      <div className="theme-options" role="radiogroup" aria-label="Color theme">
        {THEMES.map(theme => (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={selected === theme.id}
            className="theme-option"
            disabled={saving}
            onMouseEnter={() => setPreview(theme.id)}
            onMouseLeave={() => setPreview(null)}
            onFocus={() => setPreview(theme.id)}
            onBlur={() => setPreview(null)}
            onClick={() => choose(theme.id)}
          >
            <span className="theme-swatches" aria-hidden="true">{theme.swatches.map(color => <i key={color} style={{ background: color }} />)}</span>
            <span className="theme-text">
              <strong>{theme.name}</strong>
              <span>{theme.description}</span>
            </span>
            <span className="theme-check" aria-hidden="true">{selected === theme.id ? '✓' : ''}</span>
          </button>
        ))}
      </div>
      <figure className="theme-preview">
        <div className="theme-preview-frame">
          {THEMES.map(theme => (
            <img key={theme.id} src={`/themes/${theme.id}.jpg`} alt={theme.id === shown ? `The Booked and Busy homepage in the ${theme.name} colors` : ''} width="960" height="600" data-shown={theme.id === shown} />
          ))}
        </div>
        <figcaption>{preview && preview !== selected ? `Previewing ${shownTheme.name}` : `Your colors: ${shownTheme.name}`}</figcaption>
      </figure>
      <p className="theme-status" role="status">{status}</p>
    </div>
  );
}
