// The dashboard's form widgets, served as /admin-widgets.js: the sun bar and the duration boxes.
// They keep their value in hidden inputs (data-field), so admin.client.js reads them like any field.
// Everything is set up once, with listeners on the document, so rows added later need no setup.
import { setUpDurations } from './duration'
import { setUpSunWindows } from './sun-window'

declare global {
  interface Window {
    __adminWidgets?: boolean
  }
}

// Several fields each render the script tag; set up only once
if (!window.__adminWidgets) {
  window.__adminWidgets = true
  const start = () => {
    setUpDurations()
    setUpSunWindows()
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
}
