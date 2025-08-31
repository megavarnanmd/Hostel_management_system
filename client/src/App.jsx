import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import { getUser } from './auth'

export default function App(){
  const nav = useNavigate()
  React.useEffect(()=>{
    const user = getUser()
    if(user){
      const map = { ADMIN:'/admin', RESIDENT:'/resident', WARDEN:'/warden', TECH_HEAD:'/head', TECHNICIAN:'/tech' }
      nav(map[user.role] || '/login', { replace:true })
    } else {
      nav('/login', { replace:true })
    }
  },[])
  return (
    <div className="min-h-screen patterned-bg">
      <Navbar />
      <div className="mx-auto max-w-6xl p-4">
        <Outlet />
      </div>
    </div>
  )
}
