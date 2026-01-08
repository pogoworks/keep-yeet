use base64::{engine::general_purpose::STANDARD, Engine};
use chrono::Utc;
use image::imageops::FilterType;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use tauri::Manager;
use uuid::Uuid;

const THUMBNAIL_SIZE: u32 = 150;
const SUPPORTED_EXTENSIONS: &[&str] = &["png", "jpg", "jpeg", "webp", "gif", "bmp"];

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageInfo {
    pub id: String,
    pub path: String,
    pub name: String,
    pub size: u64,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileMove {
    pub source: String,
    pub destination: String,
}

// Project system structs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSummary {
    pub id: String,
    pub name: String,
    pub path: String,
    pub created_at: String,
    pub updated_at: Option<String>,
    pub folder_count: u32,
    pub folder_names: Vec<String>,
}

// Internal struct for the projects registry file (without computed fields)
#[derive(Debug, Clone, Serialize, Deserialize)]
struct ProjectRegistryEntry {
    pub id: String,
    pub name: String,
    pub path: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Folder {
    pub id: String,
    pub source_path: String,
    pub output_mode: String, // "move" | "copy"
    pub added_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub created_at: String,
    #[serde(default = "default_output_directory_mode")]
    pub output_directory_mode: String, // "unified" | "per-folder"
    pub folders: Vec<Folder>,
}

fn default_output_directory_mode() -> String {
    "per-folder".to_string()
}

// Metadata for tracking file origins in unified mode
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct OutputMetadata {
    pub file_origins: std::collections::HashMap<String, String>, // filename -> source_folder_id
}

// Extended image info with source folder tracking
#[derive(Debug, Serialize, Deserialize)]
pub struct OutputImageInfo {
    pub id: String,
    pub path: String,
    pub name: String,
    pub size: u64,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub source_folder_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FolderStats {
    pub folder_id: String,
    pub folder_name: String,
    pub source_count: u32,
    pub keep_count: u32,
    pub maybe_count: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectStats {
    pub total_keep: u32,
    pub total_maybe: u32,
    pub folder_stats: Vec<FolderStats>,
}

const PROJECTS_FILE: &str = "projects.json";

fn get_cache_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .app_cache_dir()
        .unwrap_or_else(|_| PathBuf::from(".cache"))
        .join("thumbnails")
}

fn hash_path(path: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(path.as_bytes());
    hex::encode(hasher.finalize())[..16].to_string()
}

fn is_image_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| SUPPORTED_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
        .unwrap_or(false)
}

fn get_app_data_path(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
}

fn get_projects_file_path(app: &tauri::AppHandle) -> PathBuf {
    get_app_data_path(app).join(PROJECTS_FILE)
}

fn read_projects_registry(app: &tauri::AppHandle) -> Result<Vec<ProjectRegistryEntry>, String> {
    let path = get_projects_file_path(app);
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

fn write_projects_registry(app: &tauri::AppHandle, projects: &[ProjectRegistryEntry]) -> Result<(), String> {
    let path = get_projects_file_path(app);

    // Ensure app data directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string_pretty(projects).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

/// Enrich a registry entry with folder info from the project config
fn enrich_project_summary(entry: &ProjectRegistryEntry) -> ProjectSummary {
    let project_path = Path::new(&entry.path);
    let config_path = project_path.join("toss-project.json");

    // Try to get updated_at from config file modification time
    let updated_at = fs::metadata(&config_path)
        .and_then(|m| m.modified())
        .ok()
        .map(|t| {
            let datetime: chrono::DateTime<Utc> = t.into();
            datetime.to_rfc3339()
        });

    // Try to read project config for folder info
    let (folder_count, folder_names) = read_project_config(project_path)
        .map(|project| {
            let count = project.folders.len() as u32;
            let names: Vec<String> = project
                .folders
                .iter()
                .take(3)
                .map(|f| get_folder_name(&f.source_path))
                .collect();
            (count, names)
        })
        .unwrap_or((0, Vec::new()));

    ProjectSummary {
        id: entry.id.clone(),
        name: entry.name.clone(),
        path: entry.path.clone(),
        created_at: entry.created_at.clone(),
        updated_at,
        folder_count,
        folder_names,
    }
}

fn read_project_config(project_path: &Path) -> Result<Project, String> {
    let config_path = project_path.join("toss-project.json");
    if !config_path.exists() {
        return Err("Project config not found".to_string());
    }
    let content = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

fn write_project_config(project_path: &Path, project: &Project) -> Result<(), String> {
    let config_path = project_path.join("toss-project.json");
    let content = serde_json::to_string_pretty(project).map_err(|e| e.to_string())?;
    fs::write(&config_path, content).map_err(|e| e.to_string())
}

fn count_images_in_dir(dir: &Path) -> u32 {
    if !dir.exists() || !dir.is_dir() {
        return 0;
    }
    fs::read_dir(dir)
        .map(|entries| {
            entries
                .filter_map(|e| e.ok())
                .filter(|e| e.path().is_file() && is_image_file(&e.path()))
                .count() as u32
        })
        .unwrap_or(0)
}

fn get_folder_name(path: &str) -> String {
    Path::new(path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unnamed")
        .to_string()
}

/// Sanitize a project name to prevent path traversal attacks
fn sanitize_name(name: &str) -> String {
    name.chars()
        .filter(|c| !matches!(c, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' | '\0'))
        .collect::<String>()
        .trim()
        .to_string()
}

const OUTPUT_METADATA_FILE: &str = "toss-metadata.json";

fn read_output_metadata(project_dir: &Path) -> Result<OutputMetadata, String> {
    let path = project_dir.join(OUTPUT_METADATA_FILE);
    if !path.exists() {
        return Ok(OutputMetadata::default());
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

fn write_output_metadata(project_dir: &Path, metadata: &OutputMetadata) -> Result<(), String> {
    let path = project_dir.join(OUTPUT_METADATA_FILE);
    let content = serde_json::to_string_pretty(metadata).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

/// Scan a directory and return ImageInfo for all images found
fn scan_directory_for_images(dir: &Path) -> Result<Vec<ImageInfo>, String> {
    if !dir.exists() || !dir.is_dir() {
        return Ok(Vec::new());
    }

    let mut images = Vec::new();
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() || !is_image_file(&path) {
            continue;
        }

        let metadata = fs::metadata(&path).ok();
        let path_str = path.to_string_lossy().to_string();

        let (width, height) = image::image_dimensions(&path)
            .map(|(w, h)| (Some(w), Some(h)))
            .unwrap_or((None, None));

        images.push(ImageInfo {
            id: hash_path(&path_str),
            path: path_str,
            name: path.file_name().unwrap().to_str().unwrap().to_string(),
            size: metadata.map(|m| m.len()).unwrap_or(0),
            width,
            height,
        });
    }

    // Sort by name
    images.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(images)
}

/// Generate a unique filename if conflict exists
fn resolve_filename_conflict(dest_dir: &Path, original_name: &str) -> String {
    let path = Path::new(original_name);
    let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or(original_name);
    let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");

    let mut counter = 1;
    let mut new_name = original_name.to_string();

    while dest_dir.join(&new_name).exists() {
        new_name = if ext.is_empty() {
            format!("{}_{}", stem, counter)
        } else {
            format!("{}_{}.{}", stem, counter, ext)
        };
        counter += 1;

        // Safety limit
        if counter > 1000 {
            break;
        }
    }

    new_name
}

// Project system commands
#[tauri::command]
async fn get_app_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    let path = get_app_data_path(&app);
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
async fn list_projects(app: tauri::AppHandle) -> Result<Vec<ProjectSummary>, String> {
    let entries = read_projects_registry(&app)?;
    Ok(entries.iter().map(enrich_project_summary).collect())
}

#[tauri::command]
async fn create_project(
    app: tauri::AppHandle,
    name: String,
    output_path: String,
) -> Result<Project, String> {
    // Sanitize project name to prevent path traversal
    let sanitized_name = sanitize_name(&name);
    if sanitized_name.is_empty() {
        return Err("Invalid project name".to_string());
    }

    let id = Uuid::new_v4().to_string();
    let created_at = Utc::now().to_rfc3339();

    // Create project directory
    let project_path = Path::new(&output_path).join(&sanitized_name);
    fs::create_dir_all(&project_path)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;

    // Create project config
    let project = Project {
        id: id.clone(),
        name: sanitized_name.clone(),
        created_at: created_at.clone(),
        output_directory_mode: "per-folder".to_string(),
        folders: Vec::new(),
    };

    write_project_config(&project_path, &project)?;

    // Add to registry
    let mut entries = read_projects_registry(&app)?;
    entries.push(ProjectRegistryEntry {
        id,
        name: sanitized_name,
        path: project_path.to_string_lossy().to_string(),
        created_at,
    });
    write_projects_registry(&app, &entries)?;

    Ok(project)
}

#[tauri::command]
async fn delete_project(app: tauri::AppHandle, project_id: String) -> Result<(), String> {
    let mut entries = read_projects_registry(&app)?;
    entries.retain(|e| e.id != project_id);
    write_projects_registry(&app, &entries)
}

#[tauri::command]
async fn get_project(project_path: String) -> Result<Project, String> {
    read_project_config(Path::new(&project_path))
}

#[tauri::command]
async fn add_folder_to_project(
    project_path: String,
    source_path: String,
    output_mode: String,
) -> Result<Folder, String> {
    let project_dir = Path::new(&project_path);
    let mut project = read_project_config(project_dir)?;

    // Check if folder already exists
    if project.folders.iter().any(|f| f.source_path == source_path) {
        return Err("Folder already added to project".to_string());
    }

    let folder = Folder {
        id: Uuid::new_v4().to_string(),
        source_path,
        output_mode,
        added_at: Utc::now().to_rfc3339(),
    };

    project.folders.push(folder.clone());
    write_project_config(project_dir, &project)?;

    Ok(folder)
}

#[tauri::command]
async fn remove_folder_from_project(project_path: String, folder_id: String) -> Result<(), String> {
    let project_dir = Path::new(&project_path);
    let mut project = read_project_config(project_dir)?;

    project.folders.retain(|f| f.id != folder_id);
    write_project_config(project_dir, &project)
}

#[tauri::command]
async fn get_folder_stats(project_path: String, folder_id: String) -> Result<FolderStats, String> {
    let project_dir = Path::new(&project_path);
    let project = read_project_config(project_dir)?;

    let folder = project
        .folders
        .iter()
        .find(|f| f.id == folder_id)
        .ok_or("Folder not found")?;

    let folder_name = get_folder_name(&folder.source_path);
    let source_count = count_images_in_dir(Path::new(&folder.source_path));

    // Count images in output folders
    let output_dir = project_dir.join(&folder_name);
    let keep_count = count_images_in_dir(&output_dir.join("keep"));
    let maybe_count = count_images_in_dir(&output_dir.join("maybe"));

    Ok(FolderStats {
        folder_id,
        folder_name,
        source_count,
        keep_count,
        maybe_count,
    })
}

#[tauri::command]
async fn get_project_stats(project_path: String) -> Result<ProjectStats, String> {
    let project_dir = Path::new(&project_path);
    let project = read_project_config(project_dir)?;

    let is_unified = project.output_directory_mode == "unified";
    let mut total_keep = 0u32;
    let mut total_maybe = 0u32;
    let mut folder_stats = Vec::new();

    if is_unified {
        // In unified mode, count from project-level keep/maybe folders
        total_keep = count_images_in_dir(&project_dir.join("keep"));
        total_maybe = count_images_in_dir(&project_dir.join("maybe"));

        // Still provide per-folder source counts (but keep/maybe are 0 per folder)
        for folder in &project.folders {
            let folder_name = get_folder_name(&folder.source_path);
            let source_count = count_images_in_dir(Path::new(&folder.source_path));

            folder_stats.push(FolderStats {
                folder_id: folder.id.clone(),
                folder_name,
                source_count,
                keep_count: 0, // Can't attribute in unified mode without scanning metadata
                maybe_count: 0,
            });
        }
    } else {
        // Per-folder mode: scan each folder's output directory
        for folder in &project.folders {
            let folder_name = get_folder_name(&folder.source_path);
            let source_count = count_images_in_dir(Path::new(&folder.source_path));

            let output_dir = project_dir.join(&folder_name);
            let keep_count = count_images_in_dir(&output_dir.join("keep"));
            let maybe_count = count_images_in_dir(&output_dir.join("maybe"));

            total_keep += keep_count;
            total_maybe += maybe_count;

            folder_stats.push(FolderStats {
                folder_id: folder.id.clone(),
                folder_name,
                source_count,
                keep_count,
                maybe_count,
            });
        }
    }

    Ok(ProjectStats {
        total_keep,
        total_maybe,
        folder_stats,
    })
}

#[tauri::command]
async fn list_images(folder: String) -> Result<Vec<ImageInfo>, String> {
    let path = Path::new(&folder);
    if !path.exists() || !path.is_dir() {
        return Err("Folder does not exist".to_string());
    }

    let mut images = Vec::new();

    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in entries.flatten() {
        let entry_path = entry.path();
        if entry_path.is_file() && is_image_file(&entry_path) {
            let metadata = entry.metadata().ok();
            let path_str = entry_path.to_string_lossy().to_string();

            // Try to get image dimensions
            let (width, height) = image::image_dimensions(&entry_path)
                .map(|(w, h)| (Some(w), Some(h)))
                .unwrap_or((None, None));

            images.push(ImageInfo {
                id: hash_path(&path_str),
                path: path_str,
                name: entry_path
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default(),
                size: metadata.map(|m| m.len()).unwrap_or(0),
                width,
                height,
            });
        }
    }

    // Sort by name
    images.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    Ok(images)
}

#[tauri::command]
async fn get_thumbnail(
    app: tauri::AppHandle,
    path: String,
    size: Option<u32>,
) -> Result<String, String> {
    let size = size.unwrap_or(THUMBNAIL_SIZE);
    let cache_dir = get_cache_dir(&app);
    let cache_key = format!("{}_{}", hash_path(&path), size);
    let cache_path = cache_dir.join(format!("{}.jpg", cache_key));

    // Check cache first
    if cache_path.exists() {
        let data = fs::read(&cache_path).map_err(|e| e.to_string())?;
        return Ok(format!(
            "data:image/jpeg;base64,{}",
            STANDARD.encode(&data)
        ));
    }

    // Generate thumbnail
    let img = image::open(&path).map_err(|e| format!("Failed to open image: {}", e))?;

    let thumbnail = img.resize(size, size, FilterType::Triangle);

    // Ensure cache directory exists
    fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;

    // Save to cache
    let mut buffer = Cursor::new(Vec::new());
    thumbnail
        .write_to(&mut buffer, image::ImageFormat::Jpeg)
        .map_err(|e| format!("Failed to encode thumbnail: {}", e))?;

    let data = buffer.into_inner();
    fs::write(&cache_path, &data).map_err(|e| e.to_string())?;

    Ok(format!("data:image/jpeg;base64,{}", STANDARD.encode(&data)))
}

#[tauri::command]
async fn get_image_data_url(path: String) -> Result<String, String> {
    let path = Path::new(&path);
    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_lowercase();

    let mime_type = match extension.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        _ => "image/png",
    };

    let data = fs::read(path).map_err(|e| e.to_string())?;
    Ok(format!("data:{};base64,{}", mime_type, STANDARD.encode(&data)))
}

/// Helper function to move or copy a file based on output mode
fn move_or_copy_file(src: &Path, dest: &Path, is_move: bool) -> Result<(), String> {
    if is_move {
        fs::rename(src, dest).map_err(|e| format!("Failed to move {}: {}", src.display(), e))
    } else {
        fs::copy(src, dest)
            .map_err(|e| format!("Failed to copy {}: {}", src.display(), e))?;
        Ok(())
    }
}

#[tauri::command]
async fn execute_triage(
    project_path: String,
    folder_id: String,
    _source_folder: String, // Kept for API consistency, folder info comes from project config
    output_mode: String,
    keep_files: Vec<String>,
    maybe_files: Vec<String>,
    yeet_files: Vec<String>,
) -> Result<(), String> {
    let project_dir = Path::new(&project_path);

    // Read project config to find the folder
    let project = read_project_config(project_dir)?;
    let folder = project
        .folders
        .iter()
        .find(|f| f.id == folder_id)
        .ok_or_else(|| format!("Folder {} not found in project", folder_id))?;

    let is_unified = project.output_directory_mode == "unified";
    let is_move = output_mode == "move";

    // Determine output folders based on mode
    let (keep_folder, maybe_folder) = if is_unified {
        // Unified mode: project/keep and project/maybe
        (project_dir.join("keep"), project_dir.join("maybe"))
    } else {
        // Per-folder mode: project/folder_name/keep|maybe
        let folder_name = get_folder_name(&folder.source_path);
        let output_base = project_dir.join(&folder_name);
        (output_base.join("keep"), output_base.join("maybe"))
    };

    fs::create_dir_all(&keep_folder).map_err(|e| format!("Failed to create keep folder: {}", e))?;
    fs::create_dir_all(&maybe_folder)
        .map_err(|e| format!("Failed to create maybe folder: {}", e))?;

    // Load metadata for unified mode (to track origins)
    let mut metadata = if is_unified {
        read_output_metadata(project_dir)?
    } else {
        OutputMetadata::default()
    };

    // Process keep files
    for file_path in &keep_files {
        let src = Path::new(file_path);
        if let Some(file_name) = src.file_name() {
            let file_name_str = file_name.to_string_lossy().to_string();
            let final_name = if is_unified {
                resolve_filename_conflict(&keep_folder, &file_name_str)
            } else {
                file_name_str.clone()
            };
            let dest = keep_folder.join(&final_name);
            move_or_copy_file(src, &dest, is_move)?;

            // Track origin in unified mode
            if is_unified {
                metadata.file_origins.insert(final_name, folder_id.clone());
            }
        }
    }

    // Process maybe files
    for file_path in &maybe_files {
        let src = Path::new(file_path);
        if let Some(file_name) = src.file_name() {
            let file_name_str = file_name.to_string_lossy().to_string();
            let final_name = if is_unified {
                resolve_filename_conflict(&maybe_folder, &file_name_str)
            } else {
                file_name_str.clone()
            };
            let dest = maybe_folder.join(&final_name);
            move_or_copy_file(src, &dest, is_move)?;

            // Track origin in unified mode
            if is_unified {
                metadata.file_origins.insert(final_name, folder_id.clone());
            }
        }
    }

    // Save metadata if in unified mode
    if is_unified {
        write_output_metadata(project_dir, &metadata)?;
    }

    // Yeet files always go to trash (regardless of move/copy mode)
    for file_path in &yeet_files {
        trash::delete(file_path)
            .map_err(|e| format!("Failed to trash {}: {}", file_path, e))?;
    }

    Ok(())
}

#[tauri::command]
async fn move_to_trash(paths: Vec<String>) -> Result<(), String> {
    for path in &paths {
        trash::delete(path).map_err(|e| format!("Failed to trash {}: {}", path, e))?;
    }
    Ok(())
}

#[tauri::command]
async fn list_output_images(
    project_path: String,
    classification: String, // "keep" | "maybe"
) -> Result<Vec<OutputImageInfo>, String> {
    let project_dir = Path::new(&project_path);
    let project = read_project_config(project_dir)?;

    let is_unified = project.output_directory_mode == "unified";
    let mut all_images = Vec::new();

    if is_unified {
        // Unified mode: scan project/keep or project/maybe
        let output_dir = project_dir.join(&classification);
        let images = scan_directory_for_images(&output_dir)?;

        // Load metadata to get source folder IDs
        let metadata = read_output_metadata(project_dir)?;

        for img_info in images {
            let source_folder_id = metadata
                .file_origins
                .get(&img_info.name)
                .cloned()
                .unwrap_or_default();

            all_images.push(OutputImageInfo {
                id: img_info.id,
                path: img_info.path,
                name: img_info.name,
                size: img_info.size,
                width: img_info.width,
                height: img_info.height,
                source_folder_id,
            });
        }
    } else {
        // Per-folder mode: scan folder-name/keep or folder-name/maybe for each folder
        for folder in &project.folders {
            let folder_name = get_folder_name(&folder.source_path);
            let output_dir = project_dir.join(&folder_name).join(&classification);

            if let Ok(images) = scan_directory_for_images(&output_dir) {
                for img_info in images {
                    all_images.push(OutputImageInfo {
                        id: img_info.id,
                        path: img_info.path,
                        name: img_info.name,
                        size: img_info.size,
                        width: img_info.width,
                        height: img_info.height,
                        source_folder_id: folder.id.clone(),
                    });
                }
            }
        }
    }

    // Sort by name
    all_images.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(all_images)
}

#[tauri::command]
async fn update_project_output_mode(
    project_path: String,
    mode: String, // "unified" | "per-folder"
) -> Result<(), String> {
    let project_dir = Path::new(&project_path);
    let mut project = read_project_config(project_dir)?;
    project.output_directory_mode = mode;
    write_project_config(project_dir, &project)
}

#[tauri::command]
async fn migrate_project_outputs(
    project_path: String,
    to_mode: String, // "unified" | "per-folder"
) -> Result<Vec<String>, String> {
    let project_dir = Path::new(&project_path);
    let project = read_project_config(project_dir)?;
    let mut conflicts = Vec::new();

    if to_mode == "unified" {
        // Migrate from per-folder to unified
        let unified_keep = project_dir.join("keep");
        let unified_maybe = project_dir.join("maybe");
        fs::create_dir_all(&unified_keep).ok();
        fs::create_dir_all(&unified_maybe).ok();

        let mut metadata = OutputMetadata::default();

        for folder in &project.folders {
            let folder_name = get_folder_name(&folder.source_path);
            let folder_output = project_dir.join(&folder_name);

            // Move keep files
            let keep_dir = folder_output.join("keep");
            if keep_dir.exists() {
                if let Ok(entries) = fs::read_dir(&keep_dir) {
                    for entry in entries.filter_map(|e| e.ok()) {
                        let source = entry.path();
                        if !source.is_file() || !is_image_file(&source) {
                            continue;
                        }

                        let filename = source.file_name().unwrap().to_str().unwrap();
                        let final_name = resolve_filename_conflict(&unified_keep, filename);

                        if final_name != filename {
                            conflicts.push(format!("{} → {}", filename, final_name));
                        }

                        let dest = unified_keep.join(&final_name);
                        fs::rename(&source, &dest).ok();
                        metadata.file_origins.insert(final_name, folder.id.clone());
                    }
                }
            }

            // Move maybe files
            let maybe_dir = folder_output.join("maybe");
            if maybe_dir.exists() {
                if let Ok(entries) = fs::read_dir(&maybe_dir) {
                    for entry in entries.filter_map(|e| e.ok()) {
                        let source = entry.path();
                        if !source.is_file() || !is_image_file(&source) {
                            continue;
                        }

                        let filename = source.file_name().unwrap().to_str().unwrap();
                        let final_name = resolve_filename_conflict(&unified_maybe, filename);

                        if final_name != filename {
                            conflicts.push(format!("{} → {}", filename, final_name));
                        }

                        let dest = unified_maybe.join(&final_name);
                        fs::rename(&source, &dest).ok();
                        metadata.file_origins.insert(final_name, folder.id.clone());
                    }
                }
            }

            // Clean up empty folder output directories
            fs::remove_dir(folder_output.join("keep")).ok();
            fs::remove_dir(folder_output.join("maybe")).ok();
            fs::remove_dir(&folder_output).ok();
        }

        write_output_metadata(project_dir, &metadata)?;
    } else {
        // Migrate from unified to per-folder
        let metadata = read_output_metadata(project_dir)?;

        // Process keep files
        let unified_keep = project_dir.join("keep");
        if unified_keep.exists() {
            if let Ok(entries) = fs::read_dir(&unified_keep) {
                for entry in entries.filter_map(|e| e.ok()) {
                    let source = entry.path();
                    if !source.is_file() || !is_image_file(&source) {
                        continue;
                    }

                    let filename = source.file_name().unwrap().to_str().unwrap().to_string();

                    // Find which folder this file came from
                    if let Some(folder_id) = metadata.file_origins.get(&filename) {
                        if let Some(folder) = project.folders.iter().find(|f| f.id == *folder_id) {
                            let folder_name = get_folder_name(&folder.source_path);
                            let dest_dir = project_dir.join(&folder_name).join("keep");
                            fs::create_dir_all(&dest_dir).ok();
                            let dest = dest_dir.join(&filename);
                            fs::rename(&source, &dest).ok();
                        }
                    }
                }
            }
        }

        // Process maybe files
        let unified_maybe = project_dir.join("maybe");
        if unified_maybe.exists() {
            if let Ok(entries) = fs::read_dir(&unified_maybe) {
                for entry in entries.filter_map(|e| e.ok()) {
                    let source = entry.path();
                    if !source.is_file() || !is_image_file(&source) {
                        continue;
                    }

                    let filename = source.file_name().unwrap().to_str().unwrap().to_string();

                    // Find which folder this file came from
                    if let Some(folder_id) = metadata.file_origins.get(&filename) {
                        if let Some(folder) = project.folders.iter().find(|f| f.id == *folder_id) {
                            let folder_name = get_folder_name(&folder.source_path);
                            let dest_dir = project_dir.join(&folder_name).join("maybe");
                            fs::create_dir_all(&dest_dir).ok();
                            let dest = dest_dir.join(&filename);
                            fs::rename(&source, &dest).ok();
                        }
                    }
                }
            }
        }

        // Clean up unified directories and metadata
        fs::remove_dir(&unified_keep).ok();
        fs::remove_dir(&unified_maybe).ok();
        fs::remove_file(project_dir.join(OUTPUT_METADATA_FILE)).ok();
    }

    Ok(conflicts)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            // Image commands
            list_images,
            get_thumbnail,
            get_image_data_url,
            execute_triage,
            move_to_trash,
            // Project commands
            get_app_data_dir,
            list_projects,
            create_project,
            delete_project,
            get_project,
            add_folder_to_project,
            remove_folder_from_project,
            get_folder_stats,
            get_project_stats,
            // Gallery commands
            list_output_images,
            update_project_output_mode,
            migrate_project_outputs
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
