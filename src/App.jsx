import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './Pages/Home'
import Results from './Pages/Results'
import Login from './Pages/Login'
import Signup from './Pages/Signup'
import SeatSelection from './Pages/SeatSelection'
import Checkout from './Pages/Checkout'
import Confirmation from './Pages/Confirmation'
import MyBookings from './Pages/MyBookings'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/results" element={<Results />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/flights/:id/seats" element={<SeatSelection />} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/confirmation/:id" element={<ProtectedRoute><Confirmation /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
      </Routes>
    </>
  )
}