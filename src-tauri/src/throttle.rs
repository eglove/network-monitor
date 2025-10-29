#![cfg(target_os = "windows")]

use std::fmt::format;
use std::process::Command;
use tokio::task;

fn run_powershell(script: &str) -> Result<(), String> {
    let output = Command::new("pwsh")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            script,
        ])
        .output()
        .map_err(|e| format!("Failed to start PowerShell: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        // Common case: not run as Administrator
        if stderr.contains("Access is denied") || stderr.contains("Administrator") {
            return Err(
                "Applying QoS throttle requires running the app as Administrator on Windows."
                    .to_string(),
            );
        }
        Err(format!(
            "PowerShell error. stdout: {}\nstderr: {}",
            stdout, stderr
        ))
    }
}

#[tauri::command]
pub async fn set_bandwidth_limit() -> Result<(), String> {
    let ps_script = format!(
        r#"
$name = 'NM_Throttle'
$limit = {bps} # Store the limit in a variable for clarity

$existing = Get-NetQosPolicy -Name $name -ErrorAction SilentlyContinue

if ($existing) {{
  Set-NetQosPolicy -Name $name -ThrottleRateActionBitsPerSecond $limit
}} else {{
  New-NetQosPolicy -Name $name -Default -ThrottleRateActionBitsPerSecond $limit
}}
"#,
        bps = 1000000
    );

    task::spawn_blocking(move || run_powershell(&ps_script))
        .await
        .map_err(|e| format!("Join error: {}", e))??;

    Ok(())
}

#[tauri::command]
pub async fn clear_bandwidth_limit() -> Result<(), String> {
    let ps_script = r#"
$name = 'NM_Throttle'
if (Get-NetQosPolicy -Name $name -ErrorAction SilentlyContinue) {
  Remove-NetQosPolicy -Name $name -Confirm:$false -ErrorAction SilentlyContinue
}
"#;

    task::spawn_blocking(move || run_powershell(ps_script))
        .await
        .map_err(|e| format!("Join error: {}", e))??;

    Ok(())
}
