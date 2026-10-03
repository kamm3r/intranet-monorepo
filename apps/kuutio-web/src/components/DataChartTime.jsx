import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';

const chartConfig = { bookings: { label: 'Varaukset', color: '#147d68' } };

const DataChartTime = ({bookings}) => {

	const timeLabels = [
		'07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
		'11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
		'14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
	];

	const times = Array(timeLabels.length).fill(0);

	bookings.forEach(booking => {
		booking.selectedTime.forEach(time => {
			const index = timeLabels.indexOf(time);

			if (index !== -1) times[index] += 1;
		})
	});

	const dataset = timeLabels.map((time, index) => ({
		bookings: times[index],
		time,
	}));

	return (
		<ChartContainer config={chartConfig} className="h-72 w-full">
			<LineChart
				accessibilityLayer
				data={dataset}
				margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
			>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis
					dataKey="time"
					angle={-45}
					textAnchor="end"
					height={70}
					interval={3}
				/>
				<YAxis
					allowDecimals={false}
					label={{ value: 'varausten määrä', angle: -90, position: 'insideLeft' }}
				/>
				<ChartTooltip content={<ChartTooltipContent />} />
				<Line type="monotone" dataKey="bookings" name="Varaukset" stroke="var(--color-bookings)" strokeWidth={2} dot={false} />
			</LineChart>
		</ChartContainer>
	)
}

export default DataChartTime
