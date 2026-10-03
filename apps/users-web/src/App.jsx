import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import serviceApi from "./api/services";

import { CookieTracker } from "./utils/CookieTracker";
import { ThemeProvider } from "./components/theme-provider";
import { useStore } from "./utils/store";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Reset from "./pages/Reset";
import Services from "./pages/Services";
import ServiceForm from "./pages/ServiceForm";
import Users from "./pages/Users";
import { Navbar } from "./components/header";

export default function App() {
  const { setPublicServices, setPublicServicesReady } = useStore();

  // Load the allowed domains from the server and save them to the state.
  const loadPublicServices = async () => {
    try {
      const services = await serviceApi.getAllPublic();
      setPublicServices(services);
    } catch (exception) {
      console.log("exception: ", exception);
    } finally {
      setPublicServicesReady(true);
    }
  };

  useEffect(() => {
    loadPublicServices();
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <CookieTracker />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/:domain" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/:domain" element={<Login />} />

          <Route path="/register" element={<Register />} />
          <Route path="/register/:domain" element={<Register />} />

          <Route path="/resetpassword" element={<Reset />} />

          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceForm />} />
          <Route path="/services/add" element={<ServiceForm />} />

          <Route path="/users" element={<Users />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
