import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"
import authConfig from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (creds) => {
        const email = (creds?.email ?? "").toLowerCase().trim()
        const password = creds?.password ?? ""
        if (!email || !password) return null

        const { rows } = await query<{
          id: string
          email: string
          name: string | null
          passwordHash: string | null
        }>(
          `SELECT "id","email","name","passwordHash"
             FROM public."User"
            WHERE "email" = $1
            LIMIT 1`,
          [email],
        )

        const user = rows[0]
        if (!user?.passwordHash) return null

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null

        return { id: user.id, email: user.email, name: user.name ?? undefined }
      },
    }),
  ],
})
