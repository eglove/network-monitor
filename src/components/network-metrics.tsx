import {useQuery, useQueryClient} from "@tanstack/react-query";
import {invoke} from "@tauri-apps/api/core";
import convert from "convert";
import {useRef, useState} from "react";
import {Legend, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis} from "recharts";
import {Button, Card, CardBody} from "@heroui/react";
import {mbpsFormatter} from "../util/formatters.ts";
import {runSpeedTest} from "../db/speed-test.ts";

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

const disableThreshold = 1;
const MIN_HEALTHY_SPEED_MBPS = 400;
const MID_HEALTHY_SPEED_MBPS = 700;
const MAX_HEALTHY_SPEED_MBPS = 1000;

export const NetworkMetrics = () => {
	const queryClient = useQueryClient();
	const [metrics, setMetrics] = useState<NetworkMetricConverted[]>([]);
	const [isRunDisabled, setIsRunDisabled] = useState(false);
	const prevMetric = useRef<NetworkMetric | null>(null);

	const speedTest = () => {
		queryClient.fetchQuery({
			queryKey: ["test"],
			queryFn: async () => {
				return runSpeedTest();
			}
		}).catch(console.error);
	}

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

				if (rxMbPerS > disableThreshold) {
					setIsRunDisabled(true);
				} else {
					setIsRunDisabled(false);
				}

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
		<div className="grid gap-4 place-items-center">
			<Button isDisabled={isRunDisabled} onPress={speedTest} color="primary">Run
				Speed Test</Button>
			<LineChart data={metrics} width={600} height={300}>
				<XAxis dataKey="time"/>
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