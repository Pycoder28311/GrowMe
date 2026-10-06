// Article images: blocks between lines of text that can be dragged up or down (like Word's "in line
// with text"). Clicking one selects it and shows its panel: width (25–100 %), a description, delete.
// Only images uploaded to our storage: the document keeps their id; `src` is only for showing them
// here (the server drops it). Images pasted from other sites as HTML are ignored.
import type { Editor } from '@tiptap/core'
import Image from '@tiptap/extension-image'
import type { Node as PMNode } from '@tiptap/pm/model'
import { NodeSelection } from '@tiptap/pm/state'
import type { EditorView, NodeView } from '@tiptap/pm/view'

export const WIDTHS = [25, 50, 75, 100] as const

const svg = (paths: string) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
// Lucide "trash-2" (ISC licence)
const TRASH = svg('<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>')

function button(label: string, html: string, className = 'image-tool') {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = className
  b.title = label
  b.setAttribute('aria-label', label)
  b.innerHTML = html
  return b
}

/** The image as the editor shows it: the photo, and its panel while selected */
class ImageView implements NodeView {
  dom: HTMLElement
  private node: PMNode
  private img: HTMLImageElement
  private panel: HTMLElement
  private sizes: HTMLButtonElement[]
  private alt: HTMLInputElement
  private selected = false

  constructor(
    node: PMNode,
    private editor: Editor,
    private getPos: () => number | undefined,
  ) {
    this.node = node
    this.dom = document.createElement('figure')
    this.dom.contentEditable = 'false'

    this.img = document.createElement('img')
    this.img.draggable = false // the whole block is dragged (by ProseMirror), not the picture file

    this.panel = document.createElement('div')
    this.panel.className = 'image-panel'
    this.panel.setAttribute('role', 'toolbar')
    this.panel.setAttribute('aria-label', 'Ρυθμίσεις εικόνας')

    const sizeGroup = document.createElement('div')
    sizeGroup.className = 'image-sizes'
    this.sizes = WIDTHS.map((width) => {
      const b = button(`Πλάτος ${width}%`, `${width}%`)
      b.dataset.width = String(width)
      b.addEventListener('click', () => this.set({ width }))
      sizeGroup.append(b)
      return b
    })

    this.alt = document.createElement('input')
    this.alt.type = 'text'
    this.alt.maxLength = 300
    this.alt.placeholder = 'Περιγραφή εικόνας'
    this.alt.setAttribute('aria-label', 'Περιγραφή εικόνας (για όσους δεν βλέπουν την εικόνα)')
    this.alt.addEventListener('change', () => this.set({ alt: this.alt.value.trim() }))
    this.alt.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        this.alt.blur()
      }
    })

    const remove = button('Διαγραφή εικόνας', `${TRASH}<span>Διαγραφή</span>`, 'image-tool image-delete')
    remove.addEventListener('click', () => this.remove())

    this.panel.append(sizeGroup, this.alt, remove)
    this.dom.append(this.img, this.panel)
    this.render()
  }

  private render() {
    const { src, alt, width } = this.node.attrs as { src: string | null; alt: string; width: number }
    this.dom.className = `article-image w-${width}${this.selected ? ' selected' : ''}`
    if (src && this.img.getAttribute('src') !== src) this.img.src = src
    this.img.alt = alt
    if (document.activeElement !== this.alt) this.alt.value = alt
    for (const b of this.sizes) b.setAttribute('aria-pressed', String(Number(b.dataset.width) === width))
  }

  /** Changes attributes and keeps the image selected (its panel stays open) */
  private set(attrs: Record<string, unknown>) {
    const pos = this.getPos()
    if (pos === undefined) return
    const tr = this.editor.state.tr.setNodeMarkup(pos, undefined, { ...this.node.attrs, ...attrs })
    this.editor.view.dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)))
  }

  private remove() {
    const pos = this.getPos()
    if (pos === undefined) return
    this.editor.chain().focus().deleteRange({ from: pos, to: pos + this.node.nodeSize }).run()
  }

  update(node: PMNode) {
    if (node.type !== this.node.type) return false
    this.node = node
    this.render()
    return true
  }

  selectNode() {
    this.selected = true
    this.dom.classList.add('selected')
  }

  deselectNode() {
    this.selected = false
    this.dom.classList.remove('selected')
  }

  /** Clicks and typing inside the panel belong to the panel, not to the text */
  stopEvent(event: Event) {
    return this.panel.contains(event.target as Node)
  }

  ignoreMutation() {
    return true
  }
}

export const ArticleImage = Image.extend({
  draggable: true,

  addAttributes() {
    // None rendered as HTML attributes: the view above draws them
    return {
      src: { default: null, rendered: false },
      imageId: { default: null, rendered: false },
      width: { default: 100, rendered: false },
      alt: { default: '', rendered: false },
      ratio: { default: null, rendered: false },
    }
  },

  // Pasted HTML images (from other sites) are not files in our storage: ignore them
  parseHTML() {
    return []
  },

  renderHTML({ node }) {
    return ['figure', { class: `article-image w-${node.attrs.width}` }, ['img', { src: node.attrs.src, alt: node.attrs.alt }]]
  },

  addNodeView() {
    return ({ node, editor, getPos }) => new ImageView(node, editor, getPos as () => number | undefined)
  },
}).configure({ inline: false, allowBase64: false })

/* ─────────────── Moving by drag (like Word) ─────────────── */

type DraggingView = EditorView & { dragging?: { node?: NodeSelection } | null }

/**
 * Drops a dragged image above or below the block under the pointer, by height: the lower half of a
 * line puts it after that line, the upper half before (ProseMirror on its own decides by the pointer's
 * place in the text, which feels wrong for pictures). Returns false for anything else.
 */
export function dropImage(view: EditorView, event: DragEvent, moved: boolean): boolean {
  const dragging = (view as DraggingView).dragging?.node
  const selected = view.state.selection
  const source = dragging ?? (selected instanceof NodeSelection ? selected : null)
  if (!moved || !source || source.node.type.name !== 'image') return false

  const at = view.posAtCoords({ left: event.clientX, top: event.clientY })
  if (!at) return false
  const $pos = view.state.doc.resolve(at.pos)
  // The top-level block under the pointer (a paragraph, heading, list, image…)
  const blockPos = $pos.depth >= 1 ? $pos.before(1) : at.inside >= 0 ? view.state.doc.resolve(at.inside).before(1) : null
  if (blockPos === null) return false
  const block = view.state.doc.nodeAt(blockPos)
  const dom = view.nodeDOM(blockPos) as HTMLElement | null
  if (!block || !dom || blockPos === source.from) return false

  const rect = dom.getBoundingClientRect()
  const target = event.clientY > rect.top + rect.height / 2 ? blockPos + block.nodeSize : blockPos
  const tr = view.state.tr.delete(source.from, source.to)
  const insertAt = tr.mapping.map(target)
  tr.insert(insertAt, source.node)
  view.dispatch(tr.setSelection(NodeSelection.create(tr.doc, insertAt)).scrollIntoView())
  event.preventDefault()
  return true
}

/* ─────────────── Uploading ─────────────── */

const UPLOAD_ERRORS: Record<string, string> = {
  FILE_TOO_LARGE: 'Κάθε εικόνα έως 10 MB.',
  UNSUPPORTED_FILE_TYPE: 'Μόνο εικόνες JPEG, PNG ή WebP.',
  TOO_MANY_FILES: 'Έως 10 εικόνες τη φορά.',
}

/** width ÷ height of a picked file (null when the browser can't read it) */
async function ratioOf(file: File): Promise<number | null> {
  try {
    const bitmap = await createImageBitmap(file)
    const ratio = bitmap.width / bitmap.height
    bitmap.close()
    return Math.min(10, Math.max(0.1, Math.round(ratio * 1000) / 1000))
  } catch {
    return null
  }
}

/**
 * Uploads image files and places them in the text: at `pos` (a drop), or at the cursor. Messages go
 * to `status` ("Ανέβασμα…", or what went wrong).
 */
export async function insertImages(editor: Editor, uploadUrl: string, files: File[], status: HTMLElement, pos?: number) {
  const pictures = files.filter((f) => f.type.startsWith('image/'))
  if (pictures.length === 0) return
  status.textContent = pictures.length > 1 ? `Ανέβασμα ${pictures.length} εικόνων…` : 'Ανέβασμα εικόνας…'
  try {
    const ratios = await Promise.all(pictures.map(ratioOf))
    const body = new FormData()
    for (const file of pictures) body.append('files', file)
    const res = await fetch(uploadUrl, { method: 'POST', body, credentials: 'same-origin' })
    const data = (res.headers.get('content-type') ?? '').includes('json') ? await res.json() : null
    if (!res.ok || !Array.isArray(data)) {
      status.textContent = UPLOAD_ERRORS[data?.code] ?? 'Το ανέβασμα απέτυχε. Δοκίμασε ξανά.'
      return
    }
    const nodes = data.map((image: { id: number; url: string }, i: number) => ({
      type: 'image',
      attrs: { imageId: image.id, src: image.url, width: 100, alt: '', ratio: ratios[i] },
    }))
    const chain = editor.chain().focus()
    if (pos === undefined) chain.insertContent(nodes).run()
    else chain.insertContentAt(pos, nodes).run()
    status.textContent = ''
  } catch {
    status.textContent = 'Δεν ήταν δυνατή η σύνδεση. Δοκίμασε ξανά.'
  }
}
