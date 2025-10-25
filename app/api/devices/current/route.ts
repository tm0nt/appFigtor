// app/api/devices/current/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"
import { getDeviceInfo, generateDeviceId, getPlatformFromUA } from "@/lib/device-detector"

// POST - Registrar/atualizar dispositivo atual
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const deviceInfo = await getDeviceInfo()
    const deviceId = generateDeviceId(deviceInfo.userAgent, deviceInfo.ip)
    const platform = getPlatformFromUA(deviceInfo.userAgent)

    // Verificar se já existe
    const { rows: existing } = await query(
      `SELECT id FROM public."Device" WHERE "userId" = $1 AND "deviceId" = $2`,
      [session.user.id, deviceId]
    )

    if (existing.length > 0) {
      // Atualizar lastSeenAt
      await query(
        `UPDATE public."Device" 
         SET "lastSeenAt" = NOW(), "updatedAt" = NOW()
         WHERE id = $1`,
        [existing[0].id]
      )
      return NextResponse.json({ deviceId: existing[0].id })
    }

    // Inserir novo dispositivo
    const { rows } = await query(
      `INSERT INTO public."Device" ("userId", "deviceId", platform, "userAgent", ip, "lastSeenAt")
       VALUES ($1, $2, $3::text::"DevicePlatform", $4, $5, NOW())
       RETURNING id`,
      [session.user.id, deviceId, platform, deviceInfo.userAgent, deviceInfo.ip]
    )

    return NextResponse.json({ deviceId: rows[0].id })
  } catch (error) {
    console.error("Erro ao registrar dispositivo:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
