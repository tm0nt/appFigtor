// app/api/devices/[id]/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"

// DELETE - Remover dispositivo (fazer logout)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { rows } = await query(
      `DELETE FROM public."Device" 
       WHERE id = $1 AND "userId" = $2
       RETURNING id`,
      [params.id, session.user.id]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "Dispositivo não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover dispositivo:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
