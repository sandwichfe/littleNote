// src/store/index.js
import { createStore } from 'vuex'

const store = createStore({
  state() {
    return {
      count: 0,
      scrollPosition: 0, // 保存滚动条位置
    }
  },
  mutations: {
    increment(state) {
      state.count++
    },
    decrement(state) {
      state.count--
    },
    // 保存滚动条位置
    setScrollPosition(state, position) {
        state.scrollPosition = position;
    }
  },
  actions: {
    incrementAsync({ commit }) {
      setTimeout(() => {
        commit('increment')
      }, 1000)
    },
    updateScrollPosition({ commit }, position) {
        commit('setScrollPosition', position);
      }
  },
  getters: {
    getCount(state) {
      return state.count
    }
  }
})

export default store
