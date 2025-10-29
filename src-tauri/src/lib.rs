use crate::ping::ping_addresses;
use crate::network_metrics::get_network_metrics;
use crate::speed_test::run_speedtest;
#[cfg(target_os = "windows")]
use crate::throttle::{set_bandwidth_limit, clear_bandwidth_limit};

mod ping;

#[cfg(target_os = "windows")]
pub mod network_metrics;
mod speed_test;
#[cfg(target_os = "windows")]
mod throttle;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            ping_addresses,
            get_network_metrics,
            run_speedtest,
            set_bandwidth_limit,
            clear_bandwidth_limit
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
