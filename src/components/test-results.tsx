import {getPerformanceColorClass, mbpsFormatter, msFormatter} from "../util/formatters.ts";
import {runSpeedTest} from "../db/speed-test.ts";

type TestResultsProperties = {
    result: Awaited<ReturnType<typeof runSpeedTest>>[number]
}


export const TestResults = ({result}: Readonly<TestResultsProperties>) => {
    const downloadSpeedString = result.download_mbps ? mbpsFormatter.format(result.download_mbps) : '-';
    const uploadSpeedString = result.upload_mbps ? mbpsFormatter.format(result.upload_mbps) : '-';
    const latencyString = result.latency_ms ? msFormatter.format(result.latency_ms) : '-';
    const jitterString = result.jitter_ms ? msFormatter.format(result.jitter_ms) : '-';

    const downloadClass = getPerformanceColorClass('speed', result.download_mbps);
    const uploadClass = getPerformanceColorClass('upload-speed', result.upload_mbps);
    const latencyClass = getPerformanceColorClass('latency', result.latency_ms);
    const jitterClass = getPerformanceColorClass('jitter', result.jitter_ms);

    return (
        <tr className="table-row">
            <td className={`table-cell ${downloadClass}`}>
                {downloadSpeedString}
            </td>
            <td className={`table-cell ${uploadClass}`}>
                {uploadSpeedString}
            </td>
            <td className={`table-cell ${latencyClass}`}>
                {latencyString}
            </td>
            <td className={`table-cell ${jitterClass}`}>
                {jitterString}
            </td>
            <td className="table-cell">
                {result.timestamp ? new Date(result.timestamp).toLocaleString(undefined, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                }) : '-'}
            </td>
        </tr>
    )
}