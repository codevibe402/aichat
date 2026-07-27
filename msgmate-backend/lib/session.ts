import { SignJWT, jwtVerify } from 'jose'

const SESSION_COOKIE_NAME = 'msgmate_session'

function getSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET not configured')
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(getSecret())
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return { userId: payload.userId as string }
  } catch {
    return null
  }
}

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
    const session = await verifySession(decodeURIComponent(token))
    return session?.userId || null
  } catch {
    return null
  }
}

export const SESSION_COOKIE_OPTIONS = {
  name: SESSION_COOKIE_NAME,
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  maxAge: 30 * 24 * 60 * 60,
  path: '/',
}