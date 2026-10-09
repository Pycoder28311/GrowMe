import { WidgetsScript } from './widgets-script'

const TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 24]

/**
 * The hours a plant wants sun, as a bar from 00:00 to 24:00: drag an edge, or the span to move the
 * whole window (mouse, touch or keyboard). Sends `sunStart` / `sunEnd` (whole hours, both null when
 * not set). /admin-widgets.js (admin-editor/sun-window.ts) runs it.
 */
export function SunWindow(props: { label: string; start?: number | null; end?: number | null }) {
  const empty = props.start == null || props.end == null
  return (
    <div class="field sun-window" data-sun-window data-empty={empty ? '' : undefined}>
      <span class="caption">{props.label}</span>
      <input type="hidden" data-field="sunStart" data-type="number" value={empty ? '' : String(props.start)} />
      <input type="hidden" data-field="sunEnd" data-type="number" value={empty ? '' : String(props.end)} />
      <div class="sun-track" data-track>
        <div class="sun-span" data-span tabindex={0} role="group" aria-label="Μετακίνηση όλου του διαστήματος (βέλη)" />
        <div class="sun-handle" data-edge="start" role="slider" tabindex={0} aria-label="Ήλιος από" aria-valuemin="0" aria-valuemax="23" />
        <div class="sun-handle" data-edge="end" role="slider" tabindex={0} aria-label="Ήλιος έως" aria-valuemin="1" aria-valuemax="24" />
      </div>
      <div class="sun-ticks" aria-hidden="true">
        {TICKS.map((hour) => (
          <span style={`left: ${(hour / 24) * 100}%`}>{String(hour).padStart(2, '0')}</span>
        ))}
      </div>
      <p class="small sun-label" data-sun-label aria-live="polite" />
      <div class="row sun-buttons">
        <button type="button" class="chip-button" data-sun-set>
          Όρισε ώρες ήλιου
        </button>
        <button type="button" class="chip-button" data-sun-clear>
          ✕ Καθαρισμός
        </button>
      </div>
      <WidgetsScript />
      <p class="error" aria-live="polite" />
    </div>
  )
}
