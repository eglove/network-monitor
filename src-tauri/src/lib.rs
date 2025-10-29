use crate::ping::ping_addresses;
use crate::network_metrics::get_network_metrics;
use crate::speed_test::run_speedtest;
#[cfg(target_os = "windows")]

mod ping;

#[cfg(target_os = "windows")]
pub mod network_metrics;
mod speed_test;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            ping_addresses,
            get_network_metrics,
            run_speedtest,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
