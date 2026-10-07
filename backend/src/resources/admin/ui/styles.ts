// The dashboard's CSS, served as /admin.css. Tokens copy the app's theme (app/src/theme) so admin pages
// look like the app: same colors, 3 text sizes, few spacings, rounded white cards with soft shadows.

const TOKENS = `
  --primary: #2f7a3e;
  --primary-soft: #dcefe0;
  --accent: #f28c28;
  --ink: #1f3d24;
  --ink-muted: rgba(31, 61, 36, 0.7);
  --surface: #ffffff;
  --border: #e5e7eb;
  --surface-muted: #f3f4f6;
  --danger: #b42318;
  --link: #1e73d8;
  --outline: rgba(31, 61, 36, 0.05);
  --text-small: 12px;
  --text-normal: 16px;
  --text-big: 24px;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --radius-sm: 12px;
  --radius-md: 16px;
  --touch: 48px;
  --shadow-card: 0 3px 10px rgba(31, 61, 36, 0.1);
  --shadow-raised: 0 4px 12px rgba(31, 61, 36, 0.14), 0 1px 3px rgba(31, 61, 36, 0.1);
  --shadow-button: 0 2px 6px -1px rgba(31, 61, 36, 0.25);
`

export const ADMIN_CSS = `
:root { ${TOKENS} }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Source Sans 3', system-ui, sans-serif; font-size: var(--text-normal); color: var(--ink);
       background: linear-gradient(to bottom, rgba(242, 140, 40, 0.25), var(--surface) 320px) no-repeat, var(--surface);
       min-height: 100vh; }
main { max-width: 960px; margin: 0 auto; padding: var(--space-lg) var(--space-md) 120px; }
main.narrow { max-width: 640px; }
a { color: var(--primary); }
h1 { margin: 0; font-size: var(--text-big); color: var(--primary); }
h2 { font-size: var(--text-normal); margin: var(--space-lg) 0 var(--space-sm); }
.muted { color: var(--ink-muted); }
.small { font-size: var(--text-small); }
.hidden, [hidden] { display: none !important; }

/* Header */
.top { display: flex; align-items: center; justify-content: space-between; gap: var(--space-md); flex-wrap: wrap;
       margin-bottom: var(--space-lg); }
.top .back { display: inline-block; font-size: var(--text-small); font-weight: 700; text-decoration: none;
             margin-bottom: var(--space-xs); }
.logout { color: var(--accent); font-weight: 700; text-decoration: none; }

/* Cards and grids */
.card { background: var(--surface); border: 1px solid var(--outline); border-radius: var(--radius-md);
        padding: var(--space-md); box-shadow: var(--shadow-card); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--space-sm); }
a.card { display: block; color: inherit; text-decoration: none; transition: transform .15s, box-shadow .15s; }
a.card:hover { transform: translateY(-2px); box-shadow: var(--shadow-raised); }
.count { font-size: var(--text-big); font-weight: 700; color: var(--primary); }
.label { font-size: var(--text-small); color: var(--ink-muted); }

/* Buttons */
.button { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-sm);
          min-height: var(--touch); padding: 0 var(--space-lg); border-radius: 999px; border: 0;
          font: inherit; font-weight: 700; cursor: pointer; text-decoration: none;
          background: var(--primary); color: var(--surface); box-shadow: var(--shadow-button); }
.button.secondary { background: var(--surface); color: var(--primary); }
.button.danger { background: var(--surface); color: var(--danger); }
.button:disabled { opacity: .6; cursor: progress; }
.icon-button { width: 32px; height: 32px; border-radius: 999px; border: 0; background: var(--surface);
               color: var(--ink); cursor: pointer; font: inherit; box-shadow: 0 1px 2px rgba(31, 61, 36, 0.1); }
.icon-button:hover { color: var(--primary); }
.icon-button.remove:hover { color: var(--danger); }
.icon-button:disabled { opacity: .3; cursor: default; }

/* List page */
.head-actions { display: flex; justify-content: flex-end; }
.items { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-md); }
.item, a.card.item { display: flex; gap: var(--space-md); align-items: center; padding: var(--space-sm); }
.item .thumb { width: 72px; height: 72px; border-radius: var(--radius-sm); object-fit: cover;
               background: var(--primary-soft); flex: none; display: grid; place-items: center; font-size: var(--text-big); }
.item .name { font-weight: 700; overflow-wrap: anywhere; }
.item-text { flex: 1; min-width: 0; }
.item .line { overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2;
              -webkit-box-orient: vertical; overflow-wrap: anywhere; }
.item > .remove { flex: none; align-self: flex-start; }
.empty { text-align: center; padding: var(--space-lg); }
.more { display: flex; justify-content: center; margin-top: var(--space-lg); }

/* Form */
.form { display: flex; flex-direction: column; gap: var(--space-lg); }
.banner { border-radius: var(--radius-sm); padding: var(--space-sm) var(--space-md); background: #fdecea;
          color: var(--danger); font-weight: 700; }
.field { display: flex; flex-direction: column; gap: var(--space-xs); min-width: 0; }
.field > .caption { font-size: var(--text-small); color: var(--ink-muted); }
.field .error { margin: 0; font-size: var(--text-small); color: var(--danger); }
.field .error:empty { display: none; }
.field.invalid input, .field.invalid textarea, .field.invalid select { border-color: var(--danger); }
input[type=text], input[type=number], input[type=url], textarea, select {
  width: 100%; font: inherit; color: var(--ink); background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius-sm); padding: var(--space-sm) var(--space-sm); }
input:focus, textarea:focus, select:focus, button:focus-visible {
  outline: 2px solid var(--primary-soft); outline-offset: 1px; border-color: var(--primary); }
textarea { resize: vertical; min-height: 72px; line-height: 1.4; }
.meta { display: flex; flex-wrap: wrap; gap: var(--space-sm); margin-top: var(--space-xs); }
.badge { display: inline-flex; align-items: center; gap: var(--space-xs); padding: var(--space-xs) var(--space-sm);
         border-radius: 999px; background: var(--primary-soft); color: var(--primary); font-size: var(--text-small);
         font-weight: 700; }
input.big { font-size: var(--text-big); font-weight: 700; }
input.small { font-size: var(--text-small); color: var(--ink-muted); }
.row { display: flex; gap: var(--space-sm); align-items: flex-end; flex-wrap: wrap; }
.row > .field { flex: 1 1 80px; }
.dash { padding-bottom: var(--space-sm); color: var(--ink-muted); }

/* Title block: name (big) with the price on the right, like the app's plant page */
.title-row { display: flex; gap: var(--space-md); align-items: flex-start; flex-wrap: wrap; }
.title-row > .field { flex: 1 1 260px; }
.price { flex: 0 1 240px; flex-wrap: nowrap; }
.price > .field { flex: 1 1 0; }
.price input { color: var(--accent); font-weight: 700; }

/* Facts card: emoji rows */
.facts { display: flex; flex-direction: column; gap: var(--space-md); }
.fact { display: flex; gap: var(--space-sm); align-items: flex-start; }
.fact > .emoji { width: 28px; padding-top: 22px; text-align: center; }
.fact > .field, .fact > .row { flex: 1; }
.toggles { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
.toggle { display: inline-flex; align-items: center; gap: var(--space-sm); min-height: 40px; padding: 0 var(--space-md);
          border-radius: 999px; background: var(--primary-soft); color: var(--primary); cursor: pointer; user-select: none; }
.toggle input { accent-color: var(--primary); width: 18px; height: 18px; margin: 0; }
.choices { display: flex; gap: var(--space-xs); flex-wrap: wrap; }
.choice { position: relative; }
.choice input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
.choice span { display: grid; place-items: center; min-width: 40px; height: 40px; padding: 0 var(--space-sm);
               border-radius: 999px; border: 1px solid var(--border); font-weight: 700; }
.choice input:checked + span { background: var(--primary); border-color: var(--primary); color: var(--surface); }
.choice input:focus-visible + span { outline: 2px solid var(--primary-soft); outline-offset: 1px; }

/* Section titles inside the form (like the app's Section) */
.section { display: flex; flex-direction: column; gap: var(--space-sm); }
.section > .head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-sm); }
.section > .head h2 { margin: 0; }

/* Repeatable lists */
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-sm); }
.list.soft { background: var(--primary-soft); border-radius: var(--radius-sm); padding: var(--space-sm); }
.list-row { display: flex; gap: var(--space-sm); align-items: flex-start; background: var(--surface);
            border-radius: var(--radius-sm); padding: var(--space-sm); border: 1px solid var(--outline); }
.list-row.dragging { opacity: .4; }
.list-row.drop-before { box-shadow: 0 -3px 0 var(--primary); }
.list-row.drop-after { box-shadow: 0 3px 0 var(--primary); }
.list-row > .fields { flex: 1; display: flex; flex-direction: column; gap: var(--space-sm); min-width: 0; }
.list-row > .tools { display: flex; flex-direction: column; gap: var(--space-xs); align-items: center; }
.handle { cursor: grab; color: var(--ink-muted); width: 32px; height: 32px; display: grid; place-items: center;
          user-select: none; font-size: var(--text-normal); }
.list-empty { font-size: var(--text-small); color: var(--ink-muted); padding: var(--space-sm); }
.list:not(:empty) + .list-empty { display: none; }
.add { align-self: flex-start; }
.add-buttons { display: flex; flex-wrap: wrap; gap: var(--space-xs); justify-content: flex-end; }

/* Search select: a text box with a results list under it */
.search-select { position: relative; }
.search-results { position: absolute; z-index: 4; top: 100%; left: 0; right: 0; margin: var(--space-xs) 0 0; padding: var(--space-xs);
                  list-style: none; max-height: 320px; overflow-y: auto; background: var(--surface);
                  border-radius: var(--radius-sm); box-shadow: var(--shadow-raised); }
.search-results li { padding: var(--space-xs) var(--space-sm); border-radius: var(--radius-sm); cursor: pointer; }
.search-results li .name { font-weight: 700; }
.search-results li .small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.search-results li.active, .search-results li[data-value]:hover { background: var(--primary-soft); }
.search-results li.none { color: var(--ink-muted); cursor: default; }
.field.search-select.invalid input[data-search] { border-color: var(--danger); }
.picked-text { margin: 0; white-space: pre-wrap; }

/* Blog links in texts: the button over a selection, the picker's list, the links line under a field */
.link-pill { position: absolute; z-index: 5; width: 220px; min-height: 32px; border: 0; border-radius: 999px;
             background: var(--link); color: var(--surface); font: inherit; font-size: var(--text-small);
             font-weight: 700; cursor: pointer; box-shadow: var(--shadow-raised); }
.search-results.in-dialog { position: static; max-height: 300px; margin: var(--space-sm) 0 var(--space-md);
                            box-shadow: none; border: 1px solid var(--border); }
.links-line { color: var(--link); overflow-wrap: anywhere; }
.links-line:empty { display: none; }
.link-tabs { display: flex; gap: var(--space-xs); margin-bottom: var(--space-sm); }
.link-tab { flex: 1; min-height: 36px; border: 1px solid var(--border); border-radius: 999px; background: var(--surface);
            color: var(--ink); font: inherit; font-weight: 700; cursor: pointer; }
.link-tab[aria-selected="true"] { background: var(--primary-soft); border-color: var(--primary); color: var(--primary); }
.picked-text:empty { display: none; }

/* Checklist with search (e.g. a combination's plants) */
.check-picker .row { align-items: center; flex-wrap: nowrap; }
.check-picker [data-filter] { flex: 1; }
.picked-count { white-space: nowrap; }
.checks { list-style: none; margin: 0; padding: 0; max-height: 420px; overflow-y: auto; display: flex; flex-direction: column;
          gap: 2px; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: var(--space-xs); }
.check { display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-xs); border-radius: var(--radius-sm);
         cursor: pointer; }
.check:hover { background: var(--surface-muted); }
.check input { accent-color: var(--primary); width: 18px; height: 18px; margin: 0; flex: none; }
.check:has(input:checked) { background: var(--primary-soft); }
.check-thumb { width: 40px; height: 40px; border-radius: var(--radius-sm); object-fit: cover; flex: none;
               background: var(--primary-soft); display: grid; place-items: center; }
.check-text { display: flex; flex-direction: column; min-width: 0; }
.check-text .name { font-weight: 700; overflow-wrap: anywhere; }

/* Images (a wide strip like the app's gallery) */
.gallery { border-radius: var(--radius-md); background: var(--primary-soft); padding: var(--space-sm); }
.gallery .list { flex-direction: row; flex-wrap: wrap; }
.gallery .list-row { flex-direction: column; align-items: stretch; padding: var(--space-xs); width: 160px; }
.gallery img { width: 100%; height: 120px; object-fit: cover; border-radius: var(--radius-sm); display: block; }
.gallery .tools { flex-direction: row; justify-content: space-between; }
.gallery .cover { font-size: var(--text-small); font-weight: 700; color: var(--primary); }
.gallery .list-row:not(:first-child) .cover { visibility: hidden; }
.upload { display: flex; align-items: center; gap: var(--space-sm); flex-wrap: wrap; margin-top: var(--space-sm); }
.upload input[type=file] { font-size: var(--text-small); }

/* Rich text editor (Tiptap): toolbar + the text, styled like the app's article page */
.rich { border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.rich.focused { border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary-soft); }
.field.rich.invalid { border-color: var(--danger); }
.rich > .error { padding: 0 var(--space-md) var(--space-sm); }
.toolbar { position: sticky; top: 0; z-index: 2; display: flex; flex-wrap: wrap; gap: var(--space-xs);
           padding: var(--space-xs); background: var(--surface); border-bottom: 1px solid var(--border);
           border-radius: var(--radius-md) var(--radius-md) 0 0; }
.tool-group { display: flex; gap: 2px; padding-right: var(--space-xs); border-right: 1px solid var(--border); }
.tool-group:last-child { border-right: 0; }
.tool { min-width: 34px; height: 34px; padding: 0 var(--space-xs); border: 0; border-radius: var(--radius-sm);
        background: transparent; color: var(--ink); font: inherit; font-weight: 700; cursor: pointer; }
.tool:hover { background: var(--surface-muted); }
.tool[aria-pressed="true"] { background: var(--border); color: var(--ink); }
.tool:disabled { opacity: .35; cursor: default; background: transparent; }
.tool-italic { font-style: italic; }
.tool-underline { text-decoration: underline; }
.tool-strike { text-decoration: line-through; }
.tool .icon { display: block; margin: 0 auto; }

/* Images inside the text: a block, dragged up or down; its panel shows while it is selected */
.ProseMirror .article-image { position: relative; margin: var(--space-md) auto; cursor: grab; }
.ProseMirror .article-image.w-25 { width: 25%; }
.ProseMirror .article-image.w-50 { width: 50%; }
.ProseMirror .article-image.w-75 { width: 75%; }
.ProseMirror .article-image.w-100 { width: 100%; }
.ProseMirror .article-image img { display: block; width: 100%; height: auto; border-radius: var(--radius-md);
                                   background: var(--surface-muted); min-height: 48px; }
.ProseMirror .article-image.selected img { outline: 3px solid var(--primary); outline-offset: 2px; }
.ProseMirror .article-image.ProseMirror-selectednode { outline: none; }
.image-panel { display: none; position: absolute; top: var(--space-sm); left: 50%; transform: translateX(-50%);
               z-index: 3; align-items: center; gap: var(--space-xs); padding: var(--space-xs);
               background: var(--surface); border-radius: var(--radius-sm); box-shadow: var(--shadow-raised);
               cursor: default; white-space: nowrap; }
.article-image.selected .image-panel { display: flex; }
.image-sizes { display: flex; gap: 2px; }
.image-tool { display: inline-flex; align-items: center; gap: var(--space-xs); height: 32px; padding: 0 var(--space-sm);
              border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--ink);
              font: inherit; font-size: var(--text-small); font-weight: 700; cursor: pointer; }
.image-tool:hover { background: var(--surface-muted); }
.image-tool[aria-pressed="true"] { background: var(--border); }
.image-delete { color: var(--danger); }
.image-panel input { width: 160px; height: 32px; padding: 0 var(--space-sm); font-size: var(--text-small); }
.upload-status { margin: 0; padding: 0 var(--space-md); }
.upload-status:empty { display: none; }

/* Link dialog */
.link-dialog { width: min(440px, calc(100vw - 32px)); border: 0; border-radius: var(--radius-md); padding: var(--space-lg);
               box-shadow: var(--shadow-raised); color: var(--ink); }
.link-dialog::backdrop { background: rgba(31, 61, 36, 0.3); }
.link-dialog h3 { margin: 0 0 var(--space-md); font-size: var(--text-normal); }
.link-dialog .field { margin-bottom: var(--space-md); }
.dialog-actions { display: flex; flex-wrap: wrap; gap: var(--space-sm); align-items: center; }
.dialog-actions .spacer { flex: 1; }
.dialog-actions .button { min-height: 40px; padding: 0 var(--space-md); }
.rich-area { padding: var(--space-md); min-height: 360px; }
.rich-area .ProseMirror { min-height: 340px; outline: none; line-height: 1.6; }
.ProseMirror { position: relative; word-wrap: break-word; white-space: pre-wrap; white-space: break-spaces;
               font-variant-ligatures: none; font-feature-settings: "liga" 0; }
.ProseMirror li { position: relative; }
.ProseMirror-hideselection *::selection { background: transparent; }
.ProseMirror-hideselection { caret-color: transparent; }
.ProseMirror-selectednode { outline: 2px solid var(--primary); }
.ProseMirror-separator { display: inline !important; border: none !important; margin: 0 !important; }
.ProseMirror-gapcursor { display: none; pointer-events: none; position: absolute; }
.ProseMirror-gapcursor:after { content: ""; display: block; position: absolute; top: -2px; width: 20px;
                               border-top: 1px solid var(--ink); animation: gapcursor 1.1s steps(2, start) infinite; }
@keyframes gapcursor { to { visibility: hidden; } }
.ProseMirror-focused .ProseMirror-gapcursor { display: block; }
.ProseMirror p { margin: 0 0 var(--space-sm); }
.ProseMirror h2 { font-size: var(--text-big); margin: var(--space-lg) 0 var(--space-sm); color: var(--ink); }
.ProseMirror h3 { font-size: 20px; margin: var(--space-md) 0 var(--space-xs); color: var(--ink); }
.ProseMirror > :first-child { margin-top: 0; }
.ProseMirror ul, .ProseMirror ol { padding-left: var(--space-lg); margin: 0 0 var(--space-sm); }
.ProseMirror li > p { margin: 0; }
.ProseMirror li::marker { color: var(--primary); }
.ProseMirror blockquote { margin: 0 0 var(--space-sm); padding: var(--space-xs) var(--space-md);
                          border-left: 4px solid var(--primary); background: var(--primary-soft);
                          border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.ProseMirror hr { border: 0; border-top: 2px solid var(--border); margin: var(--space-md) 0; }
.ProseMirror hr.ProseMirror-selectednode { border-top-color: var(--primary); outline: none; }
.ProseMirror a { color: var(--primary); text-decoration: underline; cursor: pointer; }
.ProseMirror a[href^="blog:"] { color: var(--link); text-decoration: none; }
.ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; height: 0;
                                                      color: var(--ink-muted); pointer-events: none; }

/* Sticky save bar and toast */
.save-bar { position: fixed; left: 0; right: 0; bottom: 0; padding: var(--space-md);
            background: linear-gradient(to top, var(--surface) 60%, rgba(255, 255, 255, 0)); }
.save-bar > div { max-width: 640px; margin: 0 auto; display: flex; gap: var(--space-sm); justify-content: flex-end; }
.save-bar .button[type=submit] { flex: 1; max-width: 320px; }
.toast.error { background: var(--danger); }
.toast { position: fixed; top: var(--space-md); left: 50%; transform: translateX(-50%); z-index: 10;
         background: var(--primary); color: var(--surface); font-weight: 700; padding: var(--space-sm) var(--space-lg);
         border-radius: 999px; box-shadow: var(--shadow-raised); }

@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`
