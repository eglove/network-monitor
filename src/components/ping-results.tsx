import {invoke} from "@tauri-apps/api/core";
import {useQuery} from "@tanstack/react-query";
import {getPerformanceColorClass, msFormatter} from "../util/formatters.ts";
import ms from "ms";
import {Card, CardBody, CardHeader} from "@heroui/react"

type PingResult = {
	ip: string;
	status: string;
	latency_ms: number;
}

export const PingResults = () => {
	const {data, dataUpdatedAt} = useQuery({
		refetchInterval: ms('1min'),
		queryKey: ["ping"],
		queryFn: async () => {
			const result = await invoke<PingResult[]>("ping_addresses");

			return {
				cloudflarePing: result.find(r => r.ip === '1.1.1.1'),
				googlePing: result.find(r => r.ip === '8.8.8.8'),
				l3Ping: result.find(r => r.ip === '4.2.2.2'),
			}
		}
	});

	const cfClass = getPerformanceColorClass('ping', data?.cloudflarePing?.latency_ms);
	const gClass = getPerformanceColorClass('ping', data?.googlePing?.latency_ms);
	const l3Class = getPerformanceColorClass('ping', data?.l3Ping?.latency_ms);


	const cfLatency = data?.cloudflarePing?.latency_ms ? msFormatter.format(data?.cloudflarePing.latency_ms) : '-';
	const gLatency = data?.googlePing?.latency_ms ? msFormatter.format(data?.googlePing.latency_ms) : '-';
	const l3Latency = data?.l3Ping?.latency_ms ? msFormatter.format(data?.l3Ping.latency_ms) : '-';

	return <>
		{data && (
			<>
				<div className="text-right mb-2">
					<div className="text-sm text-blue-100">Last Ping: {new Date(dataUpdatedAt).toLocaleString(undefined, {
						dateStyle: 'medium',
						timeStyle: 'short',
					})}</div>
				</div>
				<div className="grid grid-cols-3 gap-4 mb-4">
					<Card>
						<CardHeader className="pb-0 text-sm text-blue-300">CLOUDFLARE (1.1.1.1)</CardHeader>
						<CardBody className={`text-4xl font-bold ${cfClass}`}>{cfLatency}</CardBody>
					</Card>

					<Card>
						<CardHeader className="pb-0 text-sm text-rose-300">Google (8.8.8.8)</CardHeader>
						<CardBody className={`text-4xl font-bold ${gClass}`}>{gLatency}</CardBody>
					</Card>

					<Card>
						<CardHeader className="pb-0 text-sm text-purple-300">Level 3 (4.2.2.2)</CardHeader>
						<CardBody className={`text-4xl font-bold ${l3Class}`}>{l3Latency}</CardBody>
					</Card>
				</div>
			</>
		)}
	</>
}