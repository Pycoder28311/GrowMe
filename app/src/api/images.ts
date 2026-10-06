import type { ImageRef } from '@growme/shared';
import { File as ExpoFile } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import { request } from './client';

/** Uploads all picked images in a single request (signed in); answers [{ id, url }] in the same order */
export function uploadImages(assets: ImagePickerAsset[]) {
  const form = new FormData();
  for (const asset of assets) {
    // Web gives a browser File; native wraps the local file (expo/fetch needs a Blob, not a uri)
    form.append('files', asset.file ?? new ExpoFile(asset.uri));
  }
  return request<ImageRef[]>('/images', { method: 'POST', body: form });
}
