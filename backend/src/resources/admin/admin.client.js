// The dashboard's browser script, served as /admin.js (plain JS, no build step). It works on the
// markup of resources/admin/ui: list pages' delete buttons (data-delete-item), forms (data-admin-form),
// lists (data-list, data-sortable), photos (data-images), fields (data-field + data-type) and pickers
// (data-search-select, data-checks), and blog links in texts (data-blog-links, BlogLinkPicker).
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
    if (type === 'json') return JSON.parse(input.value)
    return raw === '' && input.hasAttribute('data-nullable') ? null : raw
  }

  const KEYED = '[data-field], [data-list], [data-images], [data-checks]'
  const keyOf = (el) => el.dataset.field ?? el.dataset.list ?? el.dataset.images ?? el.dataset.checks

  /** A row with nothing filled in (its id aside) */
  const isEmptyRow = (values) => Object.entries(values).every(([key, value]) => key === 'id' || value === null || value === '')

  /** The rows a list sends, in order: with data-skip-empty, the empty ones are left out */
  const sentRowsOf = (list) =>
    list.hasAttribute('data-skip-empty') ? rowsOf(list).filter((row) => !isEmptyRow(collect(row))) : rowsOf(list)

  /** A row's JSON: an object, or with data-shape="tuple" the array of its fields "0", "1", … */
  function rowValue(list, row) {
    const values = collect(row)
    if (list.dataset.shape !== 'tuple') return values
    return Object.keys(values)
      .filter((key) => /^\d+$/.test(key))
      .sort((a, b) => a - b)
      .map((key) => values[key])
  }

  /** The JSON of a form or a list row: its own fields, lists, photo lists and checklists */
  function collect(scope) {
    const data = {}
    for (const el of scope.querySelectorAll(KEYED)) {
      if (scopeOf(el) !== scope) continue
      if (el.dataset.list !== undefined) {
        data[el.dataset.list] = sentRowsOf(el).map((row) => rowValue(el, row))
      } else if (el.dataset.images !== undefined) {
        data[el.dataset.images] = rowsOf(el).map((row) => Number(row.dataset.imageId))
      } else if (el.dataset.checks !== undefined) {
        data[el.dataset.checks] = [...el.querySelectorAll('input[type=checkbox]:checked')].map((c) => Number(c.value))
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
      const own = [...scope.querySelectorAll(KEYED)].filter((el) => scopeOf(el) === scope)
      const el = own.find((e) => keyOf(e) === key)
      if (!el) return null
      if (el.dataset.list !== undefined && i + 1 < parts.length) {
        const row = sentRowsOf(el)[Number(parts[++i])]
        if (!row) return el
        if (i + 1 === parts.length) return row
        scope = row
        continue
      }
      return el // a field, or a photo list / checklist (its error covers every item)
    }
    return null
  }

  /** The server's (English) validation messages in Greek; unknown ones stay as they are */
  const GREEK = [
    [/^Too small: expected string/, 'Υποχρεωτικό πεδίο'],
    [/^Too big: expected string to have <=(\d+)/, 'Έως $1 χαρακτήρες'],
    [/^Too small: expected number to be >=(\d+)/, 'Τουλάχιστον $1'],
    [/^Too big: expected number to be <=(\d+)/, 'Έως $1'],
    [/^Invalid input: expected number, received null$/, 'Διάλεξε και τους δύο μήνες'],
    [/^Invalid input: expected number/, 'Συμπλήρωσε έναν αριθμό'],
    [/^Invalid input: expected int/, 'Χωρίς δεκαδικά'],
    [/^Too big: expected array to have <=(\d+)/, 'Έως $1'],
    [/^Minimum must not be larger than maximum$/, 'Το «από» δεν μπορεί να είναι μεγαλύτερο από το «έως».'],
    [/^Set both hours, the end after the start$/, 'Βάλε και τις δύο ώρες, το «έως» μετά το «από»'],
    [/^Use e\.g\. /, 'Γράψε π.χ. «4-6 weeks» ή «2 years» (days, weeks, months, years)'],
    [/^Seed stages go before the plant stages$/, 'Τα στάδια σπόρου μπαίνουν πριν από τα στάδια φυτού'],
    [/^Unknown image$/, 'Μια φωτογραφία δεν βρέθηκε. Ανέβασέ την ξανά.'],
    [/^Unknown combinationId$/, 'Ο συνδυασμός δεν βρέθηκε'],
    [/^Not found$/, 'Δεν βρέθηκε (ανανέωσε τη σελίδα)'],
    [/^Write some text$/, 'Γράψε κάποιο κείμενο'],
    [/^Links must start with/, 'Οι σύνδεσμοι πρέπει να ξεκινούν με https://, http:// ή mailto:'],
    [/^The text is too long$/, 'Το κείμενο είναι πολύ μεγάλο'],
    [/^Lists are nested too deeply$/, 'Πάρα πολλές λίστες η μία μέσα στην άλλη'],
    [/^Too many images$/, 'Έως 50 εικόνες σε ένα άρθρο'],
    [/^Tip picked twice$/, 'Αυτή η συμβουλή υπάρχει ήδη στη λίστα'],
    [/^Plant picked twice$/, 'Αυτό το φυτό είναι ήδη επιλεγμένο'],
    [/^Unknown tipId$/, 'Μια συμβουλή δεν βρέθηκε (ίσως διαγράφηκε). Διάλεξε άλλη.'],
    [/^Unknown plantIds$/, 'Ένα φυτό δεν βρέθηκε (ίσως διαγράφηκε). Ανανέωσε τη σελίδα.'],
    [/^Unknown blog link$/, 'Ο σύνδεσμος δείχνει σε άρθρο που δεν υπάρχει (ή στο ίδιο το άρθρο)'],
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
    // A hidden input (a blog-link box keeps its text in one) has no place: scroll to its field
    ;(first?.closest('.field') ?? first ?? banner).scrollIntoView({ behavior: 'smooth', block: 'center' })
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

  /** Search boxes left without a pick: marked, and the save stops (the server would only say "invalid") */
  function unpickedSearches() {
    const empty = [...form.querySelectorAll('[data-search-select]')].filter(
      (box) => !box.closest('template') && box.querySelector('input[type=hidden]').value === '',
    )
    for (const box of empty) {
      box.classList.add('invalid')
      box.querySelector('.error').textContent = 'Διάλεξε από τη λίστα (γράψε και πάτησε ένα αποτέλεσμα)'
    }
    return empty
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    clearErrors()
    const unpicked = unpickedSearches()
    if (unpicked.length > 0) {
      banner.textContent = 'Διόρθωσε τα σημειωμένα πεδία.'
      banner.classList.remove('hidden')
      unpicked[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
      unpicked[0].querySelector('[data-search]').focus({ preventScroll: true })
      return
    }
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
    if (!confirm(event.currentTarget.dataset.confirm || 'Να διαγραφεί οριστικά; Δεν αναιρείται.')) return
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

  /** Two rows of a grouped list (data-groups) that are in different groups */
  const otherGroup = (a, b) => !!a && !!b && (a.dataset.group ?? '') !== (b.dataset.group ?? '')
  const groupsOf = (list) => (list.dataset.groups ? list.dataset.groups.split(' ') : [])

  /**
   * After any change: ↑/↓ disabled at the ends of the list and of each group, the first row of each
   * group labelled (data-group-label, shown by the CSS), and the add buttons hidden when the list is full
   */
  function refresh(list) {
    const rows = rowsOf(list)
    const groups = groupsOf(list)
    const labels = (list.dataset.groupLabels ?? '').split('|')
    rows.forEach((row, i) => {
      const up = row.querySelector('[data-move="-1"]')
      const down = row.querySelector('[data-move="1"]')
      if (up) up.disabled = i === 0 || otherGroup(row, rows[i - 1])
      if (down) down.disabled = i === rows.length - 1 || otherGroup(row, rows[i + 1])
      const first = groups.length > 0 && (i === 0 || otherGroup(row, rows[i - 1]))
      if (first) row.dataset.groupLabel = labels[groups.indexOf(row.dataset.group)] ?? ''
      else delete row.dataset.groupLabel
    })
    const max = Number(list.dataset.max)
    const buttons = list.closest('[data-list-wrap]')?.querySelector('[data-add-buttons]')
    if (max && buttons) buttons.toggleAttribute('data-full', rows.length >= max)
  }

  /** Puts a row at the end of its group (or, in a list without groups, at the end) */
  function placeInGroup(list, row) {
    const groups = groupsOf(list)
    const order = groups.indexOf(row.dataset.group)
    const rows = rowsOf(list).filter((r) => r !== row)
    const lastOfGroup = rows.filter((r) => r.dataset.group === row.dataset.group).at(-1)
    const firstLater = rows.find((r) => groups.indexOf(r.dataset.group) > order)
    if (order < 0) list.append(row)
    else if (lastOfGroup) lastOfGroup.after(row)
    else if (firstLater) firstLater.before(row)
    else list.append(row)
  }

  /** Adds a row from the list's template (`variant`: the template of that kind of row) */
  function addRow(wrap, variant) {
    const list = wrap.querySelector('[data-list], [data-images]')
    const template = variant
      ? wrap.querySelector(`template[data-variant="${CSS.escape(variant)}"]`)
      : wrap.querySelector('template[data-template]')
    const row = template.content.firstElementChild.cloneNode(true)
    placeInGroup(list, row)
    refresh(list)
    // The editor script sets up the row's blog-link boxes
    row.dispatchEvent(new CustomEvent('admin:row-added', { bubbles: true }))
    return row
  }

  form.addEventListener('click', (event) => {
    const button = event.target.closest('button')
    if (!button) return

    if (button.hasAttribute('data-add')) {
      const row = addRow(button.closest('[data-list-wrap]'), button.dataset.variant)
      row.querySelector('input:not([type=hidden]), textarea')?.focus()
      dirty = true
      return
    }

    const row = button.closest('[data-row]')
    if (!row) return
    const list = listOf(row)

    if (button.hasAttribute('data-switch-group')) {
      switchGroup(list, row, button)
      dirty = true
      return
    }

    if (button.hasAttribute('data-remove')) {
      const next = row.nextElementSibling ?? row.previousElementSibling
      row.remove()
      refresh(list)
      next?.querySelector('[data-remove]')?.focus()
      dirty = true
    } else if (button.dataset.move) {
      const sibling = button.dataset.move === '-1' ? row.previousElementSibling : row.nextElementSibling
      if (!sibling || otherGroup(row, sibling)) return
      if (button.dataset.move === '-1') sibling.before(row)
      else sibling.after(row)
      refresh(list)
      if (button.disabled) row.querySelector('[data-move]:not(:disabled)')?.focus()
      else button.focus()
      dirty = true
    }
  })

  /**
   * A row's [data-switch-group] button: the row moves to the other group (data-to), at its edge next
   * to the row's old group, and its parts follow: [data-group-value] inputs get the button's
   * data-value-<group>, [data-group-text] texts its data-text-<group>, and the button its next target
   */
  function switchGroup(list, row, button) {
    const from = row.dataset.group
    const to = button.dataset.to
    const groups = groupsOf(list)
    row.dataset.group = to
    const rows = rowsOf(list).filter((r) => r !== row)
    if (groups.indexOf(to) > groups.indexOf(from)) {
      // Going down: first of the new group (right after the old group)
      const first = rows.find((r) => r.dataset.group === to)
      if (first) first.before(row)
      else placeInGroup(list, row)
    } else {
      placeInGroup(list, row) // going up: last of the new group
    }
    for (const input of row.querySelectorAll('[data-group-value]')) input.value = button.dataset[`value${cap(to)}`]
    for (const text of row.querySelectorAll('[data-group-text]')) text.textContent = button.dataset[`text${cap(to)}`]
    button.dataset.to = from
    button.textContent = button.dataset[`switch${cap(from)}`]
    refresh(list)
    button.focus()
    row.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const cap = (word) => word.charAt(0).toUpperCase() + word.slice(1)

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

  // A row of a grouped list (data-groups) is dropped only next to rows of its own group

  /** Before or after the row under the pointer (rows wrap in photo lists, so use the long axis) */
  function placeOf(row, event) {
    const box = row.getBoundingClientRect()
    const horizontal = getComputedStyle(listOf(row)).flexDirection === 'row'
    return horizontal ? event.clientX < box.left + box.width / 2 : event.clientY < box.top + box.height / 2
  }

  form.addEventListener('dragover', (event) => {
    const row = event.target.closest?.('[data-row]')
    if (!dragged || !row || row === dragged || listOf(row) !== listOf(dragged) || otherGroup(row, dragged)) return
    event.preventDefault()
    clearMarks()
    row.classList.add(placeOf(row, event) ? 'drop-before' : 'drop-after')
  })

  form.addEventListener('drop', (event) => {
    const row = event.target.closest?.('[data-row]')
    if (!dragged || !row || row === dragged || listOf(row) !== listOf(dragged) || otherGroup(row, dragged)) return
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

  /* ─────────────── Search select: pick one option by typing ─────────────── */

  const MAX_RESULTS = 20
  /** Lowercase without accents: «Πότισμα» matches «ποτισμα» */
  const plain = (text) =>
    (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

  const boxOf = (el) => el.closest('[data-search-select]')
  const optionsOf = (box) => [...document.querySelectorAll(`[data-options="${CSS.escape(box.dataset.searchSelect)}"] > li`)]

  /** Ids picked by the other boxes of the same list (not offered again) */
  function takenBy(box) {
    const list = box.closest('[data-list]')
    if (!list) return new Set()
    return new Set(
      [...list.querySelectorAll(`[data-search-select="${CSS.escape(box.dataset.searchSelect)}"]`)]
        .filter((other) => other !== box)
        .map((other) => other.querySelector('input[type=hidden]').value)
        .filter(Boolean),
    )
  }

  function closeResults(box) {
    const results = box.querySelector('.search-results')
    results.hidden = true
    results.replaceChildren()
    box.querySelector('[data-search]').setAttribute('aria-expanded', 'false')
  }

  function showResults(box) {
    const input = box.querySelector('[data-search]')
    const results = box.querySelector('.search-results')
    const words = plain(input.value).split(/\s+/).filter(Boolean)
    const taken = takenBy(box)
    const matches = optionsOf(box)
      .filter((o) => !taken.has(o.dataset.value))
      .filter((o) => {
        const text = plain(`${o.dataset.label} ${o.dataset.hint || ''}`)
        return words.every((w) => text.includes(w))
      })
      .slice(0, MAX_RESULTS)
    results.replaceChildren(
      ...(matches.length
        ? matches.map((o, i) => {
            const li = document.createElement('li')
            li.setAttribute('role', 'option')
            li.dataset.value = o.dataset.value
            li.className = i === 0 ? 'active' : ''
            const name = document.createElement('div')
            name.className = 'name'
            name.textContent = o.dataset.label
            li.append(name)
            if (o.dataset.hint) {
              const hint = document.createElement('div')
              hint.className = 'small muted'
              hint.textContent = o.dataset.hint
              li.append(hint)
            }
            return li
          })
        : [Object.assign(document.createElement('li'), { className: 'none', textContent: 'Κανένα αποτέλεσμα' })]),
    )
    results.hidden = false
    input.setAttribute('aria-expanded', 'true')
  }

  /** Fills the row from the picked option: data-fill="key" gets its data-key, data-fill-href its id */
  function pick(box, value) {
    const option = optionsOf(box).find((o) => o.dataset.value === value)
    if (!option) return
    box.querySelector('input[type=hidden]').value = value
    box.querySelector('[data-search]').value = option.dataset.label
    box.classList.remove('invalid')
    box.querySelector('.error').textContent = ''
    fill(box, option)
    closeResults(box)
    dirty = true
  }

  function fill(box, option) {
    const scope = box.closest('[data-row]') ?? box.parentElement
    for (const el of scope.querySelectorAll('[data-fill]')) el.textContent = option ? option.dataset[el.dataset.fill] || '' : ''
    for (const link of scope.querySelectorAll('[data-fill-href]')) {
      link.hidden = !option
      if (option) link.href = link.dataset.fillHref.replace('{value}', option.dataset.value)
    }
  }

  form.addEventListener('input', (event) => {
    if (!event.target.matches('[data-search]')) return
    const box = boxOf(event.target)
    // Typing again drops the pick until a result is chosen
    box.querySelector('input[type=hidden]').value = ''
    fill(box, null)
    showResults(box)
  })

  form.addEventListener('focusin', (event) => {
    if (event.target.matches('[data-search]')) showResults(boxOf(event.target))
  })

  form.addEventListener('focusout', (event) => {
    const box = event.target.matches?.('[data-search]') && boxOf(event.target)
    if (box) setTimeout(() => closeResults(box), 150) // after a click on a result
  })

  // mousedown, so the pick happens before the box loses focus
  form.addEventListener('mousedown', (event) => {
    const li = event.target.closest('[data-search-select] .search-results li[data-value]')
    if (!li) return
    event.preventDefault()
    pick(boxOf(li), li.dataset.value)
  })

  form.addEventListener('keydown', (event) => {
    if (!event.target.matches('[data-search]')) return
    const box = boxOf(event.target)
    const results = box.querySelector('.search-results')
    const items = [...results.querySelectorAll('li[data-value]')]
    const active = results.querySelector('li.active')
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (results.hidden) return showResults(box)
      if (items.length === 0) return
      const index = items.indexOf(active) + (event.key === 'ArrowDown' ? 1 : -1)
      active?.classList.remove('active')
      const next = items[(index + items.length) % items.length]
      next.classList.add('active')
      next.scrollIntoView({ block: 'nearest' })
    } else if (event.key === 'Enter') {
      event.preventDefault() // never submits the form
      if (active && !results.hidden) pick(box, active.dataset.value)
    } else if (event.key === 'Escape') {
      closeResults(box)
    }
  })

  /* ─────────────── Checklist: search and count ─────────────── */

  function countChecks(picker) {
    const n = picker.querySelectorAll('input[type=checkbox]:checked').length
    picker.querySelector('[data-checked-count]').textContent = n === 1 ? '1 επιλεγμένο' : `${n} επιλεγμένα`
  }

  for (const picker of form.querySelectorAll('[data-checks]')) {
    countChecks(picker)
    const rows = [...picker.querySelectorAll('li[data-search-text]')]
    picker.querySelector('[data-filter]').addEventListener('input', (event) => {
      const words = plain(event.target.value).split(/\s+/).filter(Boolean)
      let shown = 0
      for (const row of rows) {
        const match = words.every((w) => plain(row.dataset.searchText).includes(w))
        row.hidden = !match
        if (match) shown++
      }
      picker.querySelector('[data-no-match]').classList.toggle('hidden', shown > 0 || rows.length === 0)
    })
    picker.addEventListener('change', () => countChecks(picker))
    // Enter in the search box doesn't submit the form
    picker.querySelector('[data-filter]').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') event.preventDefault()
    })
  }

  /* ─────────────── Blog links in texts: the links line under a field ─────────────── */

  // The fields themselves are boxes from the editor script (admin-editor/linked-text.ts): it keeps
  // the text, `[words](blog:12)`, in the hidden input and fires input on every change

  const BLOG_LINK = /\[([^[\]\n]{1,200})\]\(blog:(\d{1,9})\)/g

  const blogTitle = (id) =>
    document.querySelector(`[data-options="blogs"] > li[data-value="${CSS.escape(String(id))}"]`)?.dataset.label

  /** Under each linked field: «λέξη → Τίτλος», so it shows which blog each link opens */
  function updateLinksLine(field) {
    const line = field.closest('.field')?.querySelector('[data-links-line]')
    if (!line) return
    line.textContent = [...field.value.matchAll(BLOG_LINK)]
      .map((m) => `🔗 ${m[1]} → ${blogTitle(m[2]) ?? `άρθρο #${m[2]} (δεν βρέθηκε)`}`)
      .join(' · ')
  }

  form.addEventListener('input', (event) => {
    if (event.target.matches?.('[data-blog-links]')) updateLinksLine(event.target)
  })
  for (const field of form.querySelectorAll('[data-blog-links]')) updateLinksLine(field)

  /* ─────────────── Start ─────────────── */

  for (const list of form.querySelectorAll('[data-sortable]')) refresh(list)
  form.addEventListener('input', (event) => {
    if (event.target.closest?.('dialog')) return // typing in a dialog's search changes nothing yet
    dirty = true
    // Editing a field clears its error
    const field = event.target.closest?.('.field.invalid')
    if (field) {
      field.classList.remove('invalid')
      const slot = field.querySelector('.error')
      if (slot) slot.textContent = ''
    }
  })
  window.addEventListener('beforeunload', (event) => {
    if (dirty) event.preventDefault()
  })
})()
