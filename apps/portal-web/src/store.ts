import { create } from 'zustand'

interface State {
    user: any,
    setUser: (user: any) => void
}

// Create a custom hook for the store using Zustand library.
const useStore = create<State>()(set => ({
    
    // initial state variables
    user: null,

    // actions
    setUser: (user: any) => set({ user })
}))

export default useStore