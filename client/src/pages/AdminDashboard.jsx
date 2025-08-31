import React from 'react'
import { api } from '../api'

const roles = ['ADMIN','RESIDENT','WARDEN','TECH_HEAD','TECHNICIAN']

export default function AdminDashboard(){
  const [users, setUsers] = React.useState([])
  const [form, setForm] = React.useState({name:'', email:'', password:'', role:'RESIDENT'})
  const [loading, setLoading] = React.useState(false)

  async function load(){ setUsers(await api.adminListUsers()) }
  React.useEffect(()=>{ load() },[])

  async function create(e){
    e.preventDefault(); setLoading(true)
    try{
      await api.adminCreateUser(form.name, form.email, form.password, form.role)
      setForm({name:'',email:'',password:'',role:'RESIDENT'})
      await load(); alert('User created')
    } catch(e){ alert(e.message) } finally{ setLoading(false) }
  }

  async function remove(id){
    if(!confirm('Delete this user?')) return
    try{ await api.adminDeleteUser(id); await load() } catch(e){ alert(e.message) }
  }

  async function toggleBlock(u){
    const block = !u.isBlocked
    if(!confirm(`${block?'Block':'Unblock'} ${u.name}?`)) return
    await api.adminSetBlock(u.id, block)
    await load()
  }

  async function removeDemos(){
    if(!confirm('Remove demo accounts?')) return
    const res = await api.adminRemoveDemos()
    alert(`Removed ${res.removed} demo users`)
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Admin — User Management</h2>
        <button className="btn-muted" onClick={removeDemos}>Remove Demo Accounts</button>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Create User</h3>
        <form className="grid md:grid-cols-4 gap-3" onSubmit={create}>
          <input className="input" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
          <input className="input" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
          <input className="input" placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
          <select className="input" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
            {roles.map(r=> <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="md:col-span-4">
            <button className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create User'}</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">All Users</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="p-2">ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
                <th className="p-2">Blocked</th>
                <th className="p-2">Created</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id} className="border-t">
                  <td className="p-2">{u.id}</td>
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2"><span className="badge bg-gray-100">{u.role}</span></td>
                  <td className="p-2">{u.isBlocked ? <span className="badge bg-red-100 text-red-700">Blocked</span> : <span className="badge bg-emerald-100 text-emerald-700">Active</span>}</td>
                  <td className="p-2">{new Date(u.createdAt+'Z').toLocaleString()}</td>
                  <td className="p-2 flex gap-2">
                    <button className="btn-muted" onClick={()=>toggleBlock(u)}>{u.isBlocked ? 'Unblock' : 'Block'}</button>
                    <button className="btn-muted" onClick={()=>remove(u.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td className="p-2 text-gray-500" colSpan={7}>No users.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
