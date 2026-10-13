import { create } from 'zustand'

export type RealtimeStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'offline'

interface RealtimeState {
  status: RealtimeStatus
  detail: string
  setStatus: (status: RealtimeStatus, detail?: string) => void
}

export const useRealtimeStore = create<RealtimeState>()((set) => ({
  status: 'connecting',
  detail: '',
  setStatus: (status, detail = '') => set({ status, detail }),
}))
