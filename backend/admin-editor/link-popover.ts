// A small bar over the blog link the cursor is in (blog-link boxes and the article editor): the
// blog's title, which opens its form in a new tab, and ✕, which removes the link and keeps the words.
// A click on a link only puts the cursor there: nothing opens until the title is clicked.
import type { Editor } from '@tiptap/core'
import { blogIdOfHref } from '../../packages/shared/src/blog-links'

let bar: HTMLDivElement | null = null
let owner: Editor | null = null

/** The blog's title from the page's list (SearchOptions source="blogs") */
const blogTitle = (id: number) =>
  document.querySelector<HTMLElement>(`[data-options="blogs"] > li[data-value="${id}"]`)?.dataset.label

function create() {
  const el = document.createElement('div')
  el.className = 'link-popover'
  el.setAttribute('role', 'toolbar')
  el.setAttribute('aria-label', 'Σύνδεσμος σε άρθρο')
  el.hidden = true
  const open = document.createElement('a')
  open.target = '_blank'
  open.rel = 'noopener'
  open.dataset.linkOpen = ''
  const remove = document.createElement('button')
  remove.type = 'button'
  remove.className = 'icon-button remove'
  remove.textContent = '✕'
  remove.title = 'Αφαίρεση συνδέσμου'
  remove.setAttribute('aria-label', 'Αφαίρεση συνδέσμου')
  remove.dataset.linkUnlink = ''
  el.append(open, remove)
  // Pressing the bar keeps the editor's cursor (the title link still opens on click)
  el.addEventListener('mousedown', (event) => {
    if (!(event.target as HTMLElement).closest('a')) event.preventDefault()
  })
  remove.addEventListener('click', () => {
    owner?.chain().focus().extendMarkRange('link').unsetLink().run()
    hide()
  })
  document.body.append(el)
  return el
}

function hide() {
  if (bar) bar.hidden = true
  owner = null
}

/**
 * Shows the bar when the cursor (no selection) is in a blog link of `editor`, hides it otherwise.
 * Call on every selection change, focus and blur of the editor.
 */
export function updateLinkPopover(editor: Editor) {
  const href = String(editor.getAttributes('link').href ?? '')
  const id = blogIdOfHref(href)
  if (!editor.isFocused || !editor.state.selection.empty || id === null) {
    if (owner === editor) hide()
    return
  }
  bar ??= create()
  const open = bar.querySelector<HTMLAnchorElement>('[data-link-open]')!
  open.href = `/blogs/${id}`
  open.textContent = `🔗 ${blogTitle(id) ?? `Άρθρο #${id}`} ↗`
  // Above the start of the link
  const { from } = editor.state.selection
  const $pos = editor.state.doc.resolve(from)
  const start = from - $pos.textOffset
  const at = editor.view.coordsAtPos(Math.max(start, $pos.start()))
  bar.style.top = `${at.top + window.scrollY - 44}px`
  bar.style.left = `${Math.max(8, at.left + window.scrollX - 8)}px`
  bar.hidden = false
  owner = editor
}

/** Blur: hides the bar a moment later, unless the focus went to the bar itself */
export function blurLinkPopover(editor: Editor) {
  setTimeout(() => {
    if (owner === editor && !bar?.contains(document.activeElement)) updateLinkPopover(editor)
  }, 150)
}
