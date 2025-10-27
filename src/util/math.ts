export const getMedian = (numbers: number[]) => {
	const median = numbers.sort((a, b) => a - b)[Math.floor(numbers.length / 2)];

	if (Number.isNaN(median) || !median) {
		return 0;
	}

	return median;
}