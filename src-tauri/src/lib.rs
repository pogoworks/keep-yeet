use base64::{engine::general_purpose::STANDARD, Engine};
use image::imageops::FilterType;
use image::GenericImageView;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use tauri::Manager;

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

#[tauri::command]
async fn execute_triage(
    session_name: String,
    source_folder: String,
    keep_files: Vec<String>,
    maybe_files: Vec<String>,
    yeet_files: Vec<String>,
) -> Result<(), String> {
    let source_path = Path::new(&source_folder);

    // Create session folders
    let keep_folder = source_path.join(&session_name).join("keep");
    let maybe_folder = source_path.join(&session_name).join("maybe");

    fs::create_dir_all(&keep_folder).map_err(|e| format!("Failed to create keep folder: {}", e))?;
    fs::create_dir_all(&maybe_folder)
        .map_err(|e| format!("Failed to create maybe folder: {}", e))?;

    // Move keep files
    for file_path in &keep_files {
        let src = Path::new(file_path);
        if let Some(file_name) = src.file_name() {
            let dest = keep_folder.join(file_name);
            fs::rename(src, &dest)
                .map_err(|e| format!("Failed to move {}: {}", file_path, e))?;
        }
    }

    // Move maybe files
    for file_path in &maybe_files {
        let src = Path::new(file_path);
        if let Some(file_name) = src.file_name() {
            let dest = maybe_folder.join(file_name);
            fs::rename(src, &dest)
                .map_err(|e| format!("Failed to move {}: {}", file_path, e))?;
        }
    }

    // Move yeet files to trash
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
            list_images,
            get_thumbnail,
            get_image_data_url,
            execute_triage,
            move_to_trash
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
