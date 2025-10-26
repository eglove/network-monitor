import {useQuery} from "@tanstack/react-query";
import {invoke} from "@tauri-apps/api/core";
import convert from "convert";
import {useRef, useState} from "react";
import {Legend, Line, LineChart, ReferenceLine, XAxis, YAxis} from "recharts";
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

const MIN_HEALTHY_SPEED_MBPS = 400;
const MID_HEALTHY_SPEED_MBPS = 700;
const MAX_HEALTHY_SPEED_MBPS = 1000;

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
					const newMetrics = prev.length >= convert(5, 'minutes').to('seconds') ? prev.slice(1) : prev;

					return [
						...newMetrics,
						{
							tx: txMbPerS,
							rx: rxMbPerS,
							time: new Date().toLocaleTimeString(undefined, {timeStyle: 'short'}),
						}
					]
				})
			}

			prevMetric.current = currentMetric;
			return null;
		}
	});

	const currentRx = metrics.at(-1)?.rx ?? 0;
	const currentTx = metrics.at(-1)?.tx ?? 0;

	return (
		<div className="grid gap-4 place-items-center">
			<div>
				<span className="text-blue-300">{mbpsFormatter.format(currentRx)}</span>{" - "}
				<span className="text-rose-300">{mbpsFormatter.format(currentTx)}</span>
			</div>
			<LineChart data={metrics} width={600} height={300}>
				<XAxis dataKey="time"/>
				<YAxis label={{value: "MB/s", position: "insideLeft", angle: -90}} width="auto"/>
				<Line isAnimationActive={false} dataKey="rx" name="RX" stroke="var(--color-blue-300)"/>
				<Line isAnimationActive={false} dataKey="tx" name="TX" stroke="var(--color-rose-300)"/>
				<Legend/>
				<ReferenceLine
					y={MIN_HEALTHY_SPEED_MBPS}
					label={{
						value: `${MIN_HEALTHY_SPEED_MBPS} MB/s`,
						position: 'top',
						fill: 'var(--color-rose-500)'
					}}
					stroke="var(--color-rose-500)"
					strokeDasharray="3 3"
				/>
				<ReferenceLine
					y={MID_HEALTHY_SPEED_MBPS}
					label={{
						value: `${MID_HEALTHY_SPEED_MBPS} MB/s`,
						position: 'top',
						fill: 'var(--color-yellow-500)'
					}}
					stroke="var(--color-yellow-500)"
					strokeDasharray="3 3"
				/>
				<ReferenceLine
					y={MAX_HEALTHY_SPEED_MBPS}
					label={{
						value: `${MAX_HEALTHY_SPEED_MBPS} MB/s`,
						position: 'top',
						fill: 'var(--color-green-500)'
					}}
					stroke="var(--color-green-500)"
					strokeDasharray="3 3"
				/>
			</LineChart>
		</div>
	);
}