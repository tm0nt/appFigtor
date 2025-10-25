// app/api/convert/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { fileKey, title } = await req.json()

    if (!fileKey || !title) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    // Verificar assinatura e limites
    const { rows: subRows } = await query(
      `SELECT s.*, p."pagesLimitPerMonth", p."isUnlimited", p."name" as "planName"
       FROM public."Subscription" s
       JOIN public."Plan" p ON s."planId" = p.id
       WHERE s."userId" = $1 AND s."isCurrent" = true
       LIMIT 1`,
      [session.user.id]
    )

    if (subRows.length === 0) {
      return NextResponse.json(
        { error: "Você precisa de uma assinatura ativa para converter" },
        { status: 403 }
      )
    }

    const subscription = subRows[0]

    // Contar conversões do mês atual
    const { rows: countRows } = await query(
      `SELECT COUNT(*) as total 
       FROM public."Conversion" 
       WHERE "userId" = $1 
       AND status = 'COMPLETED'
       AND "createdAt" >= date_trunc('month', CURRENT_DATE)`,
      [session.user.id]
    )

    const conversionsThisMonth = parseInt(countRows[0].total)

    // Verificar se excedeu o limite
    if (!subscription.isUnlimited && conversionsThisMonth >= subscription.pagesLimitPerMonth) {
      return NextResponse.json(
        { 
          error: "Limite de conversões atingido",
          message: `Você atingiu o limite de ${subscription.pagesLimitPerMonth} conversões do seu plano ${subscription.planName}. Faça upgrade para converter mais.`,
          needsUpgrade: true
        },
        { status: 403 }
      )
    }

    // Criar registro de conversão
    const { rows: conversionRows } = await query(
      `INSERT INTO public."Conversion" 
       ("userId", "figmaUrl", "outputFormat", status, "pagesConverted")
       VALUES ($1, $2, 'JSON', 'PROCESSING', 0)
       RETURNING id`,
      [session.user.id, `https://www.figma.com/design/${fileKey}/${title}`]
    )

    const conversionId = conversionRows[0].id

    // Fazer requisição para API externa
    const response = await fetch('https://api.figtor.com.br/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_key: fileKey,
        title: title,
      }),
    })

    const data = await response.json()

    if (data.status === 'ok') {
      // Atualizar conversão com sucesso
      await query(
        `UPDATE public."Conversion" 
         SET status = 'COMPLETED', 
             "downloadUrl" = $1,
             "pagesConverted" = 1,
             "completedAt" = NOW(),
             "updatedAt" = NOW()
         WHERE id = $2`,
        [data.download_url, conversionId]
      )

      return NextResponse.json({
        success: true,
        conversionId,
        downloadUrl: data.download_url,
        fileKey: data.file_key,
        title: data.title,
        filename: data.filename,
      })
    } else {
      // Atualizar conversão com erro
      await query(
        `UPDATE public."Conversion" 
         SET status = 'FAILED', 
             "errorMessage" = $1,
             "updatedAt" = NOW()
         WHERE id = $2`,
        [data.error || 'Erro desconhecido', conversionId]
      )

      return NextResponse.json(
        { error: data.error || 'Erro ao converter' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Erro ao converter:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    )
  }
}
