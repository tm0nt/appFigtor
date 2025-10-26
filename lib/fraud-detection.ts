import { query } from "@/lib/db"
import crypto from "crypto"

export interface FraudCheckResult {
  allowed: boolean
  reason?: string
  riskScore: number
}

export async function checkFraudRisk(
  email: string,
  fingerprint: string,
  ipAddress: string,
  userAgent: string
): Promise<FraudCheckResult> {
  let riskScore = 0

  // Verificar bloqueios ativos
  const { rows: blocks } = await query(
    `SELECT * FROM public."FraudBlock" 
     WHERE "isActive" = true 
       AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
       AND (
         ("type" = 'IP' AND "value" = $1) OR
         ("type" = 'FINGERPRINT' AND "value" = $2) OR
         ("type" = 'EMAIL_DOMAIN' AND "value" = $3)
       )`,
    [ipAddress, fingerprint, email.split('@')[1]]
  )

  if (blocks.length > 0) {
    return {
      allowed: false,
      reason: `Blocked: ${blocks[0].reason}`,
      riskScore: 100
    }
  }

  // Verificar quantos usuários já usaram este fingerprint/IP
  const { rows: fingerprintUsage } = await query<{ count: number }>(
    `SELECT COUNT(DISTINCT uf."userId") as count
     FROM public."UserFingerprint" uf
     JOIN public."DeviceFingerprint" df ON uf."fingerprintId" = df."id"
     WHERE df."fingerprint" = $1 OR df."ipAddress" = $2`,
    [fingerprint, ipAddress]
  )

  const usageCount = fingerprintUsage[0]?.count || 0
  
  // Calcular score de risco
  if (usageCount >= 5) riskScore += 50
  else if (usageCount >= 3) riskScore += 30
  else if (usageCount >= 2) riskScore += 15

  // Verificar contas gratuitas no mesmo IP nas últimas 24h
  const { rows: recentAccounts } = await query<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM public."User" u
     JOIN public."Device" d ON u."id" = d."userId"
     WHERE d."ip" = $1 
       AND u."hasUsedFreePlan" = false
       AND u."createdAt" > NOW() - INTERVAL '24 hours'`,
    [ipAddress]
  )

  const recentCount = recentAccounts[0]?.count || 0
  if (recentCount >= 3) riskScore += 40
  else if (recentCount >= 2) riskScore += 25

  return {
    allowed: riskScore < 70,
    reason: riskScore >= 70 ? 'High fraud risk detected' : undefined,
    riskScore
  }
}

export async function recordDeviceFingerprint(
  userId: string,
  fingerprint: string,
  ipAddress: string,
  userAgent: string,
  additionalData?: {
    screenResolution?: string
    timezone?: string
    language?: string
    platform?: string
  }
) {
  // Inserir ou atualizar fingerprint
  const { rows: fpRows } = await query<{ id: string }>(
    `INSERT INTO public."DeviceFingerprint"
     ("fingerprint", "ipAddress", "userAgent", "screenResolution", "timezone", "language", "platform")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT ("fingerprint")
     DO UPDATE SET 
       "updatedAt" = NOW(),
       "ipAddress" = EXCLUDED."ipAddress"
     RETURNING "id"`,
    [
      fingerprint,
      ipAddress,
      userAgent,
      additionalData?.screenResolution,
      additionalData?.timezone,
      additionalData?.language,
      additionalData?.platform
    ]
  )

  const fingerprintId = fpRows[0].id

  // Registrar uso pelo usuário
  await query(
    `INSERT INTO public."UserFingerprint"
     ("userId", "fingerprintId", "lastUsedAt")
     VALUES ($1, $2, NOW())
     ON CONFLICT ("userId", "fingerprintId")
     DO UPDATE SET 
       "lastUsedAt" = NOW(),
       "usageCount" = "UserFingerprint"."usageCount" + 1`,
    [userId, fingerprintId]
  )
}
