import type { SearchBlog, SearchPlant } from '@growme/shared';

type Preview = { type: 'plant'; item: SearchPlant } | { type: 'blog'; item: SearchBlog };

// What a tapped search result already knows (photo, name, ...), so the page opening from it can show
// that while the rest loads, the same as the zoom did
const previews = new Map<string, Preview['item']>();

export const rememberPreview = ({ type, item }: Preview) => previews.set(`${type}-${item.id}`, item);
export const previewOf = (type: 'plant', id: number) => previews.get(`${type}-${id}`) as SearchPlant | undefined;
export const blogPreviewOf = (id: number) => previews.get(`blog-${id}`) as SearchBlog | undefined;
