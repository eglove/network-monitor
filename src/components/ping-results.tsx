import {invoke} from "@tauri-apps/api/core";
import {useQuery} from "@tanstack/react-query";
import {getPerformanceColorClass, msFormatter} from "../util/formatters.ts";
import ms from "ms";

type PingResult = {
	ip: string;
	status: string;
	latency_ms: number;
}

export const PingResults = () => {
	const {data, dataUpdatedAt} = useQuery({
		refetchInterval: ms('60sec'),
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
				<div className="latest-test-info">
					<div className="latest-test-date">Last Ping Run: {new Date(dataUpdatedAt).toLocaleString(undefined, {
						dateStyle: 'medium',
						timeStyle: 'short',
					})}</div>
				</div>
				<div className="ping-results-container">
					<div className="ping-card">
						<div className="ping-ip-label ip-cloudflare">
							Cloudflare (1.1.1.1)
						</div>
						<div className={`ping-value ${cfClass}`}>{cfLatency}</div>
					</div>

					<div className="ping-card">
						<div className="ping-ip-label ip-cloudflare">
							Google (8.8.8.8)
						</div>
						<div className={`ping-value ${gClass}`}>{gLatency}</div>
					</div>

					<div className="ping-card">
						<div className="ping-ip-label ip-cloudflare">
							Level 3 (4.2.2.2)
						</div>
						<div className={`ping-value ${l3Class}`}>{l3Latency}</div>
					</div>
				</div>
			</>
		)}
	</>
}