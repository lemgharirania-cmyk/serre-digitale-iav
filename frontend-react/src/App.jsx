// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Geoportail from './pages/Geoportail'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('sdi_token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Geoportail />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/dashboard/*" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}