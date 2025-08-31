import { getToken } from './auth'
const base = '' // vite proxy

async function req(path, {method='GET', body, file=false}={}){
  const headers = {}
  if(!file) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if(token) headers['Authorization'] = 'Bearer ' + token
  const res = await fetch(base + path, { method, headers, body: file ? body : (body ? JSON.stringify(body) : undefined) })
  if(!res.ok){
    let err; try { err = await res.json() } catch { err = {error: await res.text()} }
    throw new Error(err.error || 'Request failed')
  }
  const ct = res.headers.get('Content-Type') || ''
  return ct.includes('application/json') ? res.json() : res.text()
}

export const api = {
  // auth
  login: (email, password)=> req('/api/auth/login',{method:'POST',body:{email,password}}),
  register: (name,email,password)=> req('/api/auth/register',{method:'POST',body:{name,email,password}}),

  // complaints
  listComplaints: ()=> req('/api/complaints'),
  createComplaint: (title, description, file, locationType, locationText)=>{
    const fd = new FormData()
    fd.append('title', title)
    fd.append('description', description)
    fd.append('locationType', locationType)  // 'ROOM' | 'AREA'
    fd.append('locationText', locationText)
    if(file) fd.append('photo', file)
    return req('/api/complaints',{method:'POST',body:fd,file:true})
  },
  approveComplaint: id => req(`/api/complaints/${id}/approve`,{method:'PATCH'}),
  rejectComplaint: id => req(`/api/complaints/${id}/reject`,{method:'PATCH'}),
  listTechnicians: ()=> req('/api/users/technicians'),
  assignComplaint: (id, techId)=> req(`/api/complaints/${id}/assign`,{method:'PATCH',body:{technicianId: techId}}),
  techComplete: (id, msg, file)=>{
    const fd = new FormData()
    fd.append('completedMessage', msg || '')
    if(file) fd.append('completedImage', file)
    return req(`/api/complaints/${id}/complete`,{method:'POST',body:fd,file:true})
  },
  techReportMisuse: (id, reason)=> req(`/api/complaints/${id}/report-misuse`,{method:'POST',body:{reason}}),
  residentVerify: id => req(`/api/complaints/${id}/rectified`,{method:'POST'}),

  // notifications
  notifications: ()=> req('/api/notifications'),
  readNotification: id => req(`/api/notifications/${id}/read`,{method:'PATCH'}),

  // admin
  adminListUsers: ()=> req('/api/admin/users'),
  adminCreateUser: (name,email,password,role)=> req('/api/admin/users',{method:'POST',body:{name,email,password,role}}),
  adminDeleteUser: (id)=> req(`/api/admin/users/${id}`,{method:'DELETE'}),
  adminSetBlock: (id, block)=> req(`/api/admin/users/${id}/block`,{method:'PATCH',body:{block}}),
  adminRemoveDemos: ()=> req('/api/admin/remove-demos',{method:'DELETE'}),
}
