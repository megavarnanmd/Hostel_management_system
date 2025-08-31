import React from 'react'
import { api } from '../api'
import ComplaintCard from '../components/ComplaintCard'

export default function TechnicianDashboard(){
  const [list,setList] = React.useState([])
  const [msg,setMsg] = React.useState({})
  const [img,setImg] = React.useState({})
  const [misuse,setMisuse] = React.useState({}) // reason per complaint

  async function load(){ setList(await api.listComplaints()) }
  React.useEffect(()=>{ load() },[])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">My Tasks</h2>
      {list.map(c=>(
        <ComplaintCard key={c.id} c={c}>
          {c.status === 'ASSIGNED_TO_TECHNICIAN' && (
            <div className="w-full space-y-2">
              <textarea className="input" rows="3" placeholder="Completed message"
                value={msg[c.id] || ''} onChange={e=>setMsg(prev=>({...prev, [c.id]: e.target.value}))} />
              <div className="flex items-center gap-2">
                <input type="file" accept="image/*" onChange={e=>setImg(prev=>({...prev, [c.id]: e.target.files?.[0] || null}))} />
                <button className="btn-primary" onClick={async()=>{ await api.techComplete(c.id, msg[c.id], img[c.id]); await load(); }}>
                  Submit Completion
                </button>
              </div>

              <div className="border-t pt-3">
                <div className="text-sm font-semibold">Report Misuse (if fake)</div>
                <div className="flex gap-2 mt-2">
                  <input className="input" placeholder="Reason (e.g., false report / prank)" value={misuse[c.id] || ''} onChange={e=>setMisuse(p=>({...p,[c.id]:e.target.value}))}/>
                  <button className="btn-muted" onClick={async()=>{
                    if(!(misuse[c.id]||'').trim()) return alert('Add a short reason');
                    await api.techReportMisuse(c.id, misuse[c.id]); await load(); alert('Reported to Head & Admin');
                  }}>Report</button>
                </div>
              </div>
            </div>
          )}
        </ComplaintCard>
      ))}
    </div>
  )
}
