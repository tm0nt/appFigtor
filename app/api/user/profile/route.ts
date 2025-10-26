// app/api/user/profile/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"

export const runtime = "nodejs"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const userId = session.user.id

    // ✅ SEM u.company e u.phone (não existem na tabela User)
    const { rows } = await query(
      `SELECT 
        u.id as "userId",
        u.email,
        u.name,
        u."createdAt" as "userCreatedAt",
        u."updatedAt" as "userUpdatedAt",
        
        p.id as "profileId",
        p."personType",
        p.cpf,
        p.cnpj,
        p."companyName",
        p."stateReg",
        p."birthDate",
        p.phone as "profilePhone",
        p."createdAt" as "profileCreatedAt",
        p."updatedAt" as "profileUpdatedAt",
        
        a.id as "addressId",
        a.label as "addressLabel",
        a.line1,
        a.line2,
        a.city,
        a.state,
        a."postalCode",
        a.country,
        a."createdAt" as "addressCreatedAt",
        a."updatedAt" as "addressUpdatedAt"
      FROM public."User" u
      LEFT JOIN public."UserProfile" p ON p."userId" = u.id
      LEFT JOIN public."Address" a ON a."userId" = u.id AND a.label = 'billing'
      WHERE u.id = $1
      LIMIT 1`,
      [userId]
    )

    if (!rows[0]) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const row = rows[0]

    const response = {
      user: {
        id: row.userId,
        email: row.email,
        name: row.name,
        createdAt: row.userCreatedAt,
        updatedAt: row.userUpdatedAt,
      },
      profile: row.profileId
        ? {
            id: row.profileId,
            userId: row.userId,
            personType: row.personType,
            cpf: row.cpf,
            cnpj: row.cnpj,
            companyName: row.companyName,
            stateReg: row.stateReg,
            birthDate: row.birthDate,
            phone: row.profilePhone,
            createdAt: row.profileCreatedAt,
            updatedAt: row.profileUpdatedAt,
          }
        : null,
      billingAddress: row.addressId
        ? {
            id: row.addressId,
            userId: row.userId,
            label: row.addressLabel,
            line1: row.line1,
            line2: row.line2,
            city: row.city,
            state: row.state,
            postalCode: row.postalCode,
            country: row.country,
            createdAt: row.addressCreatedAt,
            updatedAt: row.addressUpdatedAt,
          }
        : null,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Erro ao buscar perfil:", error)
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { name, email, profile, billingAddress } = body

    console.log("📝 Atualizando perfil do usuário:", userId)

    await query("BEGIN")

    try {
      // 1. Atualizar User (APENAS name e email)
      if (name !== undefined || email !== undefined) {
        const updates: string[] = []
        const values: any[] = []
        let paramIndex = 1

        if (name !== undefined) {
          updates.push(`name = $${paramIndex++}`)
          values.push(name)
        }
        if (email !== undefined) {
          updates.push(`email = $${paramIndex++}`)
          values.push(email)
        }

        updates.push(`"updatedAt" = NOW()`)
        values.push(userId)

        await query(
          `UPDATE public."User" 
           SET ${updates.join(", ")} 
           WHERE id = $${paramIndex}`,
          values
        )

        console.log("✅ User atualizado")
      }

      // 2. Atualizar ou criar UserProfile
      if (profile) {
        const { rows: existingProfile } = await query(
          `SELECT id FROM public."UserProfile" WHERE "userId" = $1`,
          [userId]
        )

        if (existingProfile[0]) {
          const updates: string[] = []
          const values: any[] = []
          let paramIndex = 1

          if (profile.personType !== undefined) {
            updates.push(`"personType" = $${paramIndex++}`)
            values.push(profile.personType)
          }
          if (profile.cpf !== undefined) {
            updates.push(`cpf = $${paramIndex++}`)
            values.push(profile.cpf)
          }
          if (profile.cnpj !== undefined) {
            updates.push(`cnpj = $${paramIndex++}`)
            values.push(profile.cnpj)
          }
          if (profile.companyName !== undefined) {
            updates.push(`"companyName" = $${paramIndex++}`)
            values.push(profile.companyName)
          }
          if (profile.birthDate !== undefined) {
            updates.push(`"birthDate" = $${paramIndex++}`)
            values.push(profile.birthDate)
          }
          if (profile.phone !== undefined) {
            updates.push(`phone = $${paramIndex++}`)
            values.push(profile.phone)
          }

          if (updates.length > 0) {
            updates.push(`"updatedAt" = NOW()`)
            values.push(userId)

            await query(
              `UPDATE public."UserProfile" 
               SET ${updates.join(", ")} 
               WHERE "userId" = $${paramIndex}`,
              values
            )
            console.log("✅ UserProfile atualizado")
          }
        } else {
          await query(
            `INSERT INTO public."UserProfile" 
             ("userId", "personType", cpf, cnpj, "companyName", "birthDate", phone) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              userId,
              profile.personType || "PF",
              profile.cpf || null,
              profile.cnpj || null,
              profile.companyName || null,
              profile.birthDate || null,
              profile.phone || null,
            ]
          )
          console.log("✅ UserProfile criado")
        }
      }

      // 3. Atualizar ou criar Address
      if (billingAddress) {
        const { rows: existingAddress } = await query(
          `SELECT id FROM public."Address" WHERE "userId" = $1 AND label = 'billing'`,
          [userId]
        )

        if (existingAddress[0]) {
          const updates: string[] = []
          const values: any[] = []
          let paramIndex = 1

          if (billingAddress.line1 !== undefined) {
            updates.push(`line1 = $${paramIndex++}`)
            values.push(billingAddress.line1)
          }
          if (billingAddress.line2 !== undefined) {
            updates.push(`line2 = $${paramIndex++}`)
            values.push(billingAddress.line2)
          }
          if (billingAddress.city !== undefined) {
            updates.push(`city = $${paramIndex++}`)
            values.push(billingAddress.city)
          }
          if (billingAddress.state !== undefined) {
            updates.push(`state = $${paramIndex++}`)
            values.push(billingAddress.state)
          }
          if (billingAddress.postalCode !== undefined) {
            updates.push(`"postalCode" = $${paramIndex++}`)
            values.push(billingAddress.postalCode)
          }

          if (updates.length > 0) {
            updates.push(`"updatedAt" = NOW()`)
            values.push(existingAddress[0].id)

            await query(
              `UPDATE public."Address" 
               SET ${updates.join(", ")} 
               WHERE id = $${paramIndex}`,
              values
            )
            console.log("✅ Address atualizado")
          }
        } else {
          await query(
            `INSERT INTO public."Address" 
             ("userId", label, line1, line2, city, state, "postalCode", country) 
             VALUES ($1, 'billing', $2, $3, $4, $5, $6, 'BR')`,
            [
              userId,
              billingAddress.line1 || "",
              billingAddress.line2 || null,
              billingAddress.city || "",
              billingAddress.state || "",
              billingAddress.postalCode || "",
            ]
          )
          console.log("✅ Address criado")
        }
      }

      await query("COMMIT")
      console.log("✅ Transação commitada")

      // Retornar dados atualizados
      const { rows: updatedRows } = await query(
        `SELECT 
          u.id, u.email, u.name,
          p.id as "profileId", p."personType", p.cpf, p.cnpj, 
          p."companyName", p.phone,
          a.id as "addressId", a.line1, a.line2, a.city, 
          a.state, a."postalCode"
        FROM public."User" u
        LEFT JOIN public."UserProfile" p ON p."userId" = u.id
        LEFT JOIN public."Address" a ON a."userId" = u.id AND a.label = 'billing'
        WHERE u.id = $1`,
        [userId]
      )

      return NextResponse.json(updatedRows[0])
    } catch (error) {
      await query("ROLLBACK")
      console.error("❌ Rollback executado")
      throw error
    }
  } catch (error: any) {
    console.error("❌ Erro ao atualizar perfil:", error)
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 })
  }
}
