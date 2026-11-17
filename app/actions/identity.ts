'use server'

import { redirect } from 'next/navigation'
import { clearIdentityCookies, setIdentityCookie } from '@/lib/identity'
import { getLockHash, verifyPassword } from '@/lib/lock'
import { isPartnerId } from '@/lib/partners'

export type ChooseState = { error?: string; partner?: string } | null

export async function choosePartner(_prev: ChooseState, formData: FormData): Promise<ChooseState> {
  const partner = formData.get('partner')
  if (!isPartnerId(partner)) return { error: '请选择一个名字' }

  const hash = await getLockHash(partner)
  if (hash) {
    const password = String(formData.get('password') ?? '')
    if (!password || !(await verifyPassword(password, hash))) {
      return { error: '密码不对哦，再想想', partner }
    }
  }

  await setIdentityCookie(partner, hash)
  redirect('/')
}

export async function switchPartner() {
  await clearIdentityCookies()
  redirect('/choose')
}
