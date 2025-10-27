import {Button, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@heroui/react";
import {useMutation} from "@tanstack/react-query";
import {invoke} from "@tauri-apps/api/core";
import convert from "convert";
import {mbpsFormatter, msFormatter, percentFormatter} from "../util/formatters.ts";

type SpeedTest = {
	type: string
	timestamp: string
	ping: Ping
	download: Download
	upload: Upload
	packetLoss: number
	isp: string
	interface: Interface
	server: Server
	result: Result
}

type Ping = {
	jitter: number
	latency: number
	low: number
	high: number
}

type Download = {
	bandwidth: number
	bytes: number
	elapsed: number
	latency: Latency
}

type Latency = {
	iqm: number
	low: number
	high: number
	jitter: number
}

type Upload = {
	bandwidth: number
	bytes: number
	elapsed: number
	latency: Latency2
}

export interface Latency2 {
	iqm: number
	low: number
	high: number
	jitter: number
}

type Interface = {
	internalIp: string
	name: string
	macAddr: string
	isVpn: boolean
	externalIp: string
}

type Server = {
	id: number
	host: string
	port: number
	name: string
	location: string
	country: string
	ip: string
}

type Result = {
	id: string
	url: string
	persisted: boolean
}

export const SpeedTest = () => {
	const {mutate, data, isPending} = useMutation({
		mutationFn: async () => {
			const result = await invoke<string>("run_speedtest");

			return JSON.parse(result) as SpeedTest;
		}
	})

	const bandwidthMbps = convert(data?.download?.bandwidth ?? 0, "bytes").to("megabits");
	const uploadMbps = convert(data?.upload?.bandwidth ?? 0, "bytes").to("megabits");

	return (
		<div className="grid place-items-center gap-4">
			<Button isLoading={isPending} onPress={() => mutate()} color="primary">Speed Test</Button>
			<Table aria-label="Speed Test">
				<TableHeader>
					<TableColumn>Name</TableColumn>
					<TableColumn>Value</TableColumn>
				</TableHeader>
				<TableBody isLoading={isPending}>
					<TableRow>
						<TableCell>ISP</TableCell>
						<TableCell>{data?.isp ?? ''}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Test Location</TableCell>
						<TableCell>{data?.server?.location ?? ''}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Ping Latency</TableCell>
						<TableCell>{msFormatter.format(data?.ping?.latency ?? 0)}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Ping Jitter</TableCell>
						<TableCell>{msFormatter.format(data?.ping?.jitter ?? 0)}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Packet Loss</TableCell>
						<TableCell>{percentFormatter.format(data?.packetLoss ?? 0)}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Download</TableCell>
						<TableCell>{mbpsFormatter.format(bandwidthMbps)}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Upload</TableCell>
						<TableCell>{mbpsFormatter.format(uploadMbps)}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Download Latency</TableCell>
						<TableCell>{msFormatter.format(data?.download?.latency?.iqm ?? 0)}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Upload Latency</TableCell>
						<TableCell>{msFormatter.format(data?.upload?.latency?.iqm ?? 0)}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Download Jitter</TableCell>
						<TableCell>{msFormatter.format(data?.download?.latency?.jitter ?? 0)}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Upload Jitter</TableCell>
						<TableCell>{msFormatter.format(data?.upload?.latency?.jitter ?? 0)}</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</div>
	)
}