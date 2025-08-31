import React from 'react'

const map = {
  PENDING_WARDEN_APPROVAL: { label:'Pending warden', color:'bg-yellow-100 text-yellow-800' },
  REJECTED_BY_WARDEN: { label:'Rejected', color:'bg-red-100 text-red-800' },
  SENT_TO_TECHNICIAN: { label:'To Technician', color:'bg-blue-100 text-blue-800' },
  ASSIGNED_TO_TECHNICIAN: { label:'Assigned', color:'bg-indigo-100 text-indigo-800' },
  COMPLETED_BY_TECHNICIAN: { label:'Completed by Tech', color:'bg-emerald-100 text-emerald-800' },
  RESIDENT_VERIFIED: { label:'Resident Verified', color:'bg-green-100 text-green-800' },
}
export default function StatusBadge({status}){
  const s = map[status] || {label: status, color:'bg-gray-100 text-gray-800'}
  return <span className={`badge ${s.color}`}>{s.label}</span>
}
