export function SET_USER (state, { user, token }) {
  state.user = user
  state.token = token
  state.isLoggedIn = true
}

export function CLEAR_USER (state) {
  state.user = null
  state.token = null
  state.isLoggedIn = false
}
