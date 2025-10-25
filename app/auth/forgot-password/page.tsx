// app/(auth)/forgot-password/page.tsx
"use client"

import { useState } from "react"
import { Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const t = toast.loading("Enviando instruções...")

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.error ?? "Erro ao enviar instruções", { id: t })
        return
      }

      toast.success("Instruções enviadas! Verifique seu email.", { id: t })
      setSent(true)

      // Em desenvolvimento, mostrar o token
      if (data.token) {
        console.log("Token de reset:", data.token)
        toast.info(`Token de dev: ${data.token}`, { duration: 10000 })
      }
    } catch (error) {
      toast.error("Erro inesperado ao enviar instruções", { id: t })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] relative overflow-hidden flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#90f209]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#90f209]/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="mb-12 animate-fade-in-down relative z-10">
        <div className="flex items-center justify-center">
          <Image src="/logo.png" alt="Figtor" width={160} height={40} priority className="h-10 w-auto" />
        </div>
      </div>

      <div className="w-full max-w-md animate-fade-in-up relative z-10">
        {!sent ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <Link
                href="/"
                className="text-[#666666] hover:text-[#90f209] transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-[#ffffff] text-3xl font-light">Recuperar senha</h1>
            </div>
            <p className="text-[#666666] text-center mb-8 text-sm">
              Digite seu email para receber instruções de recuperação
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="group">
                <label className="text-[#ffffff] text-sm font-medium block mb-2">Seu e-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    className="w-full bg-[#0f0f0f] text-[#ffffff] placeholder:text-[#666666] rounded-xl border-2 border-[#1a1a1a] pl-12 pr-4 py-4 outline-none transition-all duration-300 focus:border-[#90f209] focus:bg-[#1a1a1a] focus:shadow-[0_0_20px_rgba(144,242,9,0.1)]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#90f209] text-[#000000] font-bold py-4 rounded-xl hover:bg-[#a0ff20] transition-all duration-300 hover:shadow-[0_0_30px_rgba(144,242,9,0.3)] hover:scale-[1.02] active:scale-[0.98] mt-2 disabled:opacity-60"
              >
                {loading ? "Enviando..." : "ENVIAR INSTRUÇÕES"}
              </button>

              <p className="text-center text-[#666666] text-sm mt-6">
                Lembrou sua senha?{" "}
                <Link
                  href="/login"
                  className="text-[#90f209] hover:text-[#a0ff20] transition-colors duration-200 font-medium underline underline-offset-4 decoration-[#90f209]/30 hover:decoration-[#90f209]"
                >
                  Voltar ao login
                </Link>
              </p>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 bg-[#90f209]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-[#90f209]" />
            </div>
            <h2 className="text-[#ffffff] text-2xl font-semibold mb-4">Verifique seu email</h2>
            <p className="text-[#666666] mb-8">
              Se o email <span className="text-[#ffffff] font-medium">{email}</span> estiver cadastrado,
              você receberá instruções de recuperação.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[#90f209] hover:text-[#a0ff20] transition-colors duration-200 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
