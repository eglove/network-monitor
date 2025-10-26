export const getAverage = (numbers: number[]) => {
	const average = numbers.reduce((acc, curr) => acc + curr, 0) / numbers.length;

	if (Number.isNaN(average)) {
		return 0;
	}

	return average;
}