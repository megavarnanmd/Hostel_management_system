import React from 'react'
import StatusBadge from './StatusBadge'

export default function ComplaintCard({c, children}){
  const loc = c.locationType === 'ROOM' ? `Room ${c.locationText}` : (c.locationText || '—')
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-lg font-semibold break-words">{c.title}</div>
            {c.isFlagged ? <span className="badge bg-red-100 text-red-700">⚠︎ Flagged</span> : null}
          </div>
          <div className="text-sm text-gray-600 break-words">{c.description}</div>
          <div className="text-sm text-gray-700 mt-1"><span className="font-medium">Location:</span> {loc}</div>
          <div className="mt-2"><StatusBadge status={c.status} /></div>
          {c.isFlagged && c.misuseReason ? (
            <div className="mt-2 text-xs text-red-700 bg-red-50 rounded-xl px-3 py-2 border border-red-100">
              Reported reason: {c.misuseReason}
            </div>
          ) : null}
        </div>
        {c.photo && <img src={c.photo} className="w-32 h-24 object-cover rounded-xl border" alt="problem" />}
      </div>

      {(c.completedImage || c.completedMessage) && (
        <div className="mt-3 border-t pt-3">
          <div className="text-sm font-semibold">Technician Report</div>
          {c.completedMessage && <div className="text-sm text-gray-700">{c.completedMessage}</div>}
          {c.completedImage && <img src={c.completedImage} className="w-40 h-28 object-cover rounded-xl mt-2 border" alt="fixed" />}
        </div>
      )}

      {children ? <div className="mt-3 flex flex-wrap gap-2">{children}</div> : null}
    </div>
  )
}
