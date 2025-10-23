import {invoke} from "@tauri-apps/api/core";
import {useQuery} from "@tanstack/react-query";

type TestResult = {
    download_mbps: number;
    upload_mbps: number;
    latency_ms: number;
    jitter_ms: number;
    packet_loss_percent: number;
}

const mbpsFormatter = new Intl.NumberFormat(undefined, {
    style: "unit",
    unit: "megabit-per-second",
    unitDisplay: "short",
    maximumFractionDigits: 2,
});

const msFormatter = new Intl.NumberFormat(undefined, {
    style: "unit",
    unit: "millisecond",
    unitDisplay: "short",
    maximumFractionDigits: 2,
})

export const TestResults = () => {
    const {data, isError, isPending, error} = useQuery({
        queryKey: ["test"],
        queryFn: async () => {
            return invoke<TestResult>("run_full_speed_test");
        },
        refetchInterval: 60000,
    })

    return <>
        <h2>Speed Test</h2>
        {isPending && <div>Loading...</div>}
        {isError && <div>Error: ${error.message}</div>}
        {data && <>
            <div className="resultContainer">
                <div className="result">Download: {mbpsFormatter.format(data.download_mbps)}</div>
                <div className="result">Upload: {mbpsFormatter.format(data.upload_mbps)}</div>
                <div className="result">Latency: {msFormatter.format(data.latency_ms)}</div>
                <div className="result">Jitter: {msFormatter.format(data.jitter_ms)}</div>
            </div>
        </>
        }
    </>
}