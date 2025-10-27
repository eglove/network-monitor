import {useQuery} from "@tanstack/react-query";
import {invoke} from "@tauri-apps/api/core";
import convert from "convert";
import {useRef, useState} from "react";
import {Legend, Line, LineChart, XAxis, YAxis} from "recharts";
import {mbpsFormatter} from "../util/formatters.ts";
import {getMedian} from "../util/math.ts";
import {Button, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@heroui/react";
import maxBy from "lodash/maxBy";
import meanBy from "lodash/meanBy";
import last from "lodash/last";

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
					].filter(m => m.rx >=0 && m.tx >= 0);
				})
			}

			prevMetric.current = currentMetric;
			return null;
		}
	});

	const averageRx = meanBy(metrics, "rx");
	const averageTx = meanBy(metrics, "tx");
	const medianRx = getMedian(metrics.map(m => m.rx));
	const medianTx = getMedian(metrics.map(m => m.tx));
	const maxRx = maxBy(metrics, "rx")?.rx ?? 0;
	const maxTx = maxBy(metrics, "tx")?.tx ?? 0;

	return (
		<div className="grid gap-4 place-items-center">
			<Table aria-label="Network Metrics" classNames={{table: "table-fixed w-96"}}>
				<TableHeader>
					<TableColumn>Metric</TableColumn>
					<TableColumn>Current</TableColumn>
					<TableColumn>Avg.</TableColumn>
					<TableColumn>Max</TableColumn>
					<TableColumn>Median</TableColumn>
				</TableHeader>
				<TableBody>
					<TableRow key="1" className="text-blue-300">
						<TableCell>RX</TableCell>
						<TableCell>{mbpsFormatter.format(last(metrics)?.rx ?? 0)}</TableCell>
						<TableCell>{mbpsFormatter.format(averageRx)}</TableCell>
						<TableCell>{mbpsFormatter.format(maxRx)}</TableCell>
						<TableCell>{mbpsFormatter.format(medianRx)}</TableCell>
					</TableRow>
					<TableRow key="2" className="text-rose-300">
						<TableCell>TX</TableCell>
						<TableCell>{mbpsFormatter.format(last(metrics)?.tx ?? 0)}</TableCell>
						<TableCell>{mbpsFormatter.format(averageTx)}</TableCell>
						<TableCell>{mbpsFormatter.format(maxTx)}</TableCell>
						<TableCell>{mbpsFormatter.format(medianTx)}</TableCell>
					</TableRow>
				</TableBody>
			</Table>
			<LineChart data={metrics} width={600} height={300}>
				<XAxis dataKey="time"/>
				<YAxis label={{value: "Mb/s", position: "insideLeft", angle: -90}} width="auto"/>
				<Line isAnimationActive={false} dataKey="rx" name="RX" stroke="var(--color-blue-300)"/>
				<Line isAnimationActive={false} dataKey="tx" name="TX" stroke="var(--color-rose-300)"/>
				<Legend/>
			</LineChart>
			<Button size="sm" color="danger" onPress={() => {
				setMetrics([])
			}}>Clear</Button>
		</div>
	);
}