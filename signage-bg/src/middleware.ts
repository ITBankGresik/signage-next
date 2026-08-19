import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req: NextRequest & { auth?: unknown }) => {
  const { pathname } = req.nextUrl
  const isAdminRoute = pathname.startsWith("/admin")

  if (isAdminRoute && !req.auth) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*"],
}
