
// // lib/auth.ts
// import "server-only";
// import { redirect } from "next/navigation";
// import { stackServerApp } from "@/stack/server";

// export type AppUser = {
//   id?: string;
//   displayName?: string | null;
//   primaryEmailVerified?: boolean;
//   primaryEmail?: { verified?: boolean | null } | null;
//   emailVerified?: boolean | null;
// };

// function isVerified(u: AppUser | undefined | null): boolean {
//   if (!u) return false;
//   return Boolean(
//     u.primaryEmailVerified ??
//       u.primaryEmail?.verified ??
//       u.emailVerified
//   );
// }

// /**
//  * Auth + verification gate.
//  * If unauthenticated, your SDK handles redirect via { or: "redirect" }.
//  * If unverified, we redirect to an interstitial page that informs the user,
//  * then forwards them to the target (account settings) using client navigation.
//  */
// export async function requireVerifiedUser(): Promise<AppUser> {
//   const user = (await stackServerApp.getUser({ or: "redirect" })) as AppUser;

//   if (!isVerified(user)) {
//     // Send to interstitial page with a 'next    // Send to interstitial page with a 'next' target
//     const next = encodeURIComponent("/handler/account-settings#auth");
//     redirect(`/verify-redirect?next=${next}`);
//   }

//   return user;
// }

// /** Only authentication (no verification check) */
// export async function requireUser(): Promise<AppUser> {
//   const user = (await stackServerApp.getUser({ or: "redirect" })) as AppUser;
//   return user;}



// lib/auth.ts
import 'server-only'
import { redirect } from 'next/navigation'
import { stackServerApp } from '@/stack/server'
import { syncUserOnLogin, StackUserLite } from '@/lib/user-sync'

export type AppUser = {
  id?: string
  displayName?: string | null
  primaryEmailVerified?: boolean
  primaryEmail?: { verified?: boolean | null } | null
  emailVerified?: boolean | null
}

/** your existing verification logic */
function isVerified(u: AppUser | undefined | null): boolean {
  if (!u) return false
  return Boolean(u.primaryEmailVerified ?? u.primaryEmail?.verified ?? u.emailVerified)
}

/** Sync helper that also returns the DB user row after sync */
async function ensureAppUser() {
  const su = (await stackServerApp.getUser({ or: 'redirect' })) as AppUser & StackUserLite
  // Sync with DB (create first time; update thereafter)
  const appUser = await syncUserOnLogin({
    id: su.id as string,
    primaryEmail: (su as any).primaryEmail ?? undefined,
    name: su.name,
    displayName: su.displayName,
    display_name: (su as any).display_name,
  })
  return { stackUser: su, appUser }
}

/** Auth + verification gate */
export async function requireVerifiedUser() {
  const { stackUser, appUser } = await ensureAppUser()
  if (!isVerified(stackUser)) {
    const next = encodeURIComponent('/handler/account-settings#auth')
    redirect(`/verify-redirect?next=${next}`)
  }
  return { stackUser, appUser }
}

/** Only authentication (no verification check) */
export async function requireUser() {
  const { stackUser, appUser } = await ensureAppUser()
  return { stackUser, appUser }
}

