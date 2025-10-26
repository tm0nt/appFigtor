import authConfig from "./auth.config"
import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { validateSession } from "@/lib/session"

const { auth } = NextAuth(authConfig)

export default auth(async (req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Verificar também sessão própria para permitir revogação granular
  let hasValidAppSession = false
  const sessionToken = req.cookies.get("app_session")?.value
  
  if (sessionToken && isLoggedIn) {
    try {
      const dbSession = await validateSession(sessionToken)
      hasValidAppSession = !!dbSession
    } catch (error) {
      console.error("Erro validando sessão:", error)
      // Se há erro na validação, considerar sessão inválida
      hasValidAppSession = false
    }
  }

  // Considerar usuário logado apenas se tem ambas as sessões
  const isFullyLoggedIn = isLoggedIn && hasValidAppSession

  // Rotas que só usuários NÃO logados podem acessar
  const authRoutes = ["/", "/signup", "/auth/forgot-password", "/auth/reset-password"]
  const isAuthRoute = authRoutes.includes(nextUrl.pathname)

  // APIs públicas que não precisam de autenticação
  const isPublicAPI =
    nextUrl.pathname.startsWith("/api/auth/login") ||
    nextUrl.pathname.startsWith("/api/auth/logout") ||
    nextUrl.pathname.startsWith("/api/auth/sessions") ||
    nextUrl.pathname.startsWith("/api/register") ||
    nextUrl.pathname.startsWith("/api/forgot-password") ||
    nextUrl.pathname.startsWith("/api/reset-password") ||
    nextUrl.pathname.startsWith("/api/auth/callback") ||
    nextUrl.pathname.startsWith("/api/auth/csrf") ||
    nextUrl.pathname.startsWith("/api/auth/signin") ||
    nextUrl.pathname.startsWith("/api/auth/signout") ||
    nextUrl.pathname.startsWith("/api/auth/session")

  // Arquivos estáticos e manifests
  const isStaticFile = 
    nextUrl.pathname.startsWith("/_next/") ||
    nextUrl.pathname.startsWith("/favicon") ||
    nextUrl.pathname.startsWith("/manifest") ||
    nextUrl.pathname.startsWith("/sw.js") ||
    nextUrl.pathname.startsWith("/assets/") ||
    nextUrl.pathname.includes(".")

  // Libera API routes, assets e arquivos estáticos sempre
  if (isPublicAPI || isStaticFile) {
    return NextResponse.next()
  }

  // Se usuário está LOGADO e tenta acessar páginas de auth → redireciona para dashboard
  if (isFullyLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin))
  }

  // Se usuário NÃO está logado e tenta acessar rota protegida → redireciona para login
  if (!isFullyLoggedIn && !isAuthRoute) {
    // Se tem NextAuth mas não tem sessão no banco, limpar cookie e redirecionar
    if (isLoggedIn && !hasValidAppSession) {
      const response = NextResponse.redirect(new URL("/", nextUrl.origin))
      response.cookies.delete("app_session")
      return response
    }

    // Se não tem nenhuma sessão, redirecionar com callback
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(new URL(`/?callbackUrl=${callbackUrl}`, nextUrl.origin))
  }

  // Casos permitidos:
  // - Usuário totalmente logado acessando rota protegida
  // - Usuário não logado acessando rota de auth
  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (custom assets)
     * - Any file with an extension (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|assets|.*\\.).*)"  
  ],
}