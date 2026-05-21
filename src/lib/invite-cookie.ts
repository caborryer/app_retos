export const INVITE_COOKIE_NAME = 'org_invite_token';

export function getInviteCookieMaxAgeSeconds(): number {
  return 60 * 60; // 1 hour
}
