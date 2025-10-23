// @ts-ignore
import {useQueries, useQuery} from "@tanstack/react-query";
import {runSpeedTest} from "../db/speed-test.ts";
import {TestResults} from "./test-results.tsx";
import {PingResults} from "./ping-results.tsx";
import ms from "ms";

export const Results = () => {
    const testResult = useQuery({
        refetchInterval: ms('1hr'),
        queryKey: ["test"],
        queryFn: async () => {
            return runSpeedTest();
        }
    });

	console.log(ms('1min'))

    return (
        <div>
            <PingResults/>
            <div className="table-container">
                <table className="performance-table">
                    <thead>
                    <tr className="table-header-row">
                        <th>Download</th>
                        <th>Upload</th>
                        <th>Latency</th>
                        <th>Jitter</th>
                        <th>Time</th>
                    </tr>
                    </thead>
                    <tbody className="table-body">
                    {testResult.data && testResult.data?.length > 0 && testResult.data?.map(result => {
                        return <TestResults key={result.timestamp} result={result}/>
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}