use std::net::IpAddr;
use std::time::Duration;
use futures::future::join_all;
use ping_rs::PingOptions;
use serde::Serialize;
use tokio::task::JoinHandle;
use std::str::FromStr;

#[derive(Debug, Serialize)]
pub struct PingStatus {
    pub ip: String,
    pub status: String,
    pub latency_ms: Option<u64>,
}

#[tauri::command]
pub async fn ping_addresses() -> Vec<PingStatus> {
    let addresses_to_ping = vec![
        "1.1.1.1", // Cloudflare DNS
        "8.8.8.8", // Google DNS
        "4.2.2.2", // Level 3 DNS
    ];

    let handles: Vec<JoinHandle<PingStatus>> = addresses_to_ping.iter().map(|&addr_str| {
        let addr_str_owned = addr_str.to_string();

        tokio::task::spawn_blocking(move || {
            let ip_addr = match IpAddr::from_str(&addr_str_owned) {
                Ok(ip) => ip,
                Err(_) => return PingStatus {
                    ip: addr_str_owned,
                    status: "Error: Invalid IP Address format".to_string(),
                    latency_ms: None,
                },
            };

            let data = [1u8; 32];
            let timeout = Duration::from_secs(2);
            let options = PingOptions { ttl: 128, dont_fragment: true };

            match ping_rs::send_ping(&ip_addr, timeout, &data, Some(&options)) {
                Ok(reply) => PingStatus {
                    ip: addr_str_owned,
                    status: "Success".to_string(),
                    latency_ms: Some(reply.rtt as u64),
                },
                Err(e) => PingStatus {
                    ip: addr_str_owned,
                    status: format!("Failed: {:?}", e),
                    latency_ms: None,
                },
            }
        })
    }).collect();

    join_all(handles)
        .await
        .into_iter()
        .map(|res| {
            res.unwrap_or_else(|e| PingStatus {
                ip: "Unknown".to_string(),
                status: format!("Task Panic: {}", e),
                latency_ms: None,
            })
        })
        .collect()
}