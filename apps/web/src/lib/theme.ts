export type Theme = 'light' | 'dark';

// Satu prefiks localStorage untuk seluruh preferensi (rafnas.*).
const KEY = 'rafnas.tema';

/** Terapkan pilihan tersimpan saat boot. Urutan: localStorage -> prefers-color-scheme -> terang. */
export function initTheme(): void {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch {
    /* localStorage bisa diblok — abaikan, ikut prefers-color-scheme */
  }
}

export function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* abaikan */
  }
  return next;
}
