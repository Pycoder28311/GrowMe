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

  /** The JSON of a form or a list row: its own fields, lists, photo lists and checklists */
  function collect(scope) {
    const data = {}
    for (const el of scope.querySelectorAll(KEYED)) {
      if (scopeOf(el) !== scope) continue
      if (el.dataset.list !== undefined) {
        data[el.dataset.list] = rowsOf(el).map(collect)
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
        const row = rowsOf(el)[Number(parts[++i])]
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
    [/^Invalid input: expected number/, 'Συμπλήρωσε έναν αριθμό'],
    [/^Invalid input: expected int/, 'Χωρίς δεκαδικά'],
    [/^Too big: expected array to have <=(\d+)/, 'Έως $1'],
    [/^Minimum must not be larger than maximum$/, 'Το «από» δεν μπορεί να είναι μεγαλύτερο από το «έως» (τιμή ή ώρες ήλιου).'],
    [/^Set both months or neither$/, 'Διάλεξε και τους δύο μήνες ή κανέναν'],
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

  /** Adds a row from the list's template (`variant`: the template of that kind of row) */
  function addRow(wrap, variant) {
    const list = wrap.querySelector('[data-list], [data-images]')
    const template = variant
      ? wrap.querySelector(`template[data-variant="${CSS.escape(variant)}"]`)
      : wrap.querySelector('template[data-template]')
    const row = template.content.firstElementChild.cloneNode(true)
    list.append(row)
    refresh(list)
    return row
  }

  form.addEventListener('click', (event) => {
    const button = event.target.closest('button')
    if (!button) return

    if (button.hasAttribute('data-add')) {
      const row = addRow(button.closest('[data-list-wrap]'), button.dataset.variant)
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

  /* ─────────────── Blog links in texts: select words, pick a blog → [words](blog:12) ─────────────── */

  const BLOG_LINK = /\[([^[\]\n]{1,200})\]\(blog:(\d{1,9})\)/g
  const pill = form.querySelector('[data-blog-link-pill]')
  const linkDialog = form.querySelector('[data-blog-link-dialog]')
  /** What the dialog works on: the field, the range to replace, the words, and the link being edited */
  let linking = null

  const blogTitle = (id) =>
    document.querySelector(`[data-options="blogs"] > li[data-value="${CSS.escape(String(id))}"]`)?.dataset.label

  /** The links of a text: their place, words and blog */
  const linksOf = (text) =>
    [...text.matchAll(BLOG_LINK)].map((m) => ({ start: m.index, end: m.index + m[0].length, words: m[1], id: m[2] }))

  /**
   * What the selection of a field can become: a new link (some words selected), the link the
   * cursor is in (to change or remove), or null (nothing selected, or brackets / a line break /
   * part of another link in the selection)
   */
  function linkTarget(field) {
    let start = field.selectionStart
    let end = field.selectionEnd
    if (start == null) return null
    const value = field.value
    const links = linksOf(value)
    // In a link: the cursor after its first character, or a selection within it (all of it too)
    const inside = links.find((l) => start >= l.start && end <= l.end && (start > l.start || end > start))
    if (inside) return { field, start: inside.start, end: inside.end, words: inside.words, id: inside.id }
    while (start < end && /\s/.test(value[start])) start++
    while (end > start && /\s/.test(value[end - 1])) end--
    if (start === end) return null
    const words = value.slice(start, end)
    if (/[[\]\n]/.test(words) || words.length > 200) return null
    if (links.some((l) => start < l.end && end > l.start)) return null
    return { field, start, end, words, id: null }
  }

  /** The «🔗» button over the field while words are selected (or the cursor is in a link) */
  function updatePill(field) {
    if (!pill) return
    const target = field && document.activeElement === field ? linkTarget(field) : null
    if (!target) {
      pill.hidden = true
      return
    }
    pill.textContent = target.id ? '🔗 Αλλαγή συνδέσμου' : '🔗 Σύνδεσμος σε άρθρο'
    const box = field.getBoundingClientRect()
    pill.style.top = `${box.top + window.scrollY - 36}px`
    pill.style.left = `${box.right + window.scrollX - 220}px`
    pill.hidden = false
    pill.linkField = field
  }

  /** Under each linked field: «λέξη → Τίτλος», so the markers stay readable */
  function updateLinksLine(field) {
    const line = field.closest('.field')?.querySelector('[data-links-line]')
    if (!line) return
    line.textContent = linksOf(field.value)
      .map((l) => `🔗 ${l.words} → ${blogTitle(l.id) ?? `άρθρο #${l.id} (δεν βρέθηκε)`}`)
      .join(' · ')
  }

  for (const type of ['select', 'keyup', 'mouseup', 'focusin']) {
    form.addEventListener(type, (event) => {
      if (event.target.matches?.('[data-blog-links]')) updatePill(event.target)
    })
  }
  form.addEventListener('focusout', (event) => {
    if (event.target.matches?.('[data-blog-links]')) setTimeout(() => updatePill(document.activeElement), 150)
  })
  // Keeps the field's selection while the button is pressed
  pill?.addEventListener('mousedown', (event) => event.preventDefault())
  pill?.addEventListener('click', () => {
    const target = pill.linkField && linkTarget(pill.linkField)
    if (target) openLinkDialog(target)
  })

  function listBlogs() {
    const results = linkDialog.querySelector('[data-blog-link-results]')
    const words = plain(linkDialog.querySelector('[data-blog-link-search]').value).split(/\s+/).filter(Boolean)
    const matches = [...document.querySelectorAll('[data-options="blogs"] > li')]
      .filter((o) => words.every((w) => plain(`${o.dataset.label} ${o.dataset.hint || ''}`).includes(w)))
      .slice(0, 30)
    results.replaceChildren(
      ...(matches.length
        ? matches.map((o) => {
            const li = document.createElement('li')
            li.setAttribute('role', 'option')
            li.dataset.value = o.dataset.value
            if (o.dataset.value === linking?.id) li.className = 'active'
            const name = document.createElement('div')
            name.className = 'name'
            name.textContent = o.dataset.label
            const hint = document.createElement('div')
            hint.className = 'small muted'
            hint.textContent = o.dataset.hint || ''
            li.append(name, hint)
            return li
          })
        : [Object.assign(document.createElement('li'), { className: 'none', textContent: 'Κανένα άρθρο' })]),
    )
  }

  function openLinkDialog(target) {
    linking = target
    linkDialog.querySelector('[data-blog-link-words]').textContent = `«${target.words}»`
    linkDialog.querySelector('[data-blog-link-remove]').hidden = !target.id
    const search = linkDialog.querySelector('[data-blog-link-search]')
    search.value = ''
    listBlogs()
    pill.hidden = true
    linkDialog.showModal()
    search.focus()
  }

  /** Replaces the linked range with `text`, puts the cursor after it and tells the form */
  function replaceRange(text) {
    const { field, start, end } = linking
    field.value = field.value.slice(0, start) + text + field.value.slice(end)
    linkDialog.close()
    field.focus()
    field.setSelectionRange(start + text.length, start + text.length)
    field.dispatchEvent(new Event('input', { bubbles: true }))
    linking = null
  }

  if (linkDialog) {
    linkDialog.querySelector('[data-blog-link-search]').addEventListener('input', listBlogs)
    linkDialog.querySelector('[data-blog-link-search]').addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return
      event.preventDefault() // never sends the form; Enter picks the first result
      const first = linkDialog.querySelector('[data-blog-link-results] li[data-value]')
      if (first) replaceRange(`[${linking.words}](blog:${first.dataset.value})`)
    })
    linkDialog.querySelector('[data-blog-link-results]').addEventListener('click', (event) => {
      const li = event.target.closest('li[data-value]')
      if (li) replaceRange(`[${linking.words}](blog:${li.dataset.value})`)
    })
    linkDialog.querySelector('[data-blog-link-remove]').addEventListener('click', () => replaceRange(linking.words))
    const cancel = () => {
      const field = linking?.field
      linkDialog.close()
      linking = null
      field?.focus()
    }
    linkDialog.querySelector('[data-blog-link-cancel]').addEventListener('click', cancel)
    linkDialog.addEventListener('cancel', (event) => {
      event.preventDefault() // Esc
      cancel()
    })
  }

  form.addEventListener('input', (event) => {
    if (event.target.matches?.('[data-blog-links]')) {
      updateLinksLine(event.target)
      updatePill(event.target)
    }
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
