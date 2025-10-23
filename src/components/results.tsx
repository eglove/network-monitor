// @ts-ignore
import {useQueries, useQuery} from "@tanstack/react-query";
import {runSpeedTest} from "../db/speed-test.ts";
import {PingResults} from "./ping-results.tsx";
import ms from "ms";
import {getKeyValue, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import {getPerformanceColorClass, mbpsFormatter, msFormatter} from "../util/formatters.ts";

const columns = [
	{key: 'download_mbps', label: "DOWNLOAD"},
	{key: 'upload_mbps', label: 'UPLOAD'},
	{key: 'latency_ms', label: 'LATENCY'},
	{key: 'jitter_ms', label: 'JITTER'},
	{key: 'timestamp', label: 'TIME'}
]

export const Results = () => {
	const testResult = useQuery({
		refetchInterval: ms('1hr'),
		queryKey: ["test"],
		queryFn: async () => {
			return runSpeedTest();
		},
	});

	return (
		<div>
			<PingResults/>
			<Table isStriped className="max-h-[600px]" aria-label="Network tests">
				<TableHeader columns={columns}>
					{(column) => {
						return <TableColumn key={column.key}>{column.label}</TableColumn>
					}}
				</TableHeader>
				<TableBody isLoading={testResult.isPending} loadingContent={<Spinner label="Loading..." />} items={testResult.data ?? []}>
					{(item) => (
						<TableRow key={item.timestamp}>
							{(columnKey) => {
								const value = getKeyValue(item, columnKey);

								switch (columnKey) {
									case "download_mbps": {
										const classString = getPerformanceColorClass('speed', value);
										const textString = value ? mbpsFormatter.format(value) : '-';

										return <TableCell className={classString}>{textString}</TableCell>
									}

									case "upload_mbps": {
										const classString = getPerformanceColorClass('upload-speed', value);
										const textString = value ? mbpsFormatter.format(value) : '-';

										return <TableCell className={classString}>{textString}</TableCell>
									}

									case 'latency_ms': {
										const classString = getPerformanceColorClass('latency', value);
										const textString = value ? msFormatter.format(value) : '-';

										return <TableCell className={classString}>{textString}</TableCell>
									}

									case 'jitter_ms': {
										const classString = getPerformanceColorClass('jitter', value);
										const textString = value ? msFormatter.format(value) : '-';

										return <TableCell className={classString}>{textString}</TableCell>
									}

									case 'timestamp': {
										return <TableCell>{new Date(value).toLocaleString(undefined, {
											dateStyle: 'short',
											timeStyle: 'short'
										})}</TableCell>
									}
								}

								return <TableCell>{getKeyValue(item, columnKey)}</TableCell>
							}}
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	)
}