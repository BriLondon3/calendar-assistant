// Color themes a signed-in user can choose. The colors themselves live in
// globals.css under html[data-theme="…"]; these are the names and the
// swatches shown in the picker. Fonts are the same in every theme.
export const THEMES = [
  { id: 'default', name: 'Booked and Busy', description: 'Our classic blue and orange on cream.', swatches: ['#faf7f1', '#172536', '#1677ed', '#ff7b24'] },
  { id: 'varsity', name: 'Varsity', description: 'Navy, crimson and gold. School spirit.', swatches: ['#fbf8f0', '#14213d', '#c8102e', '#f2b705'] },
  { id: 'golden', name: 'Golden Hour', description: 'Warm rose, peach and plum.', swatches: ['#fff5f1', '#2e1a47', '#d6336c', '#ffb38a'] },
  { id: 'night', name: 'Night Out', description: 'Dark mode with neon coral and aqua.', swatches: ['#10111f', '#f4f2ff', '#ff6b5b', '#3ee0d0'] },
];

export function validTheme(value) {
  return THEMES.some(theme => theme.id === value) ? value : 'default';
}
