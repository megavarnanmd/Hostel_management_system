import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles.css'
import App from './App'
import Login from './pages/Login'
import ResidentDashboard from './pages/ResidentDashboard'
import WardenDashboard from './pages/WardenDashboard'
import TechHeadDashboard from './pages/TechHeadDashboard'
import TechnicianDashboard from './pages/TechnicianDashboard'
import AdminDashboard from './pages/AdminDashboard'
import NotFound from './pages/NotFound'
import { getUser } from './auth'

function Protected({ children, roles }){
  const user = getUser()
  if(!user) return <Navigate to="/login" replace />
  if(roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="resident" element={<Protected roles={['RESIDENT']}><ResidentDashboard/></Protected>} />
          <Route path="warden" element={<Protected roles={['WARDEN']}><WardenDashboard/></Protected>} />
          <Route path="head" element={<Protected roles={['TECH_HEAD']}><TechHeadDashboard/></Protected>} />
          <Route path="tech" element={<Protected roles={['TECHNICIAN']}><TechnicianDashboard/></Protected>} />
          <Route path="admin" element={<Protected roles={['ADMIN']}><AdminDashboard/></Protected>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
