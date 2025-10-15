import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FileUpload from './pages/FileUpload';
import BookingDetails from './pages/BookingDetails';
import Bookings from './pages/Bookings';
import Drivers from './pages/Drivers';
import Vehicles from './pages/Vehicles';
import NotFound from './pages/NotFound';
import Destinations from "./pages/Destinations.tsx";
import LocationMapPage from "./pages/LocationMapPage.tsx";
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';

function App() {
    return (
        <Router>
            <ToastContainer position="top-right" autoClose={3000} />
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route path="/" element={<Layout />}>
                    {/* Protected Routes */}
                    <Route index element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    } />
                    <Route path="upload" element={
                        <PrivateRoute>
                            <FileUpload />
                        </PrivateRoute>
                    } />
                    <Route path="bookings" element={
                        <PrivateRoute>
                            <Bookings />
                        </PrivateRoute>
                    } />
                    <Route path="bookings/:id" element={
                        <PrivateRoute>
                            <BookingDetails />
                        </PrivateRoute>
                    } />
                    <Route path="drivers" element={
                        <PrivateRoute>
                            <Drivers />
                        </PrivateRoute>
                    } />
                    <Route path="vehicles" element={
                        <PrivateRoute>
                            <Vehicles />
                        </PrivateRoute>
                    } />
                    <Route path="destinations" element={
                        <PrivateRoute>
                            <Destinations />
                        </PrivateRoute>
                    } />
                    <Route path="locationmap" element={
                        <PrivateRoute>
                            <LocationMapPage />
                        </PrivateRoute>
                    } />

                    {/* Public fallback */}
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;