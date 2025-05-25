import { User } from '@supabase/supabase-js'
import { atom } from 'jotai'
import { Profile, Provider, Workflow } from './types/supabase'

export const userAtom = atom<User | null>(null)
export const profileAtom = atom<Profile | null>(null)
export const providerAtom = atom<Provider | null>(null)
export const providersAtom = atom<Provider[]>([])
export const workflowsAtom = atom<Workflow[]>([])
export const loadingAtom = atom<boolean>(false)

export interface ScoutScreening {
  id: string
  company_name: string
  job_title: string
  // Add other relevant fields for ScoutScreening
  // For example:
  // description: string;
  // status: string;
  // created_at: string;
  // updated_at: string;
  type: string // Assuming type is still relevant, adjust as needed
  name: string // Assuming name is still relevant, adjust as needed
}

export const scoutScreeningsAtom = atom<ScoutScreening[]>([])
