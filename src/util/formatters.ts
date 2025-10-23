export const mbpsFormatter = new Intl.NumberFormat(undefined, {
    style: "unit",
    unit: "megabit-per-second",
    unitDisplay: "short",
    maximumFractionDigits: 2,
});

export const msFormatter = new Intl.NumberFormat(undefined, {
    style: "unit",
    unit: "millisecond",
    unitDisplay: "short",
    maximumFractionDigits: 2,
})

export const getPerformanceColorClass = (metricType: string, value: number | undefined) => {
    if (value === null || value === undefined) return '';

		if (metricType === 'ping') {
			if (value <= 30) return 'text-good';
			if (value <= 50) return 'text-okay';
			return 'text-bad';
		}
    if (metricType === 'latency') {
        if (value <= 70) return 'text-good';
        if (value <= 100) return 'text-okay';
        return 'text-bad';
    } else if (metricType === 'jitter') {
        if (value <= 10) return 'text-good';
        if (value <= 20) return 'text-okay';
        return 'text-bad';
    } else if (metricType === 'speed') {
        if (value >= 600) return 'text-good';
        if (value >= 400) return 'text-okay';
        return 'text-bad';
    } else if (metricType === 'upload-speed') {
        if (value >= 10) return 'text-good';
        if (value >= 5) return 'text-okay';
        return 'text-bad';
    }
    return '';
};