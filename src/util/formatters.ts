export const mbpsFormatter = new Intl.NumberFormat(undefined, {
	style: "unit",
	unit: "megabit-per-second",
	unitDisplay: "short",
	maximumFractionDigits: 2,
	minimumFractionDigits: 2,
});

export const msFormatter = new Intl.NumberFormat(undefined, {
	style: "unit",
	unit: "millisecond",
	unitDisplay: "short",
	maximumFractionDigits: 2,
})

export const percentFormatter = new Intl.NumberFormat(undefined, {
	style: "percent",
	maximumFractionDigits: 2,
})

export const getPerformanceColorClass = (metricType: 'ping' | 'latency' | 'jitter' | 'speed' | 'upload-speed', value: number | undefined) => {
	if (value === null || value === undefined) return '';

	if (metricType === 'ping') {
		if (value <= 30) return 'text-green-300';
		if (value <= 50) return 'text-yellow-300';
		return 'text-red-300';
	}
	if (metricType === 'latency') {
		if (value <= 70) return 'text-green-300';
		if (value <= 100) return 'text-yellow-300';
		return 'text-red-300';
	} else if (metricType === 'jitter') {
		if (value <= 10) return 'text-green-300';
		if (value <= 20) return 'text-yellow-300';
		return 'text-red-300';
	} else if (metricType === 'speed') {
		if (value >= 600) return 'text-green-300';
		if (value >= 400) return 'text-yellow-300';
		return 'text-red-300';
	} else if (metricType === 'upload-speed') {
		if (value >= 10) return 'text-green-300';
		if (value >= 5) return 'text-yellow-300';
		return 'text-red-300';
	}
	return '';
};