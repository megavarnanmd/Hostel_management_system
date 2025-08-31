import React from 'react'
import { api } from '../api'
import ComplaintCard from '../components/ComplaintCard'

export default function ResidentDashboard(){
  const [list,setList] = React.useState([])
  const [title,setTitle] = React.useState('Leaky Faucet in Room 102')
  const [desc,setDesc] = React.useState('Water is dripping continuously, wasting water.')
  const [file,setFile] = React.useState(null)

  const [locType, setLocType] = React.useState('ROOM') // ROOM | AREA
  const [room, setRoom] = React.useState('')
  const [area, setArea] = React.useState('')

  const [loading,setLoading] = React.useState(false)

  async function load(){ setList(await api.listComplaints()) }
  React.useEffect(()=>{ load() },[])

  async function submit(e){
    e.preventDefault(); setLoading(true)
    try {
      const locationText = locType === 'ROOM' ? room.trim() : area.trim()
      if (!locationText) return alert('Please enter the location')
      await api.createComplaint(title, desc, file, locType, locationText)
      setTitle(''); setDesc(''); setFile(null); setRoom(''); setArea('')
      await load()
      alert('Complaint submitted!')
    } finally { setLoading(false) }
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1 card">
        <h2 className="text-xl font-semibold mb-3">New Complaint</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Heading</label>
            <input className="input" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows="4" value={desc} onChange={e=>setDesc(e.target.value)} />
          </div>

          <div>
            <label className="label">Location</label>
            <div className="flex gap-3 mb-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="loc" checked={locType==='ROOM'} onChange={()=>setLocType('ROOM')} />
                <span>Room number</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="loc" checked={locType==='AREA'} onChange={()=>setLocType('AREA')} />
                <span>Other area</span>
              </label>
            </div>
            {locType==='ROOM' ? (
              <input className="input" placeholder="e.g., 102" value={room} onChange={e=>setRoom(e.target.value)} />
            ) : (
              <input className="input" placeholder="e.g., Dining hall wash area" value={area} onChange={e=>setArea(e.target.value)} />
            )}
          </div>

          <div>
            <label className="label">Photo (optional)</label>
            <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] || null)} />
          </div>
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Submitting...':'Submit'}</button>
        </form>
      </div>

      <div className="md:col-span-2 space-y-4">
        <h2 className="text-xl font-semibold">My Complaints</h2>
        {list.map(c=>(
          <ComplaintCard key={c.id} c={c}/>
        ))}
      </div>
    </div>
  )
}
