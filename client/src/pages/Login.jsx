import React from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { saveAuth } from '../auth'

export default function Login(){
  const nav = useNavigate()
  const [email,setEmail] = React.useState('admin@demo.com')
  const [password,setPassword] = React.useState('admin123')
  const [error,setError] = React.useState('')
  const [loading,setLoading] = React.useState(false)

  const handle = async (e)=>{
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const {token, user} = await api.login(email, password)
      saveAuth(token,user)
      const map = { ADMIN:'/admin', RESIDENT:'/resident', WARDEN:'/warden', TECH_HEAD:'/head', TECHNICIAN:'/tech' }
      nav(map[user.role] || '/resident', { replace:true })
    } catch (e){
      setError(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto mt-16 card">
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      <form onSubmit={handle} className="space-y-3">
        <div>
          <label className="label">Email</label>
          <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in...':'Sign in'}</button>
      </form>
      <div className="mt-4 text-xs text-gray-600 space-y-1">
        <div>Demo accounts:</div>
        <div>Admin — admin@demo.com / admin123</div>
        <div>Resident — resident@demo.com / resident123</div>
        <div>Warden — warden@demo.com / warden123</div>
        <div>Tech Head — head@demo.com / head123</div>
        <div>Technician — tech1@demo.com / tech123</div>
      </div>
    </div>
  )
}
