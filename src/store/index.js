import { createStore } from 'vuex'

export default createStore({
  state: {
    ifLoading: false
  },
  mutations: {
    changeIfLoading(state, ifLoading)
    {
      state.ifLoading = ifLoading
    }
  },
  actions: {
  },
  modules: {
  }
})
