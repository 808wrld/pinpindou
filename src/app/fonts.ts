const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;700&family=Geist:wght@300;400;500;600;700;800;900&display=swap'

/**
 * Load the web fonts without blocking the first render.
 *
 * A <link rel="stylesheet"> in index.html is render-blocking: where Google
 * Fonts is slow or unreachable (e.g. mainland China) the page stayed blank
 * until the request timed out. A stylesheet inserted from script doesn't
 * block rendering, so the fallback stacks in tailwind.config.js show
 * immediately and the web fonts swap in once they arrive. Done from script
 * rather than an inline onload handler so a strict CSP can forbid inline JS.
 */
export function loadWebFonts(): void {
  if (typeof document === 'undefined' || document.querySelector(`link[href="${FONTS_URL}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = FONTS_URL
  document.head.appendChild(link)
}
