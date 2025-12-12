
// lib/org-ids.ts
import crypto from 'crypto'
export function makePersonalOrgId(userId: string) {
   return `org_${userId}` // deterministic, readable
}
export function makeOrgKey() {
  return crypto.randomBytes(32).toString('hex') // immutable passkey
}