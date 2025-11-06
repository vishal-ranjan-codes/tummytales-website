import { getAuth } from '@/lib/auth/server'
import Header from './Header'

export default async function HeaderServer() {
  const initialAuth = await getAuth()
  return <Header initialAuth={initialAuth} />
}


