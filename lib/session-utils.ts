import { cookies } from "next/headers"
import { validateSession, revokeSession } from "@/lib/session"
import { auth } from "@/auth"
import { query } from "@/lib/db"

/**
 * Utilities para gerenciamento de sessões
 */

// Verificar se usuário tem sessão válida
export async function getCurrentSession() {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("app_session")?.value
    
    if (!sessionToken) {
      return null
    }
    
    return await validateSession(sessionToken)
  } catch (error) {
    console.error("Erro verificando sessão atual:", error)
    return null
  }
}

// Verificar se usuário está completamente autenticado (NextAuth + sessão própria)
export async function isFullyAuthenticated() {
  try {
    const session = await auth()
    const appSession = await getCurrentSession()
    
    return !!session?.user?.id && !!appSession
  } catch (error) {
    console.error("Erro verificando autenticação:", error)
    return false
  }
}

// Limpar sessão inválida
export async function clearInvalidSession() {
  const cookieStore = cookies()
  cookieStore.delete("app_session")
}

// Obter estatísticas de sessões do usuário
export async function getUserSessionStats(userId: string) {
  try {
    const { rows } = await query<{
      total: number
      active: number
      expired: number
      devices: number
    }>(
      `SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN "isActive" = true AND "expires" > NOW() THEN 1 END) as active,
         COUNT(CASE WHEN "isActive" = false OR "expires" <= NOW() THEN 1 END) as expired,
         COUNT(DISTINCT "deviceId") as devices
       FROM public."UserSession" 
       WHERE "userId" = $1`,
      [userId]
    )
    
    return rows[0] || { total: 0, active: 0, expired: 0, devices: 0 }
  } catch (error) {
    console.error("Erro obtendo estatísticas de sessão:", error)
    return { total: 0, active: 0, expired: 0, devices: 0 }
  }
}

// Limpar sessões expiradas automaticamente
export async function cleanExpiredSessions() {
  try {
    const { rowCount } = await query(
      `UPDATE public."UserSession" 
       SET "isActive" = false, "revokedAt" = NOW(), "revokedReason" = 'Expired automatically'
       WHERE "isActive" = true AND "expires" <= NOW()`,
      []
    )
    
    console.log(`Limpeza automática: ${rowCount} sessões expiradas removidas`)
    return rowCount || 0
  } catch (error) {
    console.error("Erro na limpeza automática de sessões:", error)
    return 0
  }
}

// Verificar se IP/dispositivo é suspeito
export async function checkSuspiciousActivity(userId: string, ipAddress: string) {
  try {
    // Verificar quantas sessões foram criadas do mesmo IP nas últimas 24h
    const { rows } = await query<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM public."UserSession" s
       WHERE s."ipAddress" = $1 
         AND s."createdAt" > NOW() - INTERVAL '24 hours'
         AND s."userId" != $2`,
      [ipAddress, userId]
    )
    
    const suspiciousCount = rows[0]?.count || 0
    
    // Se mais de 5 sessões diferentes foram criadas do mesmo IP, é suspeito
    return {
      isSuspicious: suspiciousCount > 5,
      count: suspiciousCount,
      reason: suspiciousCount > 5 ? 'Multiple users from same IP' : null
    }
  } catch (error) {
    console.error("Erro verificando atividade suspeita:", error)
    return { isSuspicious: false, count: 0, reason: null }
  }
}

// Obter sessões ativas de um usuário com detalhes
export async function getUserActiveSessions(userId: string) {
  try {
    const { rows } = await query(
      `SELECT 
         s."id",
         s."deviceId", 
         s."expires", 
         s."lastActivity", 
         s."ipAddress",
         s."createdAt",
         s."userAgent",
         d."platform",
         d."deviceId" as "deviceHash"
       FROM public."UserSession" s
       JOIN public."Device" d ON s."deviceId" = d."id"
       WHERE s."userId" = $1 AND s."isActive" = true AND s."expires" > NOW()
       ORDER BY s."lastActivity" DESC`,
      [userId]
    )
    
    return rows
  } catch (error) {
    console.error("Erro obtendo sessões ativas:", error)
    return []
  }
}

// Middleware helper para validar sessão em rotas protegidas
export async function requireValidSession() {
  const session = await getCurrentSession()
  const authSession = await auth()
  
  if (!session || !authSession?.user?.id) {
    throw new Error('Sessão inválida ou expirada')
  }
  
  return {
    sessionData: session,
    user: authSession.user
  }
}

// Log de atividade de sessão
export async function logSessionActivity(
  sessionId: string, 
  activity: string, 
  metadata?: Record<string, any>
) {
  try {
    // Você pode criar uma tabela de logs se necessário
    console.log(`Session ${sessionId}: ${activity}`, metadata)
  } catch (error) {
    console.error("Erro logando atividade:", error)
  }
}

// Tipos para TypeScript
export interface SessionStats {
  total: number
  active: number
  expired: number
  devices: number
}

export interface SuspiciousActivityCheck {
  isSuspicious: boolean
  count: number
  reason: string | null
}