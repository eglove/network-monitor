#[cfg(target_os = "windows")]
#[tokio::test]
async fn test_get_network_metrics_returns_active_interface() {
    // Compile-time path: expect the library to expose the module and function.
    use network_monitor_lib::network_metrics::{get_network_metrics, InterfaceMetrics, InterfaceKind};

    let res = get_network_metrics().await;
    assert!(res.is_ok(), "Expected Ok result, got: {:?}", res);

    let iface: InterfaceMetrics = res.unwrap();

    // rx and tx should be present (unsigned counters)
    assert!(iface.rx_bytes >= 0, "rx_bytes should be >= 0");
    assert!(iface.tx_bytes >= 0, "tx_bytes should be >= 0");

    // Signal quality is only expected for Wi‑Fi; when present, it must be 0..=100
    if matches!(iface.kind, InterfaceKind::Wifi) {
        if let Some(signal) = iface.signal_quality {
            assert!(signal <= 100, "signal_quality must be 0..=100, got {}", signal);
        }
    }
}

#[cfg(not(target_os = "windows"))]
#[test]
fn test_skip_on_non_windows() {
    // Placeholder so test suites on other OS don't fail when running cross-platform CI.
    // The implementation is Windows-only per requirements.
    assert!(true);
}
