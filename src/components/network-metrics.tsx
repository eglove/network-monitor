import {useQuery} from "@tanstack/react-query";
import {invoke} from "@tauri-apps/api/core";
import convert from "convert";
import {useRef, useState} from "react";
import {Legend, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis} from "recharts";
import {Card, CardBody} from "@heroui/react";
import {mbpsFormatter} from "../util/formatters.ts";

type NetworkMetric = {
    name: string
    kind: string
    rx_bytes: number
    tx_bytes: number
    signal_quality: any
}

type NetworkMetricConverted = {
    time: string
    tx: number
    rx: number
}

const MIN_HEALTHY_SPEED_MBPS = 40;

export const NetworkMetrics = () => {
    const [metrics, setMetrics] = useState<NetworkMetricConverted[]>([]);
    const prevMetric = useRef<NetworkMetric | null>(null);

    useQuery({
        queryKey: ["network-metrics"],
        refetchInterval: 1000,
        queryFn: async () => {
            const currentMetric = await invoke<NetworkMetric>("get_network_metrics");

            if (prevMetric.current) {
                const metric = prevMetric.current;

                const rxDiffBytes = currentMetric.rx_bytes - metric.rx_bytes;
                const txDiffBytes = currentMetric.tx_bytes - metric.tx_bytes;

                const rxMbPerS = convert(rxDiffBytes, 'bytes').to('megabits');
                const txMbPerS = convert(txDiffBytes, 'bytes').to('megabits');

                setMetrics(prev => {
                    const newMetrics = prev.length >= 60 ? prev.slice(1) : prev;

                    return [
                        ...newMetrics,
                        {
                            tx: txMbPerS,
                            rx: rxMbPerS,
                            time: new Date().toLocaleTimeString(undefined, {timeStyle: 'medium'}),
                        }
                    ]
                })
            }

            prevMetric.current = currentMetric;
            return null;
        }
    });

    return (
        <LineChart data={metrics} width={600} height={300}>
            <XAxis dataKey="time" />
            <YAxis label={{value: "Mb/s", position: "insideLeft", angle: -90}} width="auto"/>
            <Tooltip content={(props) => {
                const rxValue = props.payload.find(i => i.name === "RX")?.value;
                const txValue = props.payload.find(i => i.name === "TX")?.value;

                return (
                    <Card>
                        <CardBody>
                            {rxValue && <div>RX: {mbpsFormatter.format(rxValue)}</div>}
                            {txValue && <div>TX: {mbpsFormatter.format(txValue)}</div>}
                        </CardBody>
                    </Card>
                )
            }}/>
            <Line isAnimationActive={false} dataKey="tx" name="TX" stroke="var(--color-rose-300)"/>
            <Line isAnimationActive={false} dataKey="rx" name="RX" stroke="var(--color-blue-300)"/>
            <Legend/>
            <ReferenceLine
                y={MIN_HEALTHY_SPEED_MBPS}
                label={{
                    value: `Below ${MIN_HEALTHY_SPEED_MBPS} MB/s (Slow)`,
                    position: 'top',
                    fill: 'red'
                }}
                stroke="var(--color-red-500)"
                strokeDasharray="3 3"
            />
        </LineChart>
    );
}