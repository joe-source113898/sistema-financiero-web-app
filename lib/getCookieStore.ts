import { cookies } from 'next/headers'

export function getCookieStore() {
  return cookies()
}
