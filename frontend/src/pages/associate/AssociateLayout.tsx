import { useMemo } from 'react'
import AppShell from '../../components/layout/AppShell'
import { associateNav } from '../../components/layout/roleNav'
import { useAssociateState } from './associateState'

/** The associate's pages inside the same shell as every other role; the sidebar follows their allocation and duties. */
export default function AssociateLayout() {
  const { allocated, roles } = useAssociateState()
  const key = roles.slice().sort().join(',')
  const groups = useMemo(() => associateNav({ allocated, duties: key ? key.split(',') : [] }), [allocated, key])
  return <AppShell groups={groups} roleLabel="Associate" />
}
