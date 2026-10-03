import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';

const chartConfig = { bookings: { label: 'Varaukset', color: '#245a91' } };

const DataChartDay = ({bookings}) => {

	const weekdays = Array(7).fill(0);

	bookings.forEach(booking => {
		const date = new Date(booking.selectedDate);
		const dayOfWeek = date.getDay();
		weekdays[dayOfWeek] += 1;
	});

	const dataset = [
		{
		bookings: weekdays[1],
		day: 'Maanantai',
		},
		{
		bookings: weekdays[2],
		day: 'Tiistai',
		},
		{
		bookings: weekdays[3],
		day: 'Keskiviikko',
		},
		{
		bookings: weekdays[4],
		day: 'Torstai',
		},
		{
		bookings: weekdays[5],
		day: 'Perjantai',
		},
	];

	return (
		<ChartContainer config={chartConfig} className="h-72 w-full">
			<BarChart
				accessibilityLayer
				data={dataset}
				layout="vertical"
				margin={{ top: 5, right: 30, bottom: 25, left: 20 }}
			>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis
					type="number"
					allowDecimals={false}
					label={{ value: 'varausten määrä', position: 'insideBottom', offset: -15 }}
				/>
				<YAxis type="category" dataKey="day" width={100} />
				<ChartTooltip content={<ChartTooltipContent />} />
				<Bar dataKey="bookings" name="Varaukset" fill="var(--color-bookings)" radius={[0, 4, 4, 0]} />
			</BarChart>
		</ChartContainer>
	)
}

export default DataChartDay
