use std::process::Command;
use tokio::task;

#[tauri::command]
pub async fn run_speedtest() -> Result<String, String> {
    let output = task::spawn_blocking(|| {
        Command::new("speedtest")
            .arg("--format=json")
            .output()
            .map_err(|e| format!("Failed to execute speedtest: {}", e))
    })
        .await
        .map_err(|e| format!("Join error: {}", e))??; // Handles join and command errors

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        Ok(stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Speedtest CLI failed: {}", stderr))
    }
}