export const MARKER_TYPES = [
  { id: 'speech', label: 'Speech bubbles', desc: 'Normal dialogue inside a bubble', prefix: '"', suffix: '"' },
  { id: 'continue', label: 'Continued dialogue', desc: 'Dialogue continuing across bubbles', prefix: '//', suffix: '' },
  { id: 'box', label: 'Boxes', desc: 'Caption / narration in a box', prefix: '[', suffix: ']' },
  { id: 'thought', label: 'Thoughts', desc: 'Internal thoughts', prefix: '(', suffix: ')' },
  { id: 'screen', label: 'Screen text', desc: 'Phone / computer / sign text', prefix: '**', suffix: '**' },
  { id: 'sfx', label: 'Sound effects', desc: 'SFX / onomatopoeia', prefix: 'SFX: ', suffix: '' },
  { id: 'shout', label: 'Shout bubbles', desc: 'Yelling / spiky bubbles', prefix: '::', suffix: '' },
  { id: 'system', label: 'System text', desc: 'Game / system messages', prefix: '<>', suffix: '' },
  { id: 'smalltext', label: 'Small text', desc: 'Side annotations / margin notes', prefix: 'ST: ', suffix: '' },
  { id: 'outertext', label: 'Outer text', desc: 'Narration / titles outside bubbles', prefix: 'OT: ', suffix: '' },
  { id: 'tlnote', label: "Translator's note", desc: 'Existing TL note in the image', prefix: 'TL/N: ', suffix: '' }
];

export const DEFAULT_MARKERS = MARKER_TYPES.reduce((acc, t) => {
  acc[t.id] = { prefix: t.prefix, suffix: t.suffix };
  return acc;
}, {});

const KEY = 'mangaocr_markers';

export function getMarkers() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...DEFAULT_MARKERS, ...saved };
  } catch {
    return { ...DEFAULT_MARKERS };
  }
}

export function saveMarkers(markers) {
  localStorage.setItem(KEY, JSON.stringify(markers));
}