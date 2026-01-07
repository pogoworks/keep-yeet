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
    pub folders: Vec<Folder>,
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

fn read_projects_registry(app: &tauri::AppHandle) -> Result<Vec<ProjectSummary>, String> {
    let path = get_projects_file_path(app);
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

fn write_projects_registry(app: &tauri::AppHandle, projects: &[ProjectSummary]) -> Result<(), String> {
    let path = get_projects_file_path(app);

    // Ensure app data directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string_pretty(projects).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
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

// Project system commands
#[tauri::command]
async fn get_app_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    let path = get_app_data_path(&app);
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
async fn list_projects(app: tauri::AppHandle) -> Result<Vec<ProjectSummary>, String> {
    read_projects_registry(&app)
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
        folders: Vec::new(),
    };

    write_project_config(&project_path, &project)?;

    // Add to registry
    let mut projects = read_projects_registry(&app)?;
    projects.push(ProjectSummary {
        id,
        name: sanitized_name,
        path: project_path.to_string_lossy().to_string(),
        created_at,
    });
    write_projects_registry(&app, &projects)?;

    Ok(project)
}

#[tauri::command]
async fn delete_project(app: tauri::AppHandle, project_id: String) -> Result<(), String> {
    let mut projects = read_projects_registry(&app)?;
    projects.retain(|p| p.id != project_id);
    write_projects_registry(&app, &projects)
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

    let mut total_keep = 0u32;
    let mut total_maybe = 0u32;
    let mut folder_stats = Vec::new();

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

    // Output folder structure: project_path/folder_name/keep|maybe
    let folder_name = get_folder_name(&folder.source_path);
    let output_base = project_dir.join(&folder_name);
    let keep_folder = output_base.join("keep");
    let maybe_folder = output_base.join("maybe");

    fs::create_dir_all(&keep_folder).map_err(|e| format!("Failed to create keep folder: {}", e))?;
    fs::create_dir_all(&maybe_folder)
        .map_err(|e| format!("Failed to create maybe folder: {}", e))?;

    let is_move = output_mode == "move";

    // Process keep files
    for file_path in &keep_files {
        let src = Path::new(file_path);
        if let Some(file_name) = src.file_name() {
            let dest = keep_folder.join(file_name);
            move_or_copy_file(src, &dest, is_move)?;
        }
    }

    // Process maybe files
    for file_path in &maybe_files {
        let src = Path::new(file_path);
        if let Some(file_name) = src.file_name() {
            let dest = maybe_folder.join(file_name);
            move_or_copy_file(src, &dest, is_move)?;
        }
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
            get_project_stats
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
