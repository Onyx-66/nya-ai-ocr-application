const KEYS = {
  format: 'mangaocr_default_format',
  translate: 'mangaocr_default_translate',
  language: 'mangaocr_default_language',
  serie: 'mangaocr_default_serie',
  emptyLine: 'mangaocr_empty_line'
};

export function getDefaults() {
  return {
    format: localStorage.getItem(KEYS.format) || 'md',
    translate: localStorage.getItem(KEYS.translate) === 'true',
    language: localStorage.getItem(KEYS.language) || 'English',
    serie: localStorage.getItem(KEYS.serie) || '',
    emptyLine: localStorage.getItem(KEYS.emptyLine) === 'true'
  };
}

export function setDefault(key, value) {
  localStorage.setItem(KEYS[key], String(value));
}