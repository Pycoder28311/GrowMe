// The sun bar (SunWindow in ui/sun-window.tsx): the hours a plant wants sun, on a 00:00–24:00 bar.
// Drag an edge to change it, or the coloured span to move the whole window (pointer: mouse and
// touch); the keyboard works on both. Whole hours, at least one. The two hidden inputs hold the
// value (both empty = not set).
import { SUN_PART_LABELS, sunLength, sunPart } from '../../packages/shared/src/plant-fields'

type Window = { start: number; end: number }

const HOURS = 24
/** «Όρισε ώρες ήλιου» places this window */
const DEFAULT: Window = { start: 10, end: 16 }

const clock = (hour: number) => `${String(hour).padStart(2, '0')}:00`
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))

const parts = (bar: HTMLElement) => ({
  start: bar.querySelector<HTMLInputElement>('input[data-field="sunStart"]')!,
  end: bar.querySelector<HTMLInputElement>('input[data-field="sunEnd"]')!,
  track: bar.querySelector<HTMLElement>('[data-track]')!,
  label: bar.querySelector<HTMLElement>('[data-sun-label]')!,
  handles: [...bar.querySelectorAll<HTMLElement>('[data-edge]')],
})

function read(bar: HTMLElement): Window | null {
  const { start, end } = parts(bar)
  if (start.value === '' || end.value === '') return null
  return { start: Number(start.value), end: Number(end.value) }
}

/** Draws the window: span position, handles' values, the label and the empty state */
function render(bar: HTMLElement) {
  const value = read(bar)
  const { track, label, handles } = parts(bar)
  bar.toggleAttribute('data-empty', value === null)
  if (!value) {
    label.textContent = 'Δεν ορίστηκε'
    return
  }
  track.style.setProperty('--from', `${(value.start / HOURS) * 100}%`)
  track.style.setProperty('--to', `${(value.end / HOURS) * 100}%`)
  for (const handle of handles) {
    const hour = handle.dataset.edge === 'start' ? value.start : value.end
    handle.setAttribute('aria-valuenow', String(hour))
    handle.setAttribute('aria-valuetext', clock(hour))
  }
  const hours = sunLength(value.start, value.end)!
  label.textContent = `${clock(value.start)} – ${clock(value.end)} · ${hours} ${hours === 1 ? 'ώρα' : 'ώρες'} · ${SUN_PART_LABELS[sunPart(value.start, value.end)]}`
}

/** Stores a window (null = not set), draws it and tells the form */
function write(bar: HTMLElement, value: Window | null) {
  const { start, end } = parts(bar)
  const before = `${start.value}-${end.value}`
  start.value = value ? String(value.start) : ''
  end.value = value ? String(value.end) : ''
  render(bar)
  if (`${start.value}-${end.value}` !== before) start.dispatchEvent(new Event('input', { bubbles: true }))
}

/** Moves one edge (`edge`) or the whole window (`span`) by `delta` hours, within the day */
function moved(value: Window, part: 'start' | 'end' | 'span', delta: number): Window {
  if (part === 'start') return { ...value, start: clamp(value.start + delta, 0, value.end - 1) }
  if (part === 'end') return { ...value, end: clamp(value.end + delta, value.start + 1, HOURS) }
  const shift = clamp(delta, -value.start, HOURS - value.end)
  return { start: value.start + shift, end: value.end + shift }
}

const barOf = (target: EventTarget | null) => (target as HTMLElement | null)?.closest?.<HTMLElement>('[data-sun-window]') ?? null
const partOf = (el: HTMLElement) => (el.dataset.edge as 'start' | 'end' | undefined) ?? (el.hasAttribute('data-span') ? 'span' : null)

/** The hour under the pointer, on the bar's track */
function hourAt(track: HTMLElement, clientX: number) {
  const box = track.getBoundingClientRect()
  return Math.round(((clientX - box.left) / box.width) * HOURS)
}

const KEYS: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -3, PageUp: 3 }

export function setUpSunWindows() {
  for (const bar of document.querySelectorAll<HTMLElement>('[data-sun-window]')) render(bar)

  // Dragging: the edge follows the pointer; the span keeps its length and moves by the hours dragged
  let drag: { bar: HTMLElement; part: 'start' | 'end' | 'span'; from: Window; startHour: number } | null = null

  document.addEventListener('pointerdown', (event) => {
    const el = (event.target as HTMLElement).closest?.<HTMLElement>('[data-edge], [data-span]')
    const bar = barOf(el)
    const value = bar && read(bar)
    if (!el || !bar || !value || event.button !== 0) return
    event.preventDefault()
    el.setPointerCapture(event.pointerId)
    el.focus()
    drag = { bar, part: partOf(el)!, from: value, startHour: hourAt(parts(bar).track, event.clientX) }
    bar.classList.add('dragging')
  })

  document.addEventListener('pointermove', (event) => {
    if (!drag) return
    const hour = hourAt(parts(drag.bar).track, event.clientX)
    const { from, part } = drag
    const next =
      part === 'span'
        ? moved(from, 'span', hour - drag.startHour)
        : moved(from, part, hour - (part === 'start' ? from.start : from.end))
    write(drag.bar, next)
  })

  const stop = () => {
    drag?.bar.classList.remove('dragging')
    drag = null
  }
  document.addEventListener('pointerup', stop)
  document.addEventListener('pointercancel', stop)

  document.addEventListener('keydown', (event) => {
    const el = event.target as HTMLElement
    const bar = barOf(el)
    const part = bar && el.matches?.('[data-edge], [data-span]') ? partOf(el) : null
    const value = bar && read(bar)
    if (!bar || !part || !value) return
    let next: Window | null = null
    if (event.key in KEYS) next = moved(value, part, KEYS[event.key])
    else if (event.key === 'Home') next = moved(value, part, -HOURS)
    else if (event.key === 'End') next = moved(value, part, HOURS)
    if (!next) return
    event.preventDefault()
    write(bar, next)
  })

  document.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest?.('[data-sun-set], [data-sun-clear]')
    const bar = barOf(button)
    if (!button || !bar) return
    const set = button.hasAttribute('data-sun-set')
    write(bar, set ? DEFAULT : null)
    bar.querySelector<HTMLElement>(set ? '[data-edge="start"]' : '[data-sun-set]')?.focus()
  })
}
