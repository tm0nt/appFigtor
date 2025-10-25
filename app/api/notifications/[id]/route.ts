// app/api/notifications/[id]/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"

// PATCH - Marcar como lida
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { read } = await req.json()

    const { rows } = await query(
      `UPDATE public."Notification" 
       SET "read" = $1, "updatedAt" = NOW()
       WHERE id = $2 AND "userId" = $3
       RETURNING *`,
      [read, params.id, session.user.id]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("Erro ao atualizar notificação:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// DELETE - Deletar notificação
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { rows } = await query(
      `DELETE FROM public."Notification" 
       WHERE id = $1 AND "userId" = $2
       RETURNING id`,
      [params.id, session.user.id]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar notificação:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
