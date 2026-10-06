// The dashboard's article editor (Tiptap, Word-like basics). Works on the markup of
// resources/admin/ui/rich-text-editor.tsx: it fills [data-editor-area] with the editor, keeps the
// hidden [data-field] input up to date with the document's JSON (admin.client.js sends it), and runs
// the toolbar's [data-cmd] buttons. The server checks and cleans the JSON again (shared rich-text.ts).
import { Editor } from '@tiptap/core'
import TextAlign from '@tiptap/extension-text-align'
import { Placeholder } from '@tiptap/extensions'
import StarterKit from '@tiptap/starter-kit'

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

/**
 * The link dialog of one editor: opens with the selected text (or the link under the cursor) and
 * applies text + address. Same text as before keeps its other formatting (bold…); new text replaces it.
 */
function linkDialog(root: HTMLElement, editor: Editor) {
  const dialog = root.querySelector<HTMLDialogElement>('[data-link-dialog]')
  const textInput = root.querySelector<HTMLInputElement>('[data-link-text]')
  const hrefInput = root.querySelector<HTMLInputElement>('[data-link-href]')
  const error = root.querySelector<HTMLElement>('[data-link-error]')
  const removeButton = root.querySelector<HTMLButtonElement>('[data-link-remove]')
  if (!dialog || !textInput || !hrefInput || !error || !removeButton) return () => {}

  let range = { from: 0, to: 0 }
  let originalText = ''

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
    const text = textInput!.value.trim() || hrefInput!.value.trim()
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
    hrefInput.value = editing ? ((editor.getAttributes('link').href as string | undefined) ?? '') : ''
    error.textContent = ''
    removeButton.hidden = !editing
    dialog.showModal()
    ;(originalText ? hrefInput : textInput).focus()
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
          HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: null },
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
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
      handleClick: (_view, _pos, event) => {
        const anchor = (event.target as HTMLElement | null)?.closest?.('a[href]')
        const href = anchor?.getAttribute('href')
        if (href && /^(https?:\/\/|mailto:)/i.test(href)) window.open(href, '_blank', 'noopener,noreferrer')
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
  const commands: Record<string, Command> = { ...COMMANDS, link: { ...COMMANDS.link, run: openLink } }
  for (const button of buttons) {
    button.addEventListener('click', () => commands[button.dataset.cmd ?? '']?.run(editor))
  }

  // Clicking the label or an error moves into the text
  root.addEventListener('focus-editor', () => editor.commands.focus())
  refreshToolbar()
}

for (const root of document.querySelectorAll<HTMLElement>('[data-rich-editor]')) mount(root)
