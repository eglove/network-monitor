use reqwest::{self, Body};
use serde::Serialize;
use futures::TryStreamExt;
use tokio::time::{self, Duration, Instant};

#[derive(Debug, Serialize)]
pub struct FullTestResult {
    pub download_mbps: Option<f64>,
    pub upload_mbps: Option<f64>,
    pub latency_ms: Option<f64>,
    pub jitter_ms: Option<f64>,
    pub packet_loss_percent: Option<f64>,
    pub error: Option<String>,
}

const CLOUDFLARE_HOST: &str = "https://speed.cloudflare.com";
const DOWNLOAD_PATH: &str = "/__down?bytes=";
const UPLOAD_PATH: &str = "/__up";

const DOWNLOAD_TESTS: [(u64, usize); 5] = [
    (101_000, 10),     // 100kB
    (1_001_000, 8),    // 1MB
    (10_001_000, 6),   // 10MB
    (25_001_000, 4),   // 25MB
    (100_001_000, 1),  // 100MB
];

const UPLOAD_TESTS: [(usize, usize); 3] = [
    (101_000, 10),     // 100kB
    (1_001_000, 8),    // 1MB
    (10_001_000, 6),   // 10MB
];

fn calculate_speed_mbps(bytes: u64, duration_secs: f64) -> f64 {
    if duration_secs > 0.0 {
        (bytes as f64 * 8.0) / (duration_secs * 1_000_000.0)
    } else {
        0.0
    }
}

async fn measure_download_speed(client: &reqwest::Client) -> Option<f64> {
    let mut all_speeds: Vec<f64> = Vec::new();

    for (bytes, iterations) in DOWNLOAD_TESTS.iter() {
        let download_url = format!("{}{}{}", CLOUDFLARE_HOST, DOWNLOAD_PATH, bytes);

        for _ in 0..*iterations {
            let start = Instant::now();
            match client.get(&download_url).send().await {
                Ok(response) => {
                    let mut bytes_downloaded = 0;
                    let mut stream = response.bytes_stream();

                    while let Some(chunk) = stream.try_next().await.ok().flatten() {
                        bytes_downloaded += chunk.len() as u64;
                    }

                    let duration_secs = start.elapsed().as_secs_f64();

                    if bytes_downloaded == *bytes {
                        let speed = calculate_speed_mbps(*bytes, duration_secs);
                        all_speeds.push(speed);
                    }
                }
                Err(_) => continue,
            }
        }
    }

    if !all_speeds.is_empty() {
        all_speeds.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        let median_index = all_speeds.len() - 1;
        Some(all_speeds[median_index])
    } else {
        None
    }
}

async fn measure_upload_speed(client: &reqwest::Client) -> Option<f64> {
    let mut all_speeds: Vec<f64> = Vec::new();

    for (bytes, iterations) in UPLOAD_TESTS.iter() {
        let dummy_data = vec![0u8; *bytes];

        for _ in 0..*iterations {
            let body_size = *bytes;

            let start = Instant::now();

            match client
                .post(format!("{}{}", CLOUDFLARE_HOST, UPLOAD_PATH))
                .header("Content-Type", "application/octet-stream")
                .body(Body::from(dummy_data.clone()))
                .send()
                .await
            {
                Ok(response) => {
                    if response.status().is_success() {
                        let duration_secs = start.elapsed().as_secs_f64();
                        let speed = calculate_speed_mbps(body_size as u64, duration_secs);
                        all_speeds.push(speed);
                    }
                }
                Err(_) => continue,
            }
        }
    }

    if !all_speeds.is_empty() {
        all_speeds.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        let median_index = all_speeds.len() / 2;
        Some(all_speeds[median_index])
    } else {
        None
    }
}

async fn measure_latency_jitter(client: &reqwest::Client) -> (Option<f64>, Option<f64>) {
    const PING_COUNT: usize = 20;
    const PING_BYTES: u64 = 1000;
    let ping_url = format!("{}{}{}", CLOUDFLARE_HOST, DOWNLOAD_PATH, PING_BYTES);

    let mut successful_rtts: Vec<f64> = Vec::new();

    for _ in 0..PING_COUNT {
        let start = Instant::now();

        match client.get(&ping_url).send().await {
            Ok(response) => {
                let rtt_ms = start.elapsed().as_millis() as f64;
                if response.status().is_success() {
                    let _ = response.bytes().await;
                    successful_rtts.push(rtt_ms);
                }
            }
            Err(_) => {
                // Do not count failed pings, just skip
            }
        }
        time::sleep(Duration::from_millis(50)).await;
    }

    if successful_rtts.is_empty() {
        return (None, None);
    }

    successful_rtts.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let median_rtt = successful_rtts[successful_rtts.len() / 2];

    let mut jitter_sum = 0.0;
    let mut jitter_samples = 0;
    for i in 0..successful_rtts.len().saturating_sub(1) {
        jitter_sum += (successful_rtts[i + 1] - successful_rtts[i]).abs();
        jitter_samples += 1;
    }

    let jitter_ms = if jitter_samples > 0 {
        Some(jitter_sum / jitter_samples as f64)
    } else {
        Some(0.0) // Only one successful ping, jitter is zero.
    };

    (Some(median_rtt), jitter_ms)
}

#[tauri::command]
pub async fn run_full_speed_test() -> FullTestResult {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .expect("Failed to build reqwest client");

    let (net_quality_res, download_res, upload_res) = tokio::join!(
        measure_latency_jitter(&client),
        measure_download_speed(&client),
        measure_upload_speed(&client),
    );

    let (latency_ms, jitter_ms) = net_quality_res;

    FullTestResult {
        download_mbps: download_res,
        upload_mbps: upload_res,
        latency_ms,
        jitter_ms,
        packet_loss_percent: None,
        error: None,
    }
}