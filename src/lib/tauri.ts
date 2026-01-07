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

// Project system types
export interface ProjectSummary {
  id: string;
  name: string;
  path: string;
  created_at: string;
  updated_at: string | null;
  folder_count: number;
  folder_names: string[];
}

export interface Folder {
  id: string;
  source_path: string;
  output_mode: "move" | "copy";
  added_at: string;
}

export interface Project {
  id: string;
  name: string;
  created_at: string;
  folders: Folder[];
}

export interface FolderStats {
  folder_id: string;
  folder_name: string;
  source_count: number;
  keep_count: number;
  maybe_count: number;
}

export interface ProjectStats {
  total_keep: number;
  total_maybe: number;
  folder_stats: FolderStats[];
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
  projectPath: string,
  folderId: string,
  sourceFolder: string,
  outputMode: "move" | "copy",
  keepFiles: string[],
  maybeFiles: string[],
  yeetFiles: string[]
): Promise<void> {
  return invoke("execute_triage", {
    projectPath,
    folderId,
    sourceFolder,
    outputMode,
    keepFiles,
    maybeFiles,
    yeetFiles,
  });
}

export async function moveToTrash(paths: string[]): Promise<void> {
  return invoke("move_to_trash", { paths });
}

// Project system commands
export async function getAppDataDir(): Promise<string> {
  return invoke<string>("get_app_data_dir");
}

export async function listProjects(): Promise<ProjectSummary[]> {
  return invoke<ProjectSummary[]>("list_projects");
}

export async function createProject(
  name: string,
  outputPath: string
): Promise<Project> {
  return invoke<Project>("create_project", { name, outputPath });
}

export async function deleteProject(projectId: string): Promise<void> {
  return invoke("delete_project", { projectId });
}

export async function getProject(projectPath: string): Promise<Project> {
  return invoke<Project>("get_project", { projectPath });
}

export async function addFolderToProject(
  projectPath: string,
  sourcePath: string,
  outputMode: "move" | "copy"
): Promise<Folder> {
  return invoke<Folder>("add_folder_to_project", {
    projectPath,
    sourcePath,
    outputMode,
  });
}

export async function removeFolderFromProject(
  projectPath: string,
  folderId: string
): Promise<void> {
  return invoke("remove_folder_from_project", { projectPath, folderId });
}

export async function getFolderStats(
  projectPath: string,
  folderId: string
): Promise<FolderStats> {
  return invoke<FolderStats>("get_folder_stats", { projectPath, folderId });
}

export async function getProjectStats(
  projectPath: string
): Promise<ProjectStats> {
  return invoke<ProjectStats>("get_project_stats", { projectPath });
}

export async function pickOutputLocation(): Promise<string | null> {
  const result = await open({
    directory: true,
    multiple: false,
    title: "Select output location for projects",
  });
  return result as string | null;
}
