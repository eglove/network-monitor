export type PingResult = {
    ip: string;
    status: string;
    latency_ms: number;
}

export type TestResult = {
    download_mbps: number;
    upload_mbps: number;
    latency_ms: number;
    jitter_ms: number;
    packet_loss_percent: number;
}