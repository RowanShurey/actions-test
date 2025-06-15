use std::process::Command;
use tauri::{AppHandle, Emitter, Manager};
use serde::Serialize;
use std::fs;
use std::io;
use std::path::PathBuf;
use std::path::Path;
use std::fs::copy;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProcessStarted<'a> {
  file_path: &'a str,
  download_id: usize
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProcessProgress {
  download_id: usize,
  progress: u64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
// ProcessCompleted stuct with a field for the download id and a field for the file path
struct ProcessCompleted<'a> {
  download_id: usize,
  file_path: &'a str,
}

// Filename extensions that are valid for processing
const VALID_FILENAME_EXTENSIONS: [&str; 2] = ["txt", "pdf"];

// Maximum file size in bytes
const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024; // 10 MB


// Checks a given file path for validity and extension, then returns a tuple with the validity result and the file path
#[tauri::command]
fn check_file(path: &str) -> String {
    // Get the file extension from the path
    let file_extension = path.split('.').last().unwrap_or("");

    // Check if the file extension is valid
    if !VALID_FILENAME_EXTENSIONS.contains(&file_extension) {
        return "invalid".to_string();//format!("Invalid file extension: {}", file_extension);
    }

    // Check the file size is less than the maximum size
    let metadata = std::fs::metadata(path).unwrap();
    if metadata.len() > MAX_FILE_SIZE {
        return "invalid".to_string();//format!("File size exceeds maximum limit: {} bytes", metadata.len());
    }
    
    "valid".to_string()//format!("Valid file extension {}", file_extension)
}

#[tauri::command(async)]
fn process_file(app: AppHandle,
    pathin: &str, pathout: &str)-> String {
    // Emit that the processing for this file has started, and assign it a download id
    app.emit("file-processing-started", ProcessStarted {
        file_path: pathin,
        download_id: 0,
    }).unwrap();

    // Run the philter command line tool to process the file
    let result = run_processing_philter(&app, pathin, pathout);

    // Count the fake file processing progress in milliseconds
    const STEP_MILLIS: u64 = 10;
    let mut counted_millis: u64 = 0;
    const TOTAL_MILLIS: u64 = 100;
    
    // Loop through while processing the file to simulate progress
    let stall_time = std::time::Duration::from_millis(STEP_MILLIS);
    while counted_millis < TOTAL_MILLIS{
        // Tell frontend the percentage complete of the file processing
        app.emit("file-processing-progress", ProcessProgress {
            download_id: 0,
            progress: 100*counted_millis/TOTAL_MILLIS,
        }).unwrap();
        std::thread::sleep(stall_time);
        counted_millis += STEP_MILLIS;
    }

    // // Tell Frontend that the file processing is complete and where it is saved
    app.emit("file-processing-completed", ProcessCompleted {
        download_id: 0,
        file_path: pathout,
    }).unwrap();

    // Return the result of the processing
    return result.to_string();
}

// Placeholder function where connection will be made to the actual processing logic
fn run_processing_philter(app: &AppHandle, pathin: &str, _pathout: &str) -> String {

    // setup all file paths and directories
    // select correct executable based on OS
    let philter_dir = app.path().resource_dir().unwrap().join("philter");
    let philter_exe = if cfg!(target_os = "windows"){
        philter_dir.join("deidpipe.exe")
    } else {
        philter_dir.join("deidpipe")
    };


    let config_path = app.path().resource_dir().unwrap().join("philter").join("configs").join("philter_one2024.json");
    let config_path_str = config_path.to_string_lossy().to_string();

    let (input_dir, output_dir) = get_working_dirs(&app);
    prepare_input_file(pathin, &input_dir);

    let output = 
        Command::new(philter_exe)
            .current_dir(&philter_dir)
            .args([
                "-i", &input_dir.to_string_lossy(),
                "-o", &output_dir.to_string_lossy(),
                "-f", &config_path_str,
            ])
            .output()
            .expect("failed to execute process");


    // print debugging info
    println!("stdout: {}", String::from_utf8_lossy(&output.stdout));
    println!("stderr: {}", String::from_utf8_lossy(&output.stderr));
    if !output.status.success() {
        println!("Process exited with code: {:?}", output.status.code());
    }



    // Move the generated file out of output_file and into downloads
    let generated = output_dir.join(
        PathBuf::from(pathin).file_name().unwrap()
    );
    let final_path = move_to_downloads(app, generated);

    final_path.to_string_lossy().into_owned()

    
}

// copy input file to input folder
fn prepare_input_file(original_path: &str, dest_folder: &PathBuf) -> PathBuf{
    let filename = PathBuf::from(original_path)
        .file_name()
        .unwrap()
        .to_string_lossy()
        .to_string();

    let dest_path = dest_folder.join(filename);
    copy(original_path, &dest_path).unwrap();
    dest_path
}


fn save_to_dir<S, D>(source: S, dest_dir: D) -> io::Result<PathBuf>
where
    S: AsRef<Path>,
    D: AsRef<Path>,
{
    let source = source.as_ref();
    let dest_dir = dest_dir.as_ref();

    // create dir if not existent
    fs::create_dir_all(dest_dir)?;

    let file_name = source
        .file_name()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "source has no file name"))?;

    let dest = dest_dir.join(file_name);

    fs::copy(source, &dest)?;
    fs::remove_file(source)?;

    Ok(dest)
}

/// Thin wrapper that keeps the existing public surface for the rest of the app.
fn move_to_downloads(app: &AppHandle, source: PathBuf) -> PathBuf {

    // get local directory of downloads
    let downloads = app
        .path()
        .download_dir()
        .expect("failed to get download directory");

    
    save_to_dir(&source, downloads).expect("failed to move file to Downloads")
}

fn get_working_dirs_from_base(base_dir: PathBuf) -> (PathBuf, PathBuf) {
    let input_dir = base_dir.join("input_text");
    let output_dir = base_dir.join("output_text");

    fs::create_dir_all(&input_dir).unwrap();
    fs::create_dir_all(&output_dir).unwrap();

    (input_dir, output_dir)
}

pub fn get_working_dirs(app: &AppHandle) -> (PathBuf, PathBuf) {
    let base_dir = app.path().app_data_dir().expect("failed to get app data dir");
    get_working_dirs_from_base(base_dir)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            check_file,
            process_file
            ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::tempdir;
    use std::fs::File;

    #[test]
    fn test_prepare_input_file_copies_file_correctly() {
        // Create separate temporary dirs for source and destination
        let src_dir = tempdir().unwrap();
        let dest_dir = tempdir().unwrap();

        let src_path = src_dir.path().join("test_input.txt");
        let mut input_file = std::fs::File::create(&src_path).unwrap();
        writeln!(input_file, "Hello, world!").unwrap();
        input_file.flush().unwrap(); // Ensure data is written to disk

        // Call the function
        let copied_path = prepare_input_file(src_path.to_str().unwrap(), &dest_dir.path().to_path_buf());

        // Ensure the copied file exists
        assert!(copied_path.exists());
        assert_eq!(copied_path.file_name().unwrap(), "test_input.txt");

        // Verify file contents
        let contents = std::fs::read_to_string(&copied_path).unwrap();
        assert_eq!(contents.trim(), "Hello, world!");
    }

    #[test]
    #[should_panic]
    fn test_prepare_input_file_fails_if_file_missing() {
        let dest = tempdir().unwrap();
        let _ = prepare_input_file("non_existent_file.txt", &dest.path().to_path_buf());
    }

    #[test]
    fn test_get_working_dirs_from_base_creates_dirs() {
        let temp_dir = tempdir().unwrap();
        let base_path = temp_dir.path().to_path_buf();

        let (input_dir, output_dir) = get_working_dirs_from_base(base_path.clone());

        assert!(input_dir.exists());
        assert!(input_dir.ends_with("input_text"));

        assert!(output_dir.exists());
        assert!(output_dir.ends_with("output_text"));
    }

    #[test]
    fn save_to_dir_copies_and_deletes() {
        // 1. create temp source file
        let src_dir = tempdir().unwrap();
        let src_path = src_dir.path().join("foo.txt");
        {
            let mut f = File::create(&src_path).unwrap();
            writeln!(f, "hello world").unwrap();
        }

        // 2. temp destination directory
        let dst_dir = tempdir().unwrap();

        // 3. exercise the helper
        let final_path = save_to_dir(&src_path, dst_dir.path()).unwrap();

        // 4. assertions
        assert!(!src_path.exists(), "original should be removed");
        assert!(
            final_path.exists(),
            "file should exist at destination"
        );
        assert_eq!(
            std::fs::read_to_string(final_path).unwrap().trim(),
            "hello world"
        );
    }
}