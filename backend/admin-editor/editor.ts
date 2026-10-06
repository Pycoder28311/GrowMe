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

/** Asks for a link; empty removes it. Plain addresses get https:// in front. */
function editLink(editor: Editor) {
  const current = (editor.getAttributes('link').href as string | undefined) ?? ''
  const answer = window.prompt('Διεύθυνση συνδέσμου (κενό για αφαίρεση):', current || 'https://')
  if (answer === null) return
  const text = answer.trim()
  if (text === '' || text === 'https://') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  const href = /^(https?:\/\/|mailto:)/i.test(text) ? text : `https://${text}`
  editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
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
  link: { run: editLink, active: (e) => e.isActive('link') },
  bulletList: { run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive('bulletList') },
  orderedList: { run: (e) => e.chain().focus().toggleOrderedList().run(), active: (e) => e.isActive('orderedList') },
  blockquote: { run: (e) => e.chain().focus().toggleBlockquote().run(), active: (e) => e.isActive('blockquote') },
  alignLeft: {
    run: (e) => e.chain().focus().setTextAlign('left').run(),
    active: (e) => e.isActive({ textAlign: 'left' }),
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
          openOnClick: false,
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
      attributes: { 'aria-label': root.dataset.label ?? 'Κείμενο', 'aria-multiline': 'true', role: 'textbox' },
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
  for (const button of buttons) {
    button.addEventListener('click', () => COMMANDS[button.dataset.cmd ?? '']?.run(editor))
  }

  // Clicking the label or an error moves into the text
  root.addEventListener('focus-editor', () => editor.commands.focus())
  refreshToolbar()
}

for (const root of document.querySelectorAll<HTMLElement>('[data-rich-editor]')) mount(root)
