import DataChartDay from './DataChartDay'
import DataChartTime from './DataChartTime'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const Statistics = ({bookings}) => {
  return (
	<section className="mt-6 w-full min-w-0">
	<h2 className="font-display text-xl font-semibold">Varaustilastot</h2>
	<div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
		<Card className="min-w-0">
			<CardHeader>
				<CardTitle className="text-lg">Päivän mukaan</CardTitle>
			</CardHeader>
			<CardContent className="min-w-0">
				<DataChartDay bookings={bookings}/>
			</CardContent>
		</Card>
		<Card className="min-w-0">
			<CardHeader>
				<CardTitle className="text-lg">Ajan mukaan</CardTitle>
			</CardHeader>
			<CardContent className="min-w-0">
				<DataChartTime bookings={bookings}/>
			</CardContent>
		</Card>
	</div>
	</section>
  )
}

export default Statistics
