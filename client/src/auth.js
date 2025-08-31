const KEY = 'rcs_auth';

export function saveAuth(token, user){
  localStorage.setItem(KEY, JSON.stringify({token, user}))
}
export function getAuth(){
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : null
}
export function getToken(){
  return getAuth()?.token
}
export function getUser(){
  return getAuth()?.user
}
export function logout(){
  localStorage.removeItem(KEY)
  location.href = '/login'
}
