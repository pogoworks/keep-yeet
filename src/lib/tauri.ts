import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export interface ImageInfo {
  id: string;
  path: string;
  name: string;
  size: number;
  width: number | null;
  height: number | null;
}

export async function pickFolder(): Promise<string | null> {
  const result = await open({
    directory: true,
    multiple: false,
    title: "Select folder with images",
  });
  return result as string | null;
}

export async function listImages(folder: string): Promise<ImageInfo[]> {
  return invoke<ImageInfo[]>("list_images", { folder });
}

export async function getThumbnail(
  path: string,
  size?: number
): Promise<string> {
  return invoke<string>("get_thumbnail", { path, size });
}

export async function getImageDataUrl(path: string): Promise<string> {
  return invoke<string>("get_image_data_url", { path });
}

export async function executeTriage(
  sessionName: string,
  sourceFolder: string,
  keepFiles: string[],
  maybeFiles: string[],
  yeetFiles: string[]
): Promise<void> {
  return invoke("execute_triage", {
    sessionName,
    sourceFolder,
    keepFiles,
    maybeFiles,
    yeetFiles,
  });
}

export async function moveToTrash(paths: string[]): Promise<void> {
  return invoke("move_to_trash", { paths });
}
