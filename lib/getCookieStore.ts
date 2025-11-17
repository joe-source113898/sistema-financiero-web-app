import { cookies } from 'next/headers'

export async function getCookieStore() {
  return cookies()
}
