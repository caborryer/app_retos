import { NextResponse } from 'next/server';
import { InviteValidationError, validateInviteToken } from '@/lib/organization-access';

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const invite = await validateInviteToken(params.token);
    return NextResponse.json({
      valid: true,
      organizationId: invite.organizationId,
      organizationName: invite.organization.name,
      expiresAt: invite.expiresAt?.toISOString() ?? null,
      label: invite.label,
    });
  } catch (e) {
    if (e instanceof InviteValidationError) {
      return NextResponse.json({
        valid: false,
        error: e.message,
        code: e.code,
      });
    }
    throw e;
  }
}
