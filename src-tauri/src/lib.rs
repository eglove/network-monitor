use crate::ping::ping_addresses;
use crate::speed::run_full_speed_test;
use crate::network_metrics::get_network_metrics;

mod ping;
mod speed;

#[cfg(target_os = "windows")]
pub mod network_metrics;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            ping_addresses,
            run_full_speed_test,
            get_network_metrics
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
