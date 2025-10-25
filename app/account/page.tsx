// app/(dashboard)/account/page.tsx
"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useUserProfile, useUpdateUserProfile } from "@/hooks/use-user-profile"
import { useCep } from "@/hooks/use-cep"
import { toast } from "sonner"
import type { PersonType } from "@/types/user"
import {
  formatCPF,
  formatCNPJ,
  formatPhone,
  formatCEP,
  validateCPF,
  validateCNPJ,
} from "@/lib/validators"

export default function AccountPage() {
  const { data, isLoading } = useUserProfile()
  const updateProfile = useUpdateUserProfile()
  const { fetchCep, loading: cepLoading } = useCep()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    personType: "PF" as PersonType,
    cpf: "",
    cnpj: "",
    companyName: "",
    postalCode: "",
    line1: "",
    number: "",
    city: "",
    state: "",
    line2: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.user.name || "",
        email: data.user.email || "",
        phone: data.user.phone || "",
        personType: (data.profile?.personType as PersonType) || "PF",
        cpf: data.profile?.cpf || "",
        cnpj: data.profile?.cnpj || "",
        companyName: data.profile?.companyName || "",
        postalCode: data.billingAddress?.postalCode || "",
        line1: data.billingAddress?.line1 || "",
        number: data.billingAddress?.number || "",
        city: data.billingAddress?.city || "",
        state: data.billingAddress?.state || "",
        line2: data.billingAddress?.line2 || "",
      })
    }
  }, [data])

  const handleCepBlur = async () => {
    if (!formData.postalCode) return

    const cleanCep = formData.postalCode.replace(/\D/g, "")
    if (cleanCep.length !== 8) {
      setErrors({ ...errors, postalCode: "CEP inválido" })
      return
    }

    const result = await fetchCep(cleanCep)
    if (result) {
      setFormData({
        ...formData,
        line1: result.street || formData.line1,
        city: result.city || formData.city,
        state: result.state || formData.state,
      })
      setErrors({ ...errors, postalCode: "" })
      toast.success("Endereço encontrado!")
    } else {
      setErrors({ ...errors, postalCode: "CEP não encontrado" })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Nome obrigatório"
    if (!formData.email.trim()) newErrors.email = "E-mail obrigatório"

    if (formData.personType === "PF") {
      if (formData.cpf && !validateCPF(formData.cpf)) {
        newErrors.cpf = "CPF inválido"
      }
    } else {
      if (formData.cnpj && !validateCNPJ(formData.cnpj)) {
        newErrors.cnpj = "CNPJ inválido"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Corrija os erros no formulário")
      return
    }

    const t = toast.loading("Salvando...")

    try {
      await updateProfile.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ""),
        profile: {
          personType: formData.personType,
          cpf: formData.personType === "PF" ? formData.cpf.replace(/\D/g, "") : null,
          cnpj: formData.personType === "PJ" ? formData.cnpj.replace(/\D/g, "") : null,
          companyName: formData.personType === "PJ" ? formData.companyName : null,
        },
        billingAddress: {
          postalCode: formData.postalCode.replace(/\D/g, ""),
          line1: formData.line1,
          number: formData.number,
          city: formData.city,
          state: formData.state,
          line2: formData.line2,
        },
      })
      toast.success("Dados atualizados com sucesso!", { id: t })
    } catch (error) {
      toast.error("Erro ao atualizar dados", { id: t })
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-[#666666]">Carregando...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit} className="max-w-6xl space-y-12">
        {/* Dados Pessoais */}
        <div>
          <h1 className="text-[#ffffff] text-3xl font-semibold mb-8">Dados Pessoais</h1>

          {/* Linha 1: Nome | Email | Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="text-[#ffffff] text-sm block mb-2">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full bg-[#1a1a1a] text-[#ffffff] rounded-lg px-4 py-3 outline-none focus:ring-2 ${
                  errors.name ? "ring-2 ring-red-500" : "focus:ring-[#90f209]"
                }`}
                required
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-[#ffffff] text-sm block mb-2">
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full bg-[#1a1a1a] text-[#ffffff] rounded-lg px-4 py-3 outline-none focus:ring-2 ${
                  errors.email ? "ring-2 ring-red-500" : "focus:ring-[#90f209]"
                }`}
                required
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-[#ffffff] text-sm block mb-2">Tipo de Documento</label>
              <select
                value={formData.personType}
                onChange={(e) => {
                  setFormData({ ...formData, personType: e.target.value as PersonType })
                  setErrors({})
                }}
                className="w-full bg-[#1a1a1a] text-[#ffffff] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#90f209]"
              >
                <option value="PF">Pessoa Física (CPF)</option>
                <option value="PJ">Pessoa Jurídica (CNPJ)</option>
              </select>
            </div>
          </div>

          {/* Linha 2: CPF/CNPJ | Telefone | Razão Social */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-[#ffffff] text-sm block mb-2">
                {formData.personType === "PF" ? "CPF" : "CNPJ"}
              </label>
              <input
                type="text"
                value={formData.personType === "PF" ? formData.cpf : formData.cnpj}
                onChange={(e) => {
                  const formatted =
                    formData.personType === "PF"
                      ? formatCPF(e.target.value)
                      : formatCNPJ(e.target.value)
                  setFormData({
                    ...formData,
                    [formData.personType === "PF" ? "cpf" : "cnpj"]: formatted,
                  })
                }}
                onBlur={() => {
                  if (formData.personType === "PF" && formData.cpf) {
                    if (!validateCPF(formData.cpf)) {
                      setErrors({ ...errors, cpf: "CPF inválido" })
                    } else {
                      setErrors({ ...errors, cpf: "" })
                    }
                  } else if (formData.personType === "PJ" && formData.cnpj) {
                    if (!validateCNPJ(formData.cnpj)) {
                      setErrors({ ...errors, cnpj: "CNPJ inválido" })
                    } else {
                      setErrors({ ...errors, cnpj: "" })
                    }
                  }
                }}
                placeholder={formData.personType === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
                className={`w-full bg-[#1a1a1a] text-[#ffffff] placeholder:text-[#666666] rounded-lg px-4 py-3 outline-none focus:ring-2 ${
                  errors.cpf || errors.cnpj ? "ring-2 ring-red-500" : "focus:ring-[#90f209]"
                }`}
              />
              {(errors.cpf || errors.cnpj) && (
                <p className="text-red-500 text-xs mt-1">{errors.cpf || errors.cnpj}</p>
              )}
            </div>

            <div>
              <label className="text-[#ffffff] text-sm block mb-2">Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                className="w-full bg-[#1a1a1a] text-[#ffffff] placeholder:text-[#666666] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#90f209]"
              />
            </div>

            <div>
              <label className="text-[#ffffff] text-sm block mb-2">
                {formData.personType === "PJ" ? "Razão Social" : "Empresa (opcional)"}
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder={
                  formData.personType === "PJ" ? "Nome da empresa" : "Nome fantasia (opcional)"
                }
                className="w-full bg-[#1a1a1a] text-[#ffffff] placeholder:text-[#666666] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#90f209]"
              />
            </div>
          </div>
        </div>

        {/* Endereço de Faturamento */}
        <div>
          <h1 className="text-[#ffffff] text-3xl font-semibold mb-8">Endereço de Faturamento</h1>

          {/* Linha 1: CEP | Endereço | Número */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
            <div className="md:col-span-3">
              <label className="text-[#ffffff] text-sm block mb-2">CEP</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: formatCEP(e.target.value) })}
                onBlur={handleCepBlur}
                placeholder="00000-000"
                className={`w-full bg-[#1a1a1a] text-[#ffffff] placeholder:text-[#666666] rounded-lg px-4 py-3 outline-none focus:ring-2 ${
                  errors.postalCode ? "ring-2 ring-red-500" : "focus:ring-[#90f209]"
                } ${cepLoading ? "opacity-50" : ""}`}
                disabled={cepLoading}
              />
              {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
              {cepLoading && <p className="text-[#90f209] text-xs mt-1">Buscando...</p>}
            </div>

            <div className="md:col-span-7">
              <label className="text-[#ffffff] text-sm block mb-2">Endereço</label>
              <input
                type="text"
                value={formData.line1}
                onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                placeholder="Rua, Avenida, etc"
                className="w-full bg-[#1a1a1a] text-[#ffffff] placeholder:text-[#666666] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#90f209]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[#ffffff] text-sm block mb-2">Número</label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="123"
                className="w-full bg-[#1a1a1a] text-[#ffffff] placeholder:text-[#666666] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#90f209]"
              />
            </div>
          </div>

          {/* Linha 2: Cidade | Estado | Complemento */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
            <div className="md:col-span-5">
              <label className="text-[#ffffff] text-sm block mb-2">Cidade</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Cidade"
                className="w-full bg-[#1a1a1a] text-[#ffffff] placeholder:text-[#666666] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#90f209]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[#ffffff] text-sm block mb-2">Estado</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                placeholder="UF"
                maxLength={2}
                className="w-full bg-[#1a1a1a] text-[#ffffff] placeholder:text-[#666666] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#90f209] uppercase"
              />
            </div>

            <div className="md:col-span-5">
              <label className="text-[#ffffff] text-sm block mb-2">Complemento</label>
              <input
                type="text"
                value={formData.line2}
                onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                placeholder="Apto, bloco, sala, etc"
                className="w-full bg-[#1a1a1a] text-[#ffffff] placeholder:text-[#666666] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#90f209]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-[#1a1a1a] text-[#ffffff] font-semibold px-8 py-3 rounded-lg hover:bg-[#262626] transition-colors border border-[#262626]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="bg-[#90f209] text-[#000000] font-semibold px-8 py-3 rounded-lg hover:bg-[#a0ff20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateProfile.isPending ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  )
}
