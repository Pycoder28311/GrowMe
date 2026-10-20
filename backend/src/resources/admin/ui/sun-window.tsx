import { WidgetsScript } from './widgets-script'

/**
 * The hours a plant wants sun, as a bar from `min` to `max` (00:00–24:00 by default): drag an edge, or
 * the span to move the whole window (mouse, touch or keyboard). Sends `startField` / `endField` (whole
 * hours, both null when not set). A form can hold several bars. /admin-widgets.js
 * (admin-editor/sun-window.ts) runs it.
 */
export function SunWindow(props: {
  label: string
  startField: string
  endField: string
  start?: number | null
  end?: number | null
  min?: number
  max?: number
}) {
  const [min, max] = [props.min ?? 0, props.max ?? 24]
  const empty = props.start == null || props.end == null
  const ticks = Array.from({ length: Math.floor((max - min) / 3) + 1 }, (_, i) => min + i * 3)
  return (
    <div class="field sun-window" data-sun-window data-min={min} data-max={max} data-empty={empty ? '' : undefined}>
      <span class="caption">{props.label}</span>
      <input type="hidden" data-sun-start data-field={props.startField} data-type="number" value={empty ? '' : String(props.start)} />
      <input type="hidden" data-sun-end data-field={props.endField} data-type="number" value={empty ? '' : String(props.end)} />
      <div class="sun-track" data-track>
        <div class="sun-span" data-span tabindex={0} role="group" aria-label="Μετακίνηση όλου του διαστήματος (βέλη)" />
        <div class="sun-handle" data-edge="start" role="slider" tabindex={0} aria-label="Ήλιος από" aria-valuemin={min} aria-valuemax={max - 1} />
        <div class="sun-handle" data-edge="end" role="slider" tabindex={0} aria-label="Ήλιος έως" aria-valuemin={min + 1} aria-valuemax={max} />
      </div>
      <div class="sun-ticks" aria-hidden="true">
        {ticks.map((hour) => (
          <span style={`left: ${((hour - min) / (max - min)) * 100}%`}>{String(hour).padStart(2, '0')}</span>
        ))}
      </div>
      <p class="small sun-label" data-sun-label aria-live="polite" />
      <div class="row sun-buttons">
        <button type="button" class="chip-button" data-sun-set>
          Όρισε ώρες
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
