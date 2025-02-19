import { User } from '@supabase/supabase-js'
import { atom } from 'jotai'
import { Profile, Provider } from './types/supabase'

export const userAtom = atom<User | null>(null)
export const profileAtom = atom<Profile | null>(null)
export const providerAtom = atom<Provider | null>(null)
export const providersAtom = atom<Provider[]>([])
