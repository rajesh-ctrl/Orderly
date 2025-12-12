
'use server';

// import { prisma } from '@/lib/prisma';
import { prisma } from "../../lib/prisma";

import { requireUser } from '../../lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

/** Owner-only: regenerate the organisation passkey */
export async function regenerateOrgPasskey() {
  const { appUser } = await requireUser();

  if (!appUser.currentOrganisationId) {
    redirect('/error?message=No current organisation set');
  }

  const org = await prisma.organisation.findUnique({
    where: { id: appUser.currentOrganisationId },
    select: { id: true, ownerOrgUserId: true },
  });

  if (!org) redirect('/error?message=Organisation not found');
  if (org.ownerOrgUserId !== appUser.id) {
    redirect('/error?message=Only the organisation owner can rotate the passkey');
  }

  const newKey = crypto.randomBytes(32).toString('hex'); // 64-char hex

  await prisma.organisation.update({
    where: { id: org.id },
    data: {
      organisationKey: newKey,
      // Optionally keep an audit timestamp/actor in a separate table
      // lastKeyRotatedAt: new Date()
    },
  });

  revalidatePath('/org');
   redirect('/org?passkeyRotated=true');
}