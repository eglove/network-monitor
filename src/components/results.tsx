// @ts-ignore
import {useQueries, useQuery} from "@tanstack/react-query";
import {PingResults} from "./ping-results.tsx";
import {NetworkMetrics} from "./network-metrics.tsx";
import {SpeedTest} from "./speed-test.tsx";
import {useEffect, useState} from "react";

export const Results = () => {
	const [isOnline, setIsOnline] = useState(navigator.onLine);

	useEffect(() => {
		const controller = new AbortController();

		window.addEventListener('online', () => {
			setIsOnline(true);
		}, {signal: controller.signal});
		window.addEventListener('offline', () => {
			setIsOnline(false);
		}, {signal: controller.signal});

		return () => {
			controller.abort();
		}
	}, [])

	return (
		<div className="grid gap-4">
			<div className="grid place-items-center">
				{isOnline ? <div className="text-green-500">&#x25CF; Online</div> : <div className="text-red-500">&#x25CF; Offline</div>}
			</div>
			<PingResults/>
			<NetworkMetrics/>
			<SpeedTest/>
		</div>
	)
}