// The dashboard's article editor (Tiptap, Word-like basics). Works on the markup of
// resources/admin/ui/rich-text-editor.tsx: it fills [data-editor-area] with the editor, keeps the
// hidden [data-field] input up to date with the document's JSON (admin.client.js sends it), and runs
// the toolbar's [data-cmd] buttons. The server checks and cleans the JSON again (shared rich-text.ts).
import { Editor } from '@tiptap/core'
import TextAlign from '@tiptap/extension-text-align'
import { Placeholder } from '@tiptap/extensions'
import StarterKit from '@tiptap/starter-kit'
import { ArticleImage, dropImage, insertImages } from './image'

type Command = {
  run: (editor: Editor) => void
  /** Pressed state (toggles) */
  active?: (editor: Editor) => boolean
  /** Whether it can run now (undo/redo) */
  enabled?: (editor: Editor) => boolean
}

/** A typed address as a link: plain addresses get https:// in front; null when it isn't a web or email link */
function toHref(typed: string): string | null {
  const text = typed.trim()
  if (text === '' || /\s/.test(text)) return null
  if (/^mailto:/i.test(text)) return text
  if (/^[^@/]+@[^@/]+\.[^@/]+$/.test(text)) return `mailto:${text}`
  const href = /^https?:\/\//i.test(text) ? text : `https://${text}`
  try {
    const url = new URL(href)
    return url.hostname.includes('.') || url.hostname === 'localhost' ? href : null
  } catch {
    return null
  }
}

/** A link to another blog: `blog:12` */
const BLOG_HREF = /^blog:(\d{1,9})$/

/** Lowercase without accents: «Πότισμα» matches «ποτισμα» */
const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/** The blogs a link can point to: rendered once in the page by the form (SearchOptions source="blogs") */
const blogOptions = () =>
  [...document.querySelectorAll<HTMLElement>('[data-options="blogs"] > li')].map((li) => ({
    id: li.dataset.value ?? '',
    label: li.dataset.label ?? '',
    hint: li.dataset.hint ?? '',
  }))

/**
 * The link dialog of one editor: opens with the selected text (or the link under the cursor) and
 * applies text + target: a web address, or a blog picked from the list («Άρθρο»). Same text as
 * before keeps its other formatting (bold…); new text replaces it.
 */
function linkDialog(root: HTMLElement, editor: Editor) {
  const dialog = root.querySelector<HTMLDialogElement>('[data-link-dialog]')
  const textInput = root.querySelector<HTMLInputElement>('[data-link-text]')
  const hrefInput = root.querySelector<HTMLInputElement>('[data-link-href]')
  const error = root.querySelector<HTMLElement>('[data-link-error]')
  const removeButton = root.querySelector<HTMLButtonElement>('[data-link-remove]')
  const saveButton = root.querySelector<HTMLButtonElement>('[data-link-save]')
  const blogSearch = root.querySelector<HTMLInputElement>('[data-link-blog-search]')
  const blogResults = root.querySelector<HTMLElement>('[data-link-blog-results]')
  const blogCurrent = root.querySelector<HTMLElement>('[data-link-blog-current]')
  if (!dialog || !textInput || !hrefInput || !error || !removeButton || !saveButton) return () => {}
  if (!blogSearch || !blogResults || !blogCurrent) return () => {}

  let range = { from: 0, to: 0 }
  let originalText = ''

  /** «Ιστοσελίδα» or «Άρθρο»: shows its panel; a blog is applied by clicking it, so no Apply button */
  function showTab(tab: 'web' | 'blog') {
    for (const button of root.querySelectorAll<HTMLElement>('[data-link-tab]')) {
      button.setAttribute('aria-selected', String(button.dataset.linkTab === tab))
    }
    for (const panel of root.querySelectorAll<HTMLElement>('[data-link-panel]')) panel.hidden = panel.dataset.linkPanel !== tab
    saveButton!.hidden = tab === 'blog'
    if (tab === 'blog') {
      listBlogs()
      blogSearch!.focus()
    } else {
      hrefInput!.focus()
    }
  }

  function listBlogs() {
    const words = plain(blogSearch!.value).split(/\s+/).filter(Boolean)
    const matches = blogOptions()
      .filter((b) => words.every((w) => plain(`${b.label} ${b.hint}`).includes(w)))
      .slice(0, 30)
    blogResults!.replaceChildren(
      ...(matches.length
        ? matches.map((b) => {
            const li = document.createElement('li')
            li.setAttribute('role', 'option')
            li.dataset.value = b.id
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

  /** Puts the link on the range: same text keeps its formatting, new text replaces it */
  function setLink(href: string, text: string) {
    const chain = editor.chain().focus()
    if (range.from !== range.to && text === originalText) {
      chain.setTextSelection(range).setLink({ href }).setTextSelection(range.to)
    } else {
      chain.insertContentAt(range, { type: 'text', text, marks: [{ type: 'link', attrs: { href } }] })
    }
    // The cursor is now right after the link: typing there continues as normal text
    chain.unsetMark('link').run()
    dialog!.close()
  }

  const close = () => {
    dialog.close()
    editor.commands.focus()
  }

  function apply() {
    const href = toHref(hrefInput!.value)
    if (!href) {
      error!.textContent = 'Γράψε μια σωστή διεύθυνση, π.χ. https://growme.gr'
      hrefInput!.focus()
      return
    }
    setLink(href, textInput!.value.trim() || hrefInput!.value.trim())
  }

  function pickBlog(id: string, label: string) {
    setLink(`blog:${id}`, textInput!.value.trim() || label)
  }

  function remove() {
    editor.chain().focus().setTextSelection(range).unsetLink().run()
    dialog!.close()
  }

  for (const input of [textInput, hrefInput]) {
    input.addEventListener('keydown', (event) => {
      // Enter applies (it must not send the whole article form)
      if (event.key === 'Enter') {
        event.preventDefault()
        apply()
      }
    })
  }
  hrefInput.addEventListener('input', () => (error.textContent = ''))
  for (const button of root.querySelectorAll<HTMLElement>('[data-link-tab]')) {
    button.addEventListener('click', () => showTab(button.dataset.linkTab === 'blog' ? 'blog' : 'web'))
  }
  blogSearch.addEventListener('input', listBlogs)
  blogSearch.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return
    event.preventDefault() // never sends the form; Enter picks the first result
    const first = blogResults.querySelector<HTMLElement>('li[data-value]')
    if (first) pickBlog(first.dataset.value ?? '', first.querySelector('.name')?.textContent ?? '')
  })
  blogResults.addEventListener('click', (event) => {
    const li = (event.target as HTMLElement).closest<HTMLElement>('li[data-value]')
    if (li) pickBlog(li.dataset.value ?? '', li.querySelector('.name')?.textContent ?? '')
  })
  root.querySelector('[data-link-save]')?.addEventListener('click', apply)
  root.querySelector('[data-link-cancel]')?.addEventListener('click', close)
  removeButton.addEventListener('click', remove)
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault() // Esc
    close()
  })

  return function open() {
    const editing = editor.isActive('link')
    if (editing) editor.chain().extendMarkRange('link').run()
    const { from, to } = editor.state.selection
    range = { from, to }
    originalText = editor.state.doc.textBetween(from, to, ' ')
    textInput.value = originalText
    const href = editing ? ((editor.getAttributes('link').href as string | undefined) ?? '') : ''
    const blogId = href.match(BLOG_HREF)?.[1]
    hrefInput.value = blogId ? '' : href
    blogSearch.value = ''
    const current = blogId && blogOptions().find((b) => b.id === blogId)
    blogCurrent.textContent = blogId ? `Τώρα: ${current ? current.label : 'άρθρο που δεν υπάρχει πια'}` : ''
    error.textContent = ''
    removeButton.hidden = !editing
    dialog.showModal()
    showTab(blogId ? 'blog' : 'web')
    if (!originalText) textInput.focus()
  }
}

const COMMANDS: Record<string, Command> = {
  paragraph: { run: (e) => e.chain().focus().setParagraph().run(), active: (e) => e.isActive('paragraph') },
  h2: {
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    active: (e) => e.isActive('heading', { level: 2 }),
  },
  h3: {
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    active: (e) => e.isActive('heading', { level: 3 }),
  },
  bold: { run: (e) => e.chain().focus().toggleBold().run(), active: (e) => e.isActive('bold') },
  italic: { run: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive('italic') },
  underline: { run: (e) => e.chain().focus().toggleUnderline().run(), active: (e) => e.isActive('underline') },
  strike: { run: (e) => e.chain().focus().toggleStrike().run(), active: (e) => e.isActive('strike') },
  // run is set per editor: it opens that editor's link dialog
  link: { run: () => {}, active: (e) => e.isActive('link') },
  // run is set per editor: it opens the file picker
  image: { run: () => {} },
  bulletList: { run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive('bulletList') },
  orderedList: { run: (e) => e.chain().focus().toggleOrderedList().run(), active: (e) => e.isActive('orderedList') },
  blockquote: { run: (e) => e.chain().focus().toggleBlockquote().run(), active: (e) => e.isActive('blockquote') },
  alignLeft: {
    run: (e) => e.chain().focus().setTextAlign('left').run(),
    // Text never aligned is left-aligned too (as in Word)
    active: (e) => !['center', 'right', 'justify'].some((textAlign) => e.isActive({ textAlign })),
  },
  alignCenter: {
    run: (e) => e.chain().focus().setTextAlign('center').run(),
    active: (e) => e.isActive({ textAlign: 'center' }),
  },
  alignRight: {
    run: (e) => e.chain().focus().setTextAlign('right').run(),
    active: (e) => e.isActive({ textAlign: 'right' }),
  },
  alignJustify: {
    run: (e) => e.chain().focus().setTextAlign('justify').run(),
    active: (e) => e.isActive({ textAlign: 'justify' }),
  },
  horizontalRule: { run: (e) => e.chain().focus().setHorizontalRule().run() },
  undo: { run: (e) => e.chain().focus().undo().run(), enabled: (e) => e.can().undo() },
  redo: { run: (e) => e.chain().focus().redo().run(), enabled: (e) => e.can().redo() },
}

function mount(root: HTMLElement) {
  const input = root.querySelector<HTMLInputElement>('input[data-field]')
  const area = root.querySelector<HTMLElement>('[data-editor-area]')
  if (!input || !area) return
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-cmd]')]
  const uploadUrl = root.dataset.upload ?? ''
  const fileInput = root.querySelector<HTMLInputElement>('[data-image-file]')
  const status = root.querySelector<HTMLElement>('[data-image-status]') ?? document.createElement('p')

  const editor = new Editor({
    element: area,
    // No <style> tag (the page's security policy allows only our own CSS): the styles are in admin.css
    injectCSS: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: {
          openOnClick: false, // handleClick below opens links (in a new tab)
          autolink: true,
          defaultProtocol: 'https',
          // Links to other blogs (`blog:12`) besides web and email links
          isAllowedUri: (url, ctx) => BLOG_HREF.test(url) || ctx.defaultValidate(url),
          HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: null },
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ArticleImage,
      Placeholder.configure({ placeholder: root.dataset.placeholder ?? '' }),
    ],
    content: JSON.parse(input.value),
    editorProps: {
      attributes: {
        'aria-label': root.dataset.label ?? 'Κείμενο',
        'aria-multiline': 'true',
        role: 'textbox',
        // No red spelling underlines
        spellcheck: 'false',
      },
      // A click on a link opens it in a new tab; the cursor still lands there, so 🔗 can edit it
      // Image files pasted or dropped into the text are uploaded and placed there
      handlePaste: (_view, event) => {
        const files = [...(event.clipboardData?.files ?? [])]
        if (!files.some((f) => f.type.startsWith('image/'))) return false
        insertImages(editor, uploadUrl, files, status)
        return true
      },
      handleDrop: (view, event, _slice, moved) => {
        if (dropImage(view, event, moved)) return true
        const files = [...(event.dataTransfer?.files ?? [])]
        if (moved || !files.some((f) => f.type.startsWith('image/'))) return false
        const at = view.posAtCoords({ left: event.clientX, top: event.clientY })
        insertImages(editor, uploadUrl, files, status, at?.pos)
        event.preventDefault()
        return true
      },
      handleClick: (_view, _pos, event) => {
        const anchor = (event.target as HTMLElement | null)?.closest?.('a[href]')
        const href = anchor?.getAttribute('href')
        const blogId = href?.match(BLOG_HREF)?.[1]
        // A blog link opens that blog's form
        if (blogId) window.open(`/blogs/${blogId}`, '_blank', 'noopener')
        else if (href && /^(https?:\/\/|mailto:)/i.test(href)) window.open(href, '_blank', 'noopener,noreferrer')
        return false
      },
    },
    onUpdate: ({ editor }) => {
      input.value = JSON.stringify(editor.getJSON())
      // Lets the form know there are unsaved changes
      input.dispatchEvent(new Event('input', { bubbles: true }))
    },
    onTransaction: () => refreshToolbar(),
    onFocus: () => root.classList.add('focused'),
    onBlur: () => root.classList.remove('focused'),
  })

  function refreshToolbar() {
    for (const button of buttons) {
      const command = COMMANDS[button.dataset.cmd ?? '']
      if (!command) continue
      if (command.active) button.setAttribute('aria-pressed', String(command.active(editor)))
      if (command.enabled) button.disabled = !command.enabled(editor)
    }
  }

  // Keep the editor's selection when a toolbar button is pressed
  root.querySelector('[data-toolbar]')?.addEventListener('mousedown', (event) => {
    if ((event.target as HTMLElement).closest('button')) event.preventDefault()
  })
  const openLink = linkDialog(root, editor)
  const commands: Record<string, Command> = {
    ...COMMANDS,
    link: { ...COMMANDS.link, run: openLink },
    image: { run: () => fileInput?.click() },
  }
  fileInput?.addEventListener('change', () => {
    const files = [...(fileInput.files ?? [])]
    fileInput.value = ''
    insertImages(editor, uploadUrl, files, status)
  })
  for (const button of buttons) {
    button.addEventListener('click', () => commands[button.dataset.cmd ?? '']?.run(editor))
  }

  // Clicking the label or an error moves into the text
  root.addEventListener('focus-editor', () => editor.commands.focus())
  refreshToolbar()
}

for (const root of document.querySelectorAll<HTMLElement>('[data-rich-editor]')) mount(root)
