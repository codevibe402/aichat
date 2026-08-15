import { SignJWT, jwtVerify } from 'jose'

const SESSION_COOKIE_NAME = 'msgmate_session'

// ── Private: Internal helpers ─────────────────────────────────────────────────

/** @internal Extracts the signing secret from env. Must never be exported. */
function _getSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET not configured')
  return new TextEncoder().encode(secret)
}

/**
 * @internal Verifies a session JWT. Only called by `_getSessionUserId`.
 * Must never be exported — exposing this would let callers bypass session checks.
 */
async function _verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, _getSecret())
    return { userId: payload.userId as string }
  } catch {
    return null
  }
}

// ── Public API: Called by auth.ts and api/auth/google/route.ts ────────────────

/** Creates a signed session JWT for the given user ID. Used during sign-in. */
export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(_getSecret())
}

/** Reads the session cookie from the request and returns the user ID, or null. */
export async function getSessionUserId(req: Request): Promise<string | null> {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const idx = c.indexOf('=')
        if (idx === -1) return [c.trim(), '']
        return [c.slice(0, idx).trim(), c.slice(idx + 1).trim()]
      })
    )
    const token = cookies[SESSION_COOKIE_NAME]
    if (!token) return null
    const session = await _verifySession(decodeURIComponent(token))
    return session?.userId || null
  } catch {
    return null
  }
}

/** Cookie options for the session cookie. Used when setting the cookie in responses. */
export const SESSION_COOKIE_OPTIONS = {
  name: SESSION_COOKIE_NAME,
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  maxAge: 30 * 24 * 60 * 60,
  path: '/',
}
