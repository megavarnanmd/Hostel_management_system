import React from 'react'
import { getUser, logout } from '../auth'
import { api } from '../api'
import { Bell } from './icons'

export default function Navbar(){
  const user = getUser()
  const [open, setOpen] = React.useState(false)
  const [list, setList] = React.useState([])

  async function load(){
    try { setList(await api.notifications()) } catch {}
  }
  React.useEffect(()=>{ if(user) load() },[])

  return (
    <header className="sticky top-0 z-10 shadow-sm">
      <div className="bg-gradient-to-r from-brand-800 via-teal-700 to-sky-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/15 grid place-items-center font-bold backdrop-blur">
              HMS
            </div>
            <div className="font-semibold tracking-wide">Hostel Management System</div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="relative">
                <button className="btn-muted !bg-white/15 !text-white hover:!bg-white/25" onClick={()=>setOpen(v=>!v)} aria-label="Notifications">
                  <Bell className="w-5 h-5"/><span>Alerts</span>
                </button>
                {open && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-soft border p-3 max-h-96 overflow-auto">
                    <div className="font-semibold mb-2">Notifications</div>
                    {list.length===0 && <div className="text-sm text-gray-500">No notifications yet.</div>}
                    <ul className="space-y-2">
                      {list.map(n=>(
                        <li key={n.id} className={`p-2 rounded-xl ${n.isRead? 'bg-gray-50':'bg-brand-50'}`}>
                          <div className="text-sm">{n.message}</div>
                          <div className="text-xs text-gray-500">{new Date(n.createdAt+'Z').toLocaleString()}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/90">{user.name} • <span className="uppercase text-xs font-semibold">{user.role}</span></span>
                <button className="btn-primary" onClick={logout}>Logout</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
