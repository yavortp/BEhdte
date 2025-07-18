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

function App() {
    return (
        <Router>
            <ToastContainer position="top-right" autoClose={3000} />
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="upload" element={<FileUpload />} />
                    <Route path="bookings" element={<Bookings />} />
                    <Route path="bookings/:id" element={<BookingDetails />} />
                    <Route path="drivers" element={<Drivers />} />
                    <Route path="vehicles" element={<Vehicles />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;