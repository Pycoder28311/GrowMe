import type { ImageRef } from '@growme/shared'

function ImageRow(props: { image: ImageRef | null }) {
  return (
    <li class="list-row" data-row data-image-id={props.image ? String(props.image.id) : ''}>
      <img src={props.image?.url ?? ''} alt="" loading="lazy" />
      <div class="tools">
        <span class="handle" data-handle title="Σύρε για αλλαγή σειράς" aria-hidden="true">
          ⠿
        </span>
        <span class="cover">Εξώφυλλο</span>
        <button type="button" class="icon-button" data-move="-1" aria-label="Φωτογραφία: αριστερά">
          ←
        </button>
        <button type="button" class="icon-button" data-move="1" aria-label="Φωτογραφία: δεξιά">
          →
        </button>
        <button type="button" class="icon-button remove" data-remove aria-label="Φωτογραφία: αφαίρεση">
          ✕
        </button>
      </div>
    </li>
  )
}

/**
 * Photos in order (the first is the cover), sent as an id array under `field`. New files upload right
 * away to `uploadUrl` (POST multipart "files" → [{ id, url }]); they're linked only when the form is saved.
 */
export function ImagePicker(props: { field: string; images: ImageRef[]; uploadUrl: string; max?: number }) {
  return (
    <div class="field gallery">
      <ol class="list" data-images={props.field} data-sortable data-max={String(props.max ?? 10)}>
        {props.images.map((image) => (
          <ImageRow image={image} />
        ))}
      </ol>
      <div class="list-empty">Δεν υπάρχουν φωτογραφίες ακόμα.</div>
      <template data-template>
        <ImageRow image={null} />
      </template>
      <div class="upload">
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple data-upload={props.uploadUrl} />
        <span class="small muted" data-upload-status>
          JPEG, PNG ή WebP, έως 10 MB η καθεμία
        </span>
      </div>
      <p class="error" aria-live="polite" />
    </div>
  )
}
