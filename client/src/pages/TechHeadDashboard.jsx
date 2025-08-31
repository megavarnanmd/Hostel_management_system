import React from 'react'
import { api } from '../api'
import ComplaintCard from '../components/ComplaintCard'

export default function TechHeadDashboard(){
  const [list,setList] = React.useState([])
  const [techs,setTechs] = React.useState([])
  const [assigning,setAssigning] = React.useState({})

  async function load(){
    setList(await api.listComplaints())
    setTechs(await api.listTechnicians())
  }
  React.useEffect(()=>{ load() },[])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Queue</h2>
      {list.map(c=>(
        <ComplaintCard key={c.id} c={c}>
          {c.status === 'SENT_TO_TECHNICIAN' && (
            <div className="flex gap-2 items-center">
              <select className="input" value={assigning[c.id] || ''} onChange={e=>setAssigning(prev=>({...prev, [c.id]: e.target.value}))}>
                <option value="" disabled>Select Technician</option>
                {techs.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button className="btn-primary" onClick={async()=>{
                const technicianId = assigning[c.id]
                if(!technicianId) return alert('Pick a tech first')
                await api.assignComplaint(c.id, Number(technicianId))
                await load()
              }}>Assign</button>
            </div>
          )}
          {c.status === 'COMPLETED_BY_TECHNICIAN' && (
            <div className="text-sm text-gray-600">Completion submitted. Warden & Resident notified for final verification.</div>
          )}
        </ComplaintCard>
      ))}
    </div>
  )
}
