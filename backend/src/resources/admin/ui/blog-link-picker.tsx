import { SearchOptions, type SearchOption } from './search-select'

/**
 * Lets the admin turn selected words of a `blogLinks` text field into a link to a blog, stored in
 * the text as `[words](blog:12)` (the app shows the words in blue and opens the blog). Render it once
 * per form that has such fields: the blogs to pick from (searched in the browser), the «🔗» button
 * that shows over a selection, and the dialog. admin.client.js does the rest. The article editor's
 * link dialog reads the same blog list.
 */
export function BlogLinkPicker(props: { options: SearchOption[] }) {
  return (
    <>
      <SearchOptions source="blogs" options={props.options} />
      <button type="button" class="link-pill" data-blog-link-pill hidden>
        🔗 Σύνδεσμος σε άρθρο
      </button>
      <dialog class="link-dialog" data-blog-link-dialog aria-label="Σύνδεσμος σε άρθρο">
        <h3>Σύνδεσμος σε άρθρο</h3>
        <p class="small muted" data-blog-link-words />
        <div class="field">
          <input
            type="text"
            placeholder="Αναζήτηση άρθρου…"
            aria-label="Αναζήτηση άρθρου"
            autocomplete="off"
            data-blog-link-search
          />
        </div>
        <ul class="search-results in-dialog" role="listbox" data-blog-link-results />
        <div class="dialog-actions">
          <button type="button" class="button danger" data-blog-link-remove hidden>
            Αφαίρεση συνδέσμου
          </button>
          <span class="spacer" />
          <button type="button" class="button secondary" data-blog-link-cancel>
            Άκυρο
          </button>
        </div>
      </dialog>
    </>
  )
}
