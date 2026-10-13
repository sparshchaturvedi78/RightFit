import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  tone: ToastTone
  title: string
  message?: string
}

const toastSlice = createSlice({
  name: 'toasts',
  initialState: [] as Toast[],
  reducers: {
    pushToast: {
      reducer: (state, action: PayloadAction<Toast>) => {
        state.push(action.payload)
        if (state.length > 4) state.shift()
      },
      prepare: (toast: Omit<Toast, 'id'>) => ({ payload: { ...toast, id: nanoid() } }),
    },
    dismissToast: (state, action: PayloadAction<string>) => state.filter((t) => t.id !== action.payload),
  },
})

export const { pushToast, dismissToast } = toastSlice.actions
export default toastSlice.reducer
