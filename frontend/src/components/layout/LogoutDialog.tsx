import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/auth'
import { Button } from '../ui/form'
import { Modal } from '../ui/Overlay'

/** Asks before signing out. Used by the user menu and the sidebar, so both behave the same way. */
export default function LogoutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function confirm() {
    setSigningOut(true)
    try {
      await logout()
    } finally {
      setSigningOut(false)
      onClose()
      navigate('/login', { replace: true })
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !signingOut && onClose()}
      title="Log out?"
      subtitle="You’ll need to sign in again to get back to RightFit."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={signingOut}>
            Stay signed in
          </Button>
          <Button variant="danger" icon={<LogOut className="h-4 w-4" />} loading={signingOut} onClick={() => void confirm()}>
            Log out
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-500 dark:text-slate-400">
        Anything you haven’t saved yet will be lost.
      </p>
    </Modal>
  )
}
