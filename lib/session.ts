import { auth } from "@/auth"
import { query } from "@/lib/db"
import crypto from "crypto"
import { UAParser } from "ua-parser-js"

export interface SessionData {
  id: string
  userId: string
  deviceId: string
  isActive: boolean
  expires: Date
  lastActivity: Date
}

export async function createUserSession(
  userId: string,
  deviceInfo: {
    userAgent: string
    ip: string
    fingerprint?: string
  }
) {
  const parser = new UAParser(deviceInfo.userAgent)
  const result = parser.getResult()
  
  // Criar ou encontrar device
  const { rows: deviceRows } = await query<{ id: string }>(
    `INSERT INTO public."Device" 
     ("userId", "deviceId", "platform", "userAgent", "ip", "lastSeenAt")
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT ("userId", "deviceId") 
     DO UPDATE SET 
       "lastSeenAt" = NOW(),
       "userAgent" = EXCLUDED."userAgent",
       "ip" = EXCLUDED."ip"
     RETURNING "id"`,
    [
      userId,
      crypto.createHash('sha256').update(deviceInfo.userAgent + deviceInfo.ip).digest('hex'),
      result.os.name || 'Unknown',
      deviceInfo.userAgent,
      deviceInfo.ip
    ]
  )

  const deviceId = deviceRows[0].id

  // Criar sessão
  const sessionToken = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias

  await query(
    `INSERT INTO public."UserSession"
     ("userId", "deviceId", "sessionToken", "expires", "ipAddress", "userAgent")
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, deviceId, sessionToken, expires, deviceInfo.ip, deviceInfo.userAgent]
  )

  return { sessionToken, expires, deviceId }
}

export async function validateSession(sessionToken: string): Promise<SessionData | null> {
  const { rows } = await query<{
    id: string
    userId: string
    deviceId: string
    isActive: boolean
    expires: string
    lastActivity: string
  }>(
    `SELECT s."id", s."userId", s."deviceId", s."isActive", s."expires", s."lastActivity"
     FROM public."UserSession" s
     WHERE s."sessionToken" = $1 
       AND s."isActive" = true 
       AND s."expires" > NOW()`,
    [sessionToken]
  )

  if (!rows[0]) return null

  // Atualizar última atividade
  await query(
    `UPDATE public."UserSession" 
     SET "lastActivity" = NOW() 
     WHERE "id" = $1`,
    [rows[0].id]
  )

  return {
    id: rows[0].id,
    userId: rows[0].userId,
    deviceId: rows[0].deviceId,
    isActive: rows[0].isActive,
    expires: new Date(rows[0].expires),
    lastActivity: new Date(rows[0].lastActivity)
  }
}

export async function revokeSession(sessionId: string, revokedBy?: string, reason?: string) {
  await query(
    `UPDATE public."UserSession" 
     SET "isActive" = false, "revokedAt" = NOW(), "revokedBy" = $2, "revokedReason" = $3
     WHERE "id" = $1`,
    [sessionId, revokedBy, reason]
  )
}

export async function revokeAllUserSessions(userId: string, exceptSessionId?: string) {
  const params = [userId]
  let whereClause = `"userId" = $1`
  
  if (exceptSessionId) {
    params.push(exceptSessionId)
    whereClause += ` AND "id" != $2`
  }

  await query(
    `UPDATE public."UserSession" 
     SET "isActive" = false, "revokedAt" = NOW(), "revokedReason" = 'Logout all devices'
     WHERE ${whereClause}`,
    params
  )
}
