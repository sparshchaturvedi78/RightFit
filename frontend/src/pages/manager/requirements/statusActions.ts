export type StatusAction = 'publish' | 'hold' | 'resume' | 'close' | 'cancel'

export interface StatusActionInfo {
  label: string
  title: string
  text: string
  defaultReason: string
  confirm: string
  tone: 'primary' | 'secondary' | 'danger'
  done: string
}

export const STATUS_ACTIONS: Record<StatusAction, StatusActionInfo> = {
  publish: {
    label: 'Publish',
    title: 'Publish this requirement?',
    text: 'It opens for candidates. You can put it on hold or close it later.',
    defaultReason: 'Ready to start hiring',
    confirm: 'Publish',
    tone: 'primary',
    done: 'published',
  },
  hold: {
    label: 'Put on hold',
    title: 'Put this requirement on hold?',
    text: 'Hiring pauses. Candidates stay where they are, and you can resume at any time.',
    defaultReason: '',
    confirm: 'Put on hold',
    tone: 'secondary',
    done: 'put on hold',
  },
  resume: {
    label: 'Resume',
    title: 'Resume this requirement?',
    text: 'Hiring starts again from where it stopped.',
    defaultReason: 'Hiring can continue',
    confirm: 'Resume',
    tone: 'primary',
    done: 'resumed',
  },
  close: {
    label: 'Close',
    title: 'Close this requirement?',
    text: 'Use this when the role is filled or no longer needed. A closed requirement can’t be reopened.',
    defaultReason: '',
    confirm: 'Close requirement',
    tone: 'secondary',
    done: 'closed',
  },
  cancel: {
    label: 'Cancel requirement',
    title: 'Cancel this requirement?',
    text: 'The requirement is dropped and its candidates are released. This can’t be undone.',
    defaultReason: '',
    confirm: 'Cancel requirement',
    tone: 'danger',
    done: 'cancelled',
  },
}

/** Which status changes are allowed from each status. */
export function actionsFor(status: string): StatusAction[] {
  switch (status) {
    case 'DRAFT':
      return ['publish', 'cancel']
    case 'PUBLISHED':
      return ['hold', 'close', 'cancel']
    case 'ON_HOLD':
      return ['resume', 'close', 'cancel']
    case 'ALLOCATED':
      return ['close']
    default:
      return []
  }
}

