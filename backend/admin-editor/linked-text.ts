// Text fields that can link words to blogs (`blogLinks` on TextArea / TextField / SuggestField).
// Each becomes a small Tiptap box: the linked words show as light-blue links (a click opens that
// blog's form in a new tab) and the text travels as `[words](blog:12)` in a hidden input that keeps
// the field's data-field, so admin.client.js sends it and shows its errors like any other field.
// Selecting words shows «🔗 Σύνδεσμος σε άρθρο» (BlogLinkPicker's button and dialog); a click on a
// link shows a bar with the blog's title (opens it) and ✕ (link-popover.ts).
import { Editor, type JSONContent } from '@tiptap/core'
import { Placeholder } from '@tiptap/extensions'
import StarterKit from '@tiptap/starter-kit'
import { blogIdOfHref, parseBlogLinks } from '../../packages/shared/src/blog-links'
import { blurLinkPopover, updateLinkPopover } from './link-popover'

/** Lowercase without accents: «Πότισμα» matches «ποτισμα» */
const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** The stored text as the box's document: one paragraph per line, `[words](blog:12)` as links */
function toDoc(text: string): JSONContent {
  const lines = text.split('\n')
  return {
    type: 'doc',
    content: lines.map((line) => ({
      type: 'paragraph',
      content: parseBlogLinks(line)
        .filter((part) => part.text !== '')
        .map((part) =>
          'blogId' in part
            ? { type: 'text', text: part.text, marks: [{ type: 'link', attrs: { href: `blog:${part.blogId}` } }] }
            : { type: 'text', text: part.text },
        ),
    })),
  }
}

/** The box's document as stored text (links' words lose brackets: they would end the marker) */
function toText(doc: JSONContent, singleLine: boolean) {
  const lines = (doc.content ?? []).map((p) =>
    (p.content ?? [])
      .map((node) => {
        const text = node.text ?? ''
        const href = node.marks?.find((m) => m.type === 'link')?.attrs?.href as string | undefined
        const id = href ? blogIdOfHref(href) : null
        return id === null ? text : `[${text.replace(/[[\]]/g, '')}](blog:${id})`
      })
      .join(''),
  )
  return lines.join(singleLine ? ' ' : '\n')
}

/* ─────────────── The page's «🔗» button and blog dialog (BlogLinkPicker), shared by all boxes ─────────────── */

const pill = document.querySelector<HTMLButtonElement>('[data-blog-link-pill]')
const dialog = document.querySelector<HTMLDialogElement>('[data-blog-link-dialog]')
/** The box and range the dialog works on */
let linking: { editor: Editor; from: number; to: number; editing: boolean } | null = null
let pillEditor: Editor | null = null

const blogOptions = () =>
  [...document.querySelectorAll<HTMLElement>('[data-options="blogs"] > li')].map((li) => ({
    id: li.dataset.value ?? '',
    label: li.dataset.label ?? '',
    hint: li.dataset.hint ?? '',
  }))

/**
 * Shows «🔗» over selected words (to link them, or to change the link they are in); hides it
 * otherwise. A cursor in a link gets the link bar instead (link-popover.ts). The article editor uses
 * it too: there words inside a web link get no pill (its toolbar's link dialog changes those).
 */
export function updatePill(editor: Editor) {
  if (!pill) return
  const { from, to, empty } = editor.state.selection
  const inLink = editor.isActive('link')
  const inWebLink = inLink && blogIdOfHref(String(editor.getAttributes('link').href ?? '')) === null
  if (!editor.isFocused || empty || inWebLink) {
    if (pillEditor === editor) pill.hidden = true
    return
  }
  const words = editor.state.doc.textBetween(from, to, ' ')
  if (!inLink && (!words.trim() || words.length > 200)) {
    pill.hidden = true
    return
  }
  pill.textContent = inLink ? '🔗 Αλλαγή συνδέσμου' : '🔗 Σύνδεσμος σε άρθρο'
  const at = editor.view.coordsAtPos(from)
  pill.style.top = `${at.top + window.scrollY - 40}px`
  pill.style.left = `${Math.max(8, at.left + window.scrollX - 20)}px`
  pill.hidden = false
  pillEditor = editor
}

function listBlogs() {
  if (!dialog) return
  const results = dialog.querySelector<HTMLElement>('[data-blog-link-results]')!
  const search = dialog.querySelector<HTMLInputElement>('[data-blog-link-search]')!
  const words = plain(search.value).split(/\s+/).filter(Boolean)
  const current = linking && linking.editing ? blogIdOfHref(String(linking.editor.getAttributes('link').href ?? '')) : null
  const matches = blogOptions()
    .filter((b) => words.every((w) => plain(`${b.label} ${b.hint}`).includes(w)))
    .slice(0, 30)
  results.replaceChildren(
    ...(matches.length
      ? matches.map((b) => {
          const li = document.createElement('li')
          li.setAttribute('role', 'option')
          li.dataset.value = b.id
          if (String(current) === b.id) li.className = 'active'
          const name = document.createElement('div')
          name.className = 'name'
          name.textContent = b.label
          const hint = document.createElement('div')
          hint.className = 'small muted'
          hint.textContent = b.hint
          li.append(name, hint)
          return li
        })
      : [Object.assign(document.createElement('li'), { className: 'none', textContent: 'Κανένα άρθρο' })]),
  )
}

function openDialog(editor: Editor) {
  if (!dialog) return
  const editing = editor.isActive('link')
  if (editing) editor.chain().extendMarkRange('link').run()
  const { from, to } = editor.state.selection
  linking = { editor, from, to, editing }
  dialog.querySelector('[data-blog-link-words]')!.textContent = `«${editor.state.doc.textBetween(from, to, ' ')}»`
  dialog.querySelector<HTMLElement>('[data-blog-link-remove]')!.hidden = !editing
  const search = dialog.querySelector<HTMLInputElement>('[data-blog-link-search]')!
  search.value = ''
  listBlogs()
  if (pill) pill.hidden = true
  dialog.showModal()
  search.focus()
}

/** Links the range to a blog (or removes the link with id null), then back to the box */
function applyLink(id: string | null) {
  if (!linking || !dialog) return
  const { editor, from, to } = linking
  const chain = editor.chain().focus().setTextSelection({ from, to })
  if (id === null) chain.unsetLink().run()
  else chain.setLink({ href: `blog:${id}` }).setTextSelection(to).unsetMark('link').run()
  dialog.close()
  linking = null
}

// The script can run more than once on a page (each editor brings its tag): wire the button once
if (pill && dialog && pill.dataset.wired === undefined) {
  pill.dataset.wired = ''
  // Keeps the box's selection while the button is pressed
  pill.addEventListener('mousedown', (event) => event.preventDefault())
  pill.addEventListener('click', () => pillEditor && openDialog(pillEditor))
  const search = dialog.querySelector<HTMLInputElement>('[data-blog-link-search]')!
  const results = dialog.querySelector<HTMLElement>('[data-blog-link-results]')!
  search.addEventListener('input', listBlogs)
  search.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return
    event.preventDefault() // never sends the form; Enter picks the first result
    const first = results.querySelector<HTMLElement>('li[data-value]')
    if (first) applyLink(first.dataset.value ?? null)
  })
  results.addEventListener('click', (event) => {
    const li = (event.target as HTMLElement).closest<HTMLElement>('li[data-value]')
    if (li) applyLink(li.dataset.value ?? null)
  })
  dialog.querySelector('[data-blog-link-remove]')?.addEventListener('click', () => applyLink(null))
  const cancel = () => {
    const editor = linking?.editor
    dialog.close()
    linking = null
    editor?.commands.focus()
  }
  dialog.querySelector('[data-blog-link-cancel]')?.addEventListener('click', cancel)
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault() // Esc
    cancel()
  })
}

/* ─────────────── Suggestions (SuggestField): a list under the box, like the native one ─────────────── */

function suggestions(box: HTMLElement, editor: Editor, options: string[]) {
  const list = document.createElement('ul')
  list.className = 'search-results'
  list.setAttribute('role', 'listbox')
  list.hidden = true
  box.after(list)
  const show = () => {
    const typed = plain(editor.getText().trim())
    const matches = options.filter((o) => !typed || plain(o).includes(typed) || typed === plain(o))
    list.replaceChildren(
      ...matches.map((o) => {
        const li = document.createElement('li')
        li.setAttribute('role', 'option')
        li.dataset.value = o
        li.textContent = o
        return li
      }),
    )
    list.hidden = matches.length === 0
  }
  // mousedown: picks before the box loses focus
  list.addEventListener('mousedown', (event) => {
    const li = (event.target as HTMLElement).closest<HTMLElement>('li[data-value]')
    if (!li) return
    event.preventDefault()
    editor.chain().focus().setContent(toDoc(li.dataset.value ?? '')).run()
    list.hidden = true
  })
  editor.on('focus', show)
  editor.on('update', show)
  editor.on('blur', () => setTimeout(() => (list.hidden = true), 150))
}

/* ─────────────── One box per field ─────────────── */

function mount(field: HTMLInputElement | HTMLTextAreaElement) {
  if (field.closest('template') || field.dataset.mounted !== undefined) return
  const singleLine = field instanceof HTMLInputElement
  // The text travels in a hidden input with the field's keys (a hidden input is no label target,
  // so clicks inside the box stay in the box)
  const hidden = document.createElement('input')
  hidden.type = 'hidden'
  for (const name of ['data-field', 'data-type', 'data-nullable', 'data-blog-links']) {
    const value = field.getAttribute(name)
    if (value !== null) hidden.setAttribute(name, value)
  }
  hidden.dataset.mounted = ''
  hidden.value = field.value

  const box = document.createElement('div')
  box.className = singleLine ? `linked-text single${field.classList.contains('big') ? ' big' : ''}` : 'linked-text'
  if (!singleLine) box.style.setProperty('--rows', String((field as HTMLTextAreaElement).rows || 3))
  const listId = field.getAttribute('list')
  field.replaceWith(hidden, box)

  const editor = new Editor({
    element: box,
    injectCSS: false,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bold: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        dropcursor: false,
        gapcursor: false,
        hardBreak: false,
        heading: false,
        horizontalRule: false,
        italic: false,
        listItem: false,
        listKeymap: false,
        orderedList: false,
        strike: false,
        trailingNode: false,
        underline: false,
        link: {
          openOnClick: false,
          autolink: false,
          linkOnPaste: false,
          // Only links to blogs here
          isAllowedUri: (url) => blogIdOfHref(url) !== null,
          HTMLAttributes: { rel: null, target: null },
        },
      }),
      Placeholder.configure({ placeholder: field.getAttribute('placeholder') ?? '' }),
    ],
    content: toDoc(field.value),
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': field.getAttribute('aria-label') ?? '',
        'aria-multiline': String(!singleLine),
        spellcheck: 'false',
      },
      // One line only in single-line fields (Enter must not send the form either)
      handleKeyDown: (_view, event) => singleLine && event.key === 'Enter',
    },
    onUpdate: ({ editor }) => {
      hidden.value = toText(editor.getJSON(), singleLine)
      // The form keeps its unsaved-changes flag, clears this field's error and redraws its links line
      hidden.dispatchEvent(new Event('input', { bubbles: true }))
    },
    onSelectionUpdate: ({ editor }) => {
      updatePill(editor)
      updateLinkPopover(editor)
    },
    onFocus: ({ editor }) => {
      box.classList.add('focused')
      updatePill(editor)
      updateLinkPopover(editor)
    },
    onBlur: ({ editor }) => {
      box.classList.remove('focused')
      setTimeout(() => updatePill(editor), 150)
      blurLinkPopover(editor)
    },
  })

  if (listId) {
    const options = [...(document.getElementById(listId)?.querySelectorAll('option') ?? [])].map((o) => o.value)
    if (options.length) suggestions(box, editor, options)
  }
}

const mountIn = (root: ParentNode) => {
  for (const field of root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    'input[data-blog-links]:not([type=hidden]), textarea[data-blog-links]',
  )) {
    mount(field)
  }
}

mountIn(document)
// Rows added to lists later (admin.client.js tells when)
document.addEventListener('admin:row-added', (event) => mountIn(event.target as ParentNode))
