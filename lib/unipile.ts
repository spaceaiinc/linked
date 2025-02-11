import { UnipileClient } from 'unipile-node-sdk'
import { env } from './env'

export const unipileClient = new UnipileClient(
  `https://${env.UNIPILE_DNS}`,
  env.UNIPILE_ACCESS_TOKEN
)
