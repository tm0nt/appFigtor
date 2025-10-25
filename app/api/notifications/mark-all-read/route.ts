// app/api/notifications/mark-all-read/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    await query(
      `UPDATE public."Notification" 
       SET "read" = true, "updatedAt" = NOW()
       WHERE "userId" = $1 AND "read" = false`,
      [session.user.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao marcar todas como lidas:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
