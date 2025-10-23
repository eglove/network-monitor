import {DBSchema, openDB} from "idb"
import {invoke} from "@tauri-apps/api/core";
import {TestResult} from "../util/types.ts";

type SpeedTestStore = DBSchema & {
	'speed-test': {
		key: string;
		value: {
			download_mbps: number;
			upload_mbps: number;
			latency_ms: number;
			jitter_ms: number;
			packet_loss_percent: number;
			timestamp: number;
		};
		indexes: {
			'by-timestamp': string;
		};
	}
}

const getSpeedTestDb = async () => {
	return openDB<SpeedTestStore>('speed-test', 1, {
		upgrade(db) {
			db.createObjectStore('speed-test', {
				keyPath: 'timestamp',
				autoIncrement: false,
			});
		}
	});
}

export const runSpeedTest = async () => {
	const db = await getSpeedTestDb();

	const testResult = await invoke<TestResult>("run_full_speed_test");

	await db.put('speed-test', {
		...testResult,
		timestamp: Date.now(),
	});

	const records = await db.getAll('speed-test');
	return records.reverse();
}
