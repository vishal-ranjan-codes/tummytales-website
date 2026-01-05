import { InitialAuth } from '@/lib/auth/types'
import Header from './Header'

export default async function HeaderServer({ initialAuth }: { initialAuth: InitialAuth }) {
  return <Header initialAuth={initialAuth} />
}


