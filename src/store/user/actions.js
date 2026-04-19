import { api } from 'boot/axios'
import { LocalStorage, Notify } from 'quasar'

export async function login ({ commit }, credentials) {
  try {
    const data = await api.post('/auth/login', credentials)
    const { token, user } = data
    
    LocalStorage.set('auth_token', token)
    commit('SET_USER', { user, token })
    
    Notify.create({ color: 'positive', message: `Welcome ${user.username}` })
    return true
  } catch (error) {
    Notify.create({ color: 'negative', message: 'Auth Failed: ' + error.message })
    return false
  }
}

export function logout ({ commit }) {
  LocalStorage.remove('auth_token')
  commit('CLEAR_USER')
  window.location.reload()
}

export async function checkAuth ({ commit }) {
  const token = LocalStorage.getItem('auth_token')
  if (!token) return false
  
  try {
    const userData = await api.get('/auth/me')
    commit('SET_USER', { user: userData, token })
    return true
  } catch (error) {
    LocalStorage.remove('auth_token')
    commit('CLEAR_USER')
    return false
  }
}
