"use client"

import { useState } from "react"
import { Mail, KeyRound, User, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { signIn } from "next-auth/react"
import { toast } from "sonner"

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const t = toast.loading("Criando conta...")
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.error ?? "Falha no registro", { id: t })
        return
      }

      toast.success("Conta criada com sucesso!", { id: t })

      // autenticação automática
      const s = toast.loading("Entrando...")
      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (login?.error) {
        toast.error("Erro ao autenticar após o cadastro", { id: s })
        return
      }
      toast.success("Bem-vindo(a)!", { id: s })
      window.location.href = "/dashboard"
    } catch {
      toast.error("Erro inesperado ao registrar", { id: t })
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
        <h1 className="text-[#ffffff] text-3xl font-light text-center mb-2">Crie sua conta</h1>
        <p className="text-[#666666] text-center mb-8 text-sm">Comece a converter páginas agora</p>

        <form className="space-y-5" onSubmit={handleSignup}>
          <div className="group">
            <label className="text-[#ffffff] text-sm font-medium block mb-2">Seu nome</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
              <input
                type="text"
                placeholder="Seu nome"
                className="w-full bg-[#0f0f0f] text-[#ffffff] placeholder:text-[#666666] rounded-xl border-2 border-[#1a1a1a] pl-12 pr-4 py-4 outline-none transition-all duration-300 focus:border-[#90f209] focus:bg-[#1a1a1a] focus:shadow-[0_0_20px_rgba(144,242,9,0.1)]"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

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

          <div className="group">
            <label className="text-[#ffffff] text-sm font-medium block mb-2">Crie uma senha</label>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#90f209] text-[#000000] font-bold py-4 rounded-xl hover:bg-[#a0ff20] transition-all duration-300 hover:shadow-[0_0_30px_rgba(144,242,9,0.3)] hover:scale-[1.02] active:scale-[0.98] mt-2 disabled:opacity-60"
          >
            {loading ? "Criando..." : "CRIAR CONTA"}
          </button>

          <p className="text-center text-[#666666] text-sm mt-6">
            Já possui conta?{" "}
            <Link
              href="/login"
              className="text-[#90f209] hover:text-[#a0ff20] transition-colors duration-200 font-medium underline underline-offset-4 decoration-[#90f209]/30 hover:decoration-[#90f209]"
            >
              Acesse aqui
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
