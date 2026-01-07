/**
 * Mock implementations of Tauri APIs for Storybook.
 * These return placeholder data since Tauri commands don't work in browser context.
 */

export interface ImageInfo {
  id: string;
  path: string;
  name: string;
  size: number;
  width: number | null;
  height: number | null;
}

export async function pickFolder(): Promise<string | null> {
  console.warn("[Storybook Mock] pickFolder called - returning null");
  return null;
}

export async function listImages(_folder: string): Promise<ImageInfo[]> {
  console.warn("[Storybook Mock] listImages called - returning empty array");
  return [];
}

export async function getThumbnail(
  _path: string,
  size?: number
): Promise<string> {
  // Return a placeholder image from picsum
  const s = size || 150;
  return `https://picsum.photos/${s}`;
}

export async function getImageDataUrl(_path: string): Promise<string> {
  // Return a larger placeholder image
  return "https://picsum.photos/1920/1080";
}

export async function executeTriage(
  _sessionName: string,
  _sourceFolder: string,
  _keepFiles: string[],
  _maybeFiles: string[],
  _yeetFiles: string[]
): Promise<void> {
  console.warn("[Storybook Mock] executeTriage called - no-op");
}

export async function moveToTrash(_paths: string[]): Promise<void> {
  console.warn("[Storybook Mock] moveToTrash called - no-op");
}
