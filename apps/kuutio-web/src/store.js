import { create } from 'zustand'

// Create a custom hook called useStore using Zustand library
const useStore = create(set => ({
    // initial state variables
    user: null,

    // actions
    setUser: user => set({ user })
}))

export default useStore