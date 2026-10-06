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
  --danger: #b42318;
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
.hidden { display: none !important; }

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
.card.soon { opacity: .55; }
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
.item .name { font-weight: 700; }
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
input[type=text], input[type=number], textarea, select {
  width: 100%; font: inherit; color: var(--ink); background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius-sm); padding: var(--space-sm) var(--space-sm); }
input:focus, textarea:focus, select:focus, button:focus-visible {
  outline: 2px solid var(--primary-soft); outline-offset: 1px; border-color: var(--primary); }
textarea { resize: vertical; min-height: 72px; line-height: 1.4; }
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

/* Sticky save bar and toast */
.save-bar { position: fixed; left: 0; right: 0; bottom: 0; padding: var(--space-md);
            background: linear-gradient(to top, var(--surface) 60%, rgba(255, 255, 255, 0)); }
.save-bar > div { max-width: 640px; margin: 0 auto; display: flex; gap: var(--space-sm); justify-content: flex-end; }
.save-bar .button[type=submit] { flex: 1; max-width: 320px; }
.toast { position: fixed; top: var(--space-md); left: 50%; transform: translateX(-50%); z-index: 10;
         background: var(--primary); color: var(--surface); font-weight: 700; padding: var(--space-sm) var(--space-lg);
         border-radius: 999px; box-shadow: var(--shadow-raised); }

@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`
