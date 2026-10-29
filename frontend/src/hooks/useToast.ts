import { useMemo } from 'react'
import { useAppDispatch } from '../store'
import { pushToast } from '../store/toastSlice'

/** Small success / error pop-ups shown in the corner of the admin shell. */
export function useToast() {
  const dispatch = useAppDispatch()
  return useMemo(
    () => ({
      success: (title: string, message?: string) => dispatch(pushToast({ tone: 'success', title, message })),
      error: (title: string, message?: string) => dispatch(pushToast({ tone: 'error', title, message })),
      info: (title: string, message?: string) => dispatch(pushToast({ tone: 'info', title, message })),
    }),
    [dispatch],
  )
}
