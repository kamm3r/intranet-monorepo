import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import BookingPage from "./pages/BookingPage";

function App() {
	return (
		<BrowserRouter>
			<Header />
			<Routes>
				<Route path="/" element={<BookingPage />}/>
			</Routes>
		</BrowserRouter>
		);
}

export default App;
