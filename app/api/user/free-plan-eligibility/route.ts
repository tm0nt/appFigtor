// app/api/user/free-plan-eligibility/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { rows } = await query(
      `SELECT "hasUsedFreePlan" FROM public."User" WHERE id = $1`,
      [session.user.id]
    )

    return NextResponse.json({
      canUseFreePlan: !rows[0]?.hasUsedFreePlan,
      hasUsedFreePlan: rows[0]?.hasUsedFreePlan || false,
    })
  } catch (error) {
    console.error("Erro ao verificar elegibilidade:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
