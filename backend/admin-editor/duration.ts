// The duration boxes (DurationField in ui/fields.tsx): a number and a unit, or with «Εύρος» a from–to
// range, kept as «2 years» / «4-6 weeks» in the field's hidden input (empty = null).
// Typing "-" in the first number opens the range; Backspace in an empty second number closes it.
import { formatDuration, type DurationUnit } from '../../packages/shared/src/plant-fields'

const parts = (box: HTMLElement) => ({
  hidden: box.querySelector<HTMLInputElement>('input[type=hidden][data-field]')!,
  from: box.querySelector<HTMLInputElement>('[data-duration-from]')!,
  to: box.querySelector<HTMLInputElement>('[data-duration-to]')!,
  unit: box.querySelector<HTMLSelectElement>('[data-duration-unit]')!,
  toggle: box.querySelector<HTMLButtonElement>('[data-duration-range]')!,
})

const isRange = (box: HTMLElement) => box.hasAttribute('data-range')
const number = (input: HTMLInputElement) => (input.value.trim() === '' ? null : Number(input.value))

/**
 * Writes the hidden value and tells the form (dirty flag, error clearing). A range that isn't one
 * (e.g. 6–4) is still sent as typed, so the server's message shows under the box.
 */
function write(box: HTMLElement) {
  const { hidden, from, to, unit } = parts(box)
  const first = number(from)
  const second = isRange(box) ? number(to) : null
  const value =
    first === null
      ? ''
      : second === null
        ? formatDuration({ from: first, to: null, unit: unit.value as DurationUnit })
        : `${first}-${second} ${unit.value}`
  if (hidden.value === value) return
  hidden.value = value
  hidden.dispatchEvent(new Event('input', { bubbles: true }))
}

function setRange(box: HTMLElement, on: boolean) {
  const { from, to, toggle } = parts(box)
  box.toggleAttribute('data-range', on)
  toggle.setAttribute('aria-pressed', String(on))
  from.setAttribute('aria-label', from.getAttribute('aria-label')!.replace(/: (από|αριθμός)$/, on ? ': από' : ': αριθμός'))
  if (on) to.focus()
  else {
    to.value = ''
    from.focus()
    const end = from.value.length
    // Number inputs don't support selection ranges; text-like browsers that do get the caret at the end
    try {
      from.setSelectionRange(end, end)
    } catch {}
  }
  write(box)
}

const boxOf = (target: EventTarget | null) => (target as HTMLElement | null)?.closest?.<HTMLElement>('[data-duration]') ?? null

export function setUpDurations() {
  document.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest?.('[data-duration-range]')
    const box = boxOf(button)
    if (box) setRange(box, !isRange(box))
  })

  document.addEventListener('input', (event) => {
    const box = boxOf(event.target)
    if (box && !(event.target as HTMLElement).matches('input[type=hidden]')) write(box)
  })
  document.addEventListener('change', (event) => {
    const box = boxOf(event.target)
    if (box && (event.target as HTMLElement).matches('[data-duration-unit]')) write(box)
  })

  document.addEventListener('keydown', (event) => {
    const target = event.target as HTMLInputElement
    const box = boxOf(target)
    if (!box) return
    if (target.matches('[data-duration-from]') && event.key === '-') {
      event.preventDefault() // the dash is the range's, not a negative number
      if (!isRange(box)) setRange(box, true)
      else parts(box).to.focus()
    } else if (target.matches('[data-duration-to]') && event.key === 'Backspace' && target.value === '') {
      event.preventDefault() // deleting the dash: back to one number
      setRange(box, false)
    }
  })
}
