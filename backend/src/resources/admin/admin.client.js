// The dashboard's browser script, served as /admin.js (plain JS, no build step). It works on the
// markup of resources/admin/ui: list pages' delete buttons (data-delete-item), forms (data-admin-form),
// lists (data-list, data-sortable), photos (data-images) and fields (data-field + data-type).
// The server validates everything again.
;(() => {
  'use strict'

  function toast(text, isError = false) {
    const el = document.createElement('div')
    el.className = isError ? 'toast error' : 'toast'
    el.setAttribute('role', 'status')
    el.textContent = text
    document.body.append(el)
    setTimeout(() => el.remove(), 2500)
  }

  // A message from the page before (saved / deleted), shown once after the redirect
  const message = sessionStorage.getItem('admin-toast')
  if (message) {
    sessionStorage.removeItem('admin-toast')
    toast(message)
  }

  /* ─────────────── List pages: delete one item ─────────────── */

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete-item]')
    if (!button || !confirm(button.dataset.confirm)) return
    button.disabled = true
    try {
      const res = await fetch(button.dataset.deleteItem, { method: 'DELETE', credentials: 'same-origin' })
      if (res.status !== 204) {
        const data = (res.headers.get('content-type') || '').includes('json') ? await res.json() : null
        toast(data?.code === 'NOT_FOUND' ? 'Έχει ήδη διαγραφεί. Ανανέωσε τη σελίδα.' : 'Η διαγραφή απέτυχε.', true)
        return
      }
      const items = button.closest('.items')
      button.closest('[data-item]').remove()
      if (items && !items.querySelector('[data-item]')) document.querySelector('[data-empty]')?.classList.remove('hidden')
      toast('Διαγράφηκε')
    } catch {
      toast('Δεν ήταν δυνατή η σύνδεση. Δοκίμασε ξανά.', true)
    } finally {
      button.disabled = false
    }
  })

  const form = document.querySelector('[data-admin-form]')
  if (!form) return
  const banner = form.querySelector('[data-banner]')
  let dirty = false

  /* ─────────────── Reading the form into JSON ─────────────── */

  /** The row or form an element belongs to (rows have their own keys) */
  const scopeOf = (el) => el.parentElement.closest('[data-row], [data-admin-form]')

  function readValue(input) {
    const type = input.dataset.type
    const raw = input.value.trim()
    if (type === 'bool') return input.checked
    if (type === 'number' || type === 'id') return raw === '' ? null : Number(raw)
    if (type === 'money') return raw === '' ? null : Math.round(Number(raw.replace(',', '.')) * 100)
    return raw === '' && input.hasAttribute('data-nullable') ? null : raw
  }

  /** The JSON of a form or a list row: its own fields, lists and photo lists */
  function collect(scope) {
    const data = {}
    for (const el of scope.querySelectorAll('[data-field], [data-list], [data-images]')) {
      if (scopeOf(el) !== scope) continue
      if (el.dataset.list !== undefined) {
        data[el.dataset.list] = rowsOf(el).map(collect)
      } else if (el.dataset.images !== undefined) {
        data[el.dataset.images] = rowsOf(el).map((row) => Number(row.dataset.imageId))
      } else if (el.type === 'radio') {
        if (el.checked) data[el.dataset.field] = readValue(el)
        else if (!(el.dataset.field in data)) data[el.dataset.field] = null
      } else {
        const value = readValue(el)
        if (el.dataset.type === 'id' && value === null) continue // new row: no id
        data[el.dataset.field] = value
      }
    }
    return data
  }

  const rowsOf = (list) => [...list.children].filter((el) => el.matches('[data-row]'))

  /* ─────────────── Showing the server's errors ─────────────── */

  function clearErrors() {
    banner.classList.add('hidden')
    banner.textContent = ''
    for (const field of form.querySelectorAll('.field.invalid')) field.classList.remove('invalid')
    for (const slot of form.querySelectorAll('.field .error')) slot.textContent = ''
  }

  /** The element for a path like "tips.2.title", "imageIds.1" or "name"; null when there is none */
  function findByPath(path) {
    let scope = form
    const parts = path.split('.')
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i]
      const own = [...scope.querySelectorAll('[data-field], [data-list], [data-images]')].filter(
        (el) => scopeOf(el) === scope,
      )
      const el = own.find((e) => e.dataset.field === key || e.dataset.list === key || e.dataset.images === key)
      if (!el) return null
      if (el.dataset.list !== undefined && i + 1 < parts.length) {
        const row = rowsOf(el)[Number(parts[++i])]
        if (!row) return el
        if (i + 1 === parts.length) return row
        scope = row
        continue
      }
      return el // a field, or a photo list (its error covers every photo)
    }
    return null
  }

  /** The server's (English) validation messages in Greek; unknown ones stay as they are */
  const GREEK = [
    [/^Too small: expected string/, 'Υποχρεωτικό πεδίο'],
    [/^Too big: expected string to have <=(\d+)/, 'Έως $1 χαρακτήρες'],
    [/^Too small: expected number to be >=(\d+)/, 'Τουλάχιστον $1'],
    [/^Too big: expected number to be <=(\d+)/, 'Έως $1'],
    [/^Invalid input: expected number/, 'Συμπλήρωσε έναν αριθμό'],
    [/^Invalid input: expected int/, 'Χωρίς δεκαδικά'],
    [/^Too big: expected array to have <=(\d+)/, 'Έως $1'],
    [/^Minimum must not be larger than maximum$/, 'Το «από» δεν μπορεί να είναι μεγαλύτερο από το «έως» (τιμή ή ώρες ήλιου).'],
    [/^Set both months or neither$/, 'Διάλεξε και τους δύο μήνες ή κανέναν'],
    [/^Unknown image$/, 'Μια φωτογραφία δεν βρέθηκε. Ανέβασέ την ξανά.'],
    [/^Unknown combinationId$/, 'Ο συνδυασμός δεν βρέθηκε'],
    [/^Not found$/, 'Δεν βρέθηκε (ανανέωσε τη σελίδα)'],
  ]
  const greek = (message) => {
    for (const [pattern, text] of GREEK) {
      const match = message.match(pattern)
      if (match) return text.replace(/\$(\d)/g, (_, i) => match[i])
    }
    return message
  }

  function showErrors(body) {
    const details = Array.isArray(body?.details) ? body.details : []
    const unplaced = []
    let first = null
    for (const { path, message: english } of details) {
      const message = greek(english)
      const el = path ? findByPath(path) : null
      const field = el?.closest('.field')
      const slot = field?.querySelector('.error')
      if (slot) {
        field.classList.add('invalid')
        slot.textContent = slot.textContent ? `${slot.textContent} · ${message}` : message
        first ??= el
      } else {
        unplaced.push(path ? `${path}: ${message}` : message)
      }
    }
    const summary = details.length ? 'Διόρθωσε τα σημειωμένα πεδία.' : greek(body?.message || 'Κάτι πήγε στραβά.')
    banner.textContent = [summary, ...unplaced].join(' ')
    banner.classList.remove('hidden')
    ;(first ?? banner).scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (first?.focus) first.focus({ preventScroll: true })
  }

  /* ─────────────── Sending ─────────────── */

  async function send(url, method, body) {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    })
    // Cloudflare Access session ended: the answer is its login page, not our JSON
    if (res.redirected || !(res.headers.get('content-type') || '').includes('json')) {
      if (res.ok && res.status === 204) return { ok: true, data: null }
      return { ok: false, data: { message: 'Η σύνδεση έληξε. Ανανέωσε τη σελίδα και συνδέσου ξανά.' } }
    }
    return { ok: res.ok, data: await res.json() }
  }

  function busy(on) {
    for (const button of form.querySelectorAll('.save-bar button')) button.disabled = on
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    clearErrors()
    busy(true)
    try {
      const { ok, data } = await send(form.dataset.action, form.dataset.method, collect(form))
      if (!ok) return showErrors(data)
      dirty = false
      sessionStorage.setItem('admin-toast', 'Αποθηκεύτηκε')
      location.assign(`${form.dataset.base}/${data.id}`)
    } catch {
      showErrors({ message: 'Δεν ήταν δυνατή η σύνδεση. Δοκίμασε ξανά.' })
    } finally {
      busy(false)
    }
  })

  form.querySelector('[data-delete]')?.addEventListener('click', async (event) => {
    if (!confirm('Να διαγραφεί οριστικά; Δεν αναιρείται.')) return
    clearErrors()
    busy(true)
    try {
      const { ok, data } = await send(event.currentTarget.dataset.delete, 'DELETE')
      if (!ok) return showErrors(data)
      dirty = false
      sessionStorage.setItem('admin-toast', 'Διαγράφηκε')
      location.assign(form.dataset.base)
    } catch {
      showErrors({ message: 'Δεν ήταν δυνατή η σύνδεση. Δοκίμασε ξανά.' })
    } finally {
      busy(false)
    }
  })

  /* ─────────────── Lists: add, remove, move ─────────────── */

  const listOf = (row) => row.parentElement

  /** Enables/disables ↑/↓ at the ends of a list */
  function refresh(list) {
    const rows = rowsOf(list)
    rows.forEach((row, i) => {
      const up = row.querySelector('[data-move="-1"]')
      const down = row.querySelector('[data-move="1"]')
      if (up) up.disabled = i === 0
      if (down) down.disabled = i === rows.length - 1
    })
  }

  function addRow(wrap) {
    const list = wrap.querySelector('[data-list], [data-images]')
    const row = wrap.querySelector('template[data-template]').content.firstElementChild.cloneNode(true)
    list.append(row)
    refresh(list)
    return row
  }

  form.addEventListener('click', (event) => {
    const button = event.target.closest('button')
    if (!button) return

    if (button.hasAttribute('data-add')) {
      const row = addRow(button.closest('[data-list-wrap]'))
      row.querySelector('input, textarea')?.focus()
      dirty = true
      return
    }

    const row = button.closest('[data-row]')
    if (!row) return
    const list = listOf(row)

    if (button.hasAttribute('data-remove')) {
      const next = row.nextElementSibling ?? row.previousElementSibling
      row.remove()
      refresh(list)
      next?.querySelector('[data-remove]')?.focus()
      dirty = true
    } else if (button.dataset.move) {
      const sibling = button.dataset.move === '-1' ? row.previousElementSibling : row.nextElementSibling
      if (!sibling) return
      if (button.dataset.move === '-1') sibling.before(row)
      else sibling.after(row)
      refresh(list)
      if (button.disabled) row.querySelector('[data-move]:not(:disabled)')?.focus()
      else button.focus()
      dirty = true
    }
  })

  /* ─────────────── Drag and drop (mouse; touch uses ↑/↓) ─────────────── */

  let dragged = null

  // Rows become draggable only while their handle is held, so text in inputs can still be selected
  form.addEventListener('pointerdown', (event) => {
    const handle = event.target.closest('[data-handle]')
    const row = handle?.closest('[data-row]')
    if (row && listOf(row).hasAttribute('data-sortable')) row.draggable = true
  })
  form.addEventListener('pointerup', () => {
    for (const row of form.querySelectorAll('[data-row][draggable="true"]')) row.draggable = false
  })

  form.addEventListener('dragstart', (event) => {
    const row = event.target.closest?.('[data-row]')
    if (!row || !row.draggable) return
    dragged = row
    row.classList.add('dragging')
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', '')
  })

  const clearMarks = () => {
    for (const el of form.querySelectorAll('.drop-before, .drop-after')) el.classList.remove('drop-before', 'drop-after')
  }

  /** Before or after the row under the pointer (rows wrap in photo lists, so use the long axis) */
  function placeOf(row, event) {
    const box = row.getBoundingClientRect()
    const horizontal = getComputedStyle(listOf(row)).flexDirection === 'row'
    return horizontal ? event.clientX < box.left + box.width / 2 : event.clientY < box.top + box.height / 2
  }

  form.addEventListener('dragover', (event) => {
    const row = event.target.closest?.('[data-row]')
    if (!dragged || !row || row === dragged || listOf(row) !== listOf(dragged)) return
    event.preventDefault()
    clearMarks()
    row.classList.add(placeOf(row, event) ? 'drop-before' : 'drop-after')
  })

  form.addEventListener('drop', (event) => {
    const row = event.target.closest?.('[data-row]')
    if (!dragged || !row || row === dragged || listOf(row) !== listOf(dragged)) return
    event.preventDefault()
    if (placeOf(row, event)) row.before(dragged)
    else row.after(dragged)
    refresh(listOf(dragged))
    dirty = true
  })

  form.addEventListener('dragend', () => {
    dragged?.classList.remove('dragging')
    if (dragged) dragged.draggable = false
    dragged = null
    clearMarks()
  })

  /* ─────────────── Photos: upload, then they join the list ─────────────── */

  for (const input of form.querySelectorAll('input[type=file][data-upload]')) {
    input.addEventListener('change', async () => {
      const wrap = input.closest('.gallery')
      const list = wrap.querySelector('[data-images]')
      const status = wrap.querySelector('[data-upload-status]')
      const slot = wrap.querySelector(':scope > .error')
      const files = [...input.files]
      if (files.length === 0) return
      const room = Number(list.dataset.max) - rowsOf(list).length
      slot.textContent = ''
      if (files.length > room) {
        slot.textContent = `Έως ${list.dataset.max} φωτογραφίες συνολικά.`
        input.value = ''
        return
      }

      const body = new FormData()
      for (const file of files) body.append('files', file)
      status.textContent = 'Ανέβασμα…'
      input.disabled = true
      try {
        const res = await fetch(input.dataset.upload, { method: 'POST', body, credentials: 'same-origin' })
        const data = (res.headers.get('content-type') || '').includes('json') ? await res.json() : null
        if (!res.ok || !Array.isArray(data)) {
          slot.textContent = data?.message || 'Το ανέβασμα απέτυχε.'
          return
        }
        for (const image of data) {
          const row = addRow(wrap)
          row.dataset.imageId = String(image.id)
          row.querySelector('img').src = image.url
        }
        dirty = true
      } catch {
        slot.textContent = 'Δεν ήταν δυνατή η σύνδεση. Δοκίμασε ξανά.'
      } finally {
        status.textContent = 'JPEG, PNG ή WebP, έως 10 MB η καθεμία'
        input.disabled = false
        input.value = ''
      }
    })
  }

  /* ─────────────── Start ─────────────── */

  for (const list of form.querySelectorAll('[data-sortable]')) refresh(list)
  form.addEventListener('input', () => (dirty = true))
  window.addEventListener('beforeunload', (event) => {
    if (dirty) event.preventDefault()
  })
})()
