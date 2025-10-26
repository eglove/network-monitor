// @ts-ignore
import {useQueries, useQuery} from "@tanstack/react-query";
import {PingResults} from "./ping-results.tsx";
import {NetworkMetrics} from "./network-metrics.tsx";

export const Results = () => {
	return (
		<div className="grid gap-4">
			<PingResults/>
			<NetworkMetrics />
		</div>
	)
}