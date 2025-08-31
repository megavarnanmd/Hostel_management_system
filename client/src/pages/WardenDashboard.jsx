import React from 'react'
import { api } from '../api'
import ComplaintCard from '../components/ComplaintCard'

export default function WardenDashboard(){
  const [list,setList] = React.useState([])

  async function load(){ setList(await api.listComplaints()) }
  React.useEffect(()=>{ load() },[])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">All Complaints</h2>
      {list.map(c=>(
        <ComplaintCard key={c.id} c={c}>
          {c.status === 'PENDING_WARDEN_APPROVAL' && (
            <>
              <button className="btn-primary" onClick={async()=>{ await api.approveComplaint(c.id); await load(); }}>Approve & Send to Technician</button>
              <button className="btn-muted" onClick={async()=>{ await api.rejectComplaint(c.id); await load(); }}>Reject</button>
            </>
          )}
        </ComplaintCard>
      ))}
    </div>
  )
}
