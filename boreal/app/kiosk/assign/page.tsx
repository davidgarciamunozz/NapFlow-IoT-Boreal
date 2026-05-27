import { AssignContent } from '@/components/kiosk/AssignContent'

interface Props {
  searchParams: Promise<{
    slot?: string
    name?: string
    checkout?: string
    points?: string
  }>
}

export default async function KioskAssignPage({ searchParams }: Props) {
  const params = await searchParams
  return (
    <AssignContent
      isCheckout={params.checkout === 'true'}
      slotNumber={params.slot ?? null}
      name={params.name ?? 'Student'}
      points={params.points ?? '50'}
    />
  )
}
