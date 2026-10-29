import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Skeleton } from '../../components/dashboard/Panel'
import { managerCandidateService } from '../../services/manager/candidate.service'
import { getApiErrorMessage } from '../../services/httpClient'

/**
 * A candidate notification carries the candidate's application ID, and a candidate has no page of its own: the
 * pipeline lives on the requirement. This looks the candidate up and opens that requirement.
 */
export default function CandidateRedirectPage() {
  const { applicationId = '' } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    managerCandidateService
      .byId(applicationId)
      .then((c) => {
        if (live) navigate(`/manager/requirements/${c.requirementId}`, { replace: true })
      })
      .catch((err) => {
        if (live) setError(getApiErrorMessage(err, 'That candidate is no longer on your requirements.'))
      })
    return () => {
      live = false
    }
  }, [applicationId, navigate])

  if (error) {
    return <p className="mx-auto max-w-md p-8 text-center text-sm text-ink-500 dark:text-slate-400">{error}</p>
  }
  return <Skeleton className="mx-auto mt-10 h-40 max-w-md rounded-3xl" />
}
