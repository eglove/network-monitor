import {invoke} from "@tauri-apps/api/core";
import {useQuery} from "@tanstack/react-query";

type PingResult = {
    ip: string;
    status: string;
    latency_ms: number;
}

export const PingResults = () => {
    const {data, isPending, isError, error} = useQuery({
        queryKey: ["ping"],
        queryFn: async () => {
            return invoke<PingResult[]>("ping_addresses");
        },
        refetchInterval: 3000,
    })

    return <>
        <h2>Ping</h2>
        {Array.isArray(data) && data.length > 0 && (
            <>
                {isPending && <div>Loading...</div>}
                {isError && <div>Error: ${error.message}</div>}
                <div className="resultContainer">
                    {data?.map((result) => (
                        <div className={`result ${result.latency_ms <= 30 ? "success" : "fail"}`} key={result.ip}>
                            <div>{result.ip}</div>
                            <div>{result.latency_ms}ms</div>
                        </div>
                    ))}
                </div>
            </>
        )}
    </>
}