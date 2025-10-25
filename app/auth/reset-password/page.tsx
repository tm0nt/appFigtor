// app/(auth)/reset-password/page.tsx
"use client"

import { useState, useEffect, Suspense } from "react"
import { KeyRound, Eye, EyeOff, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"

function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState("")
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    if (!tokenParam) {
      toast.error("Token não encontrado")
      router.push("/auth/forgot-password")
      return
    }
    setToken(tokenParam)
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres")
      return
    }

    setLoading(true)
    const t = toast.loading("Alterando senha...")

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.error ?? "Erro ao alterar senha", { id: t })
        return
      }

      toast.success("Senha alterada com sucesso!", { id: t })
      setSuccess(true)
      
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error) {
      toast.error("Erro inesperado ao alterar senha", { id: t })
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return null
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
        {!success ? (
          <>
            <h1 className="text-[#ffffff] text-3xl font-light text-center mb-2">Nova senha</h1>
            <p className="text-[#666666] text-center mb-8 text-sm">
              Digite sua nova senha para acessar sua conta
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="group">
                <label className="text-[#ffffff] text-sm font-medium block mb-2">Nova senha</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-[#0f0f0f] text-[#ffffff] placeholder:text-[#666666] rounded-xl border-2 border-[#1a1a1a] pl-12 pr-12 py-4 outline-none transition-all duration-300 focus:border-[#90f209] focus:bg-[#1a1a1a] focus:shadow-[0_0_20px_rgba(144,242,9,0.1)]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#90f209] transition-all duration-200 hover:scale-110"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="group">
                <label className="text-[#ffffff] text-sm font-medium block mb-2">Confirmar senha</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-[#0f0f0f] text-[#ffffff] placeholder:text-[#666666] rounded-xl border-2 border-[#1a1a1a] pl-12 pr-12 py-4 outline-none transition-all duration-300 focus:border-[#90f209] focus:bg-[#1a1a1a] focus:shadow-[0_0_20px_rgba(144,242,9,0.1)]"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#90f209] transition-all duration-200 hover:scale-110"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-sm">As senhas não coincidem</p>
              )}

              <button
                type="submit"
                disabled={loading || password !== confirmPassword}
                className="w-full bg-[#90f209] text-[#000000] font-bold py-4 rounded-xl hover:bg-[#a0ff20] transition-all duration-300 hover:shadow-[0_0_30px_rgba(144,242,9,0.3)] hover:scale-[1.02] active:scale-[0.98] mt-2 disabled:opacity-60"
              >
                {loading ? "Alterando..." : "ALTERAR SENHA"}
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
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-[#ffffff] text-2xl font-semibold mb-4">Senha alterada!</h2>
            <p className="text-[#666666] mb-8">
              Sua senha foi alterada com sucesso. Redirecionando para o login...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="text-[#90f209]">Carregando...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
