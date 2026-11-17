import { redirect } from 'next/navigation'
import { getCurrentPartner } from '@/lib/identity'
import { LoveCalendar } from '@/components/love-calendar'

export default async function Page() {
  const me = await getCurrentPartner()
  if (!me) redirect('/choose')
  return <LoveCalendar me={me.partner} />
}
