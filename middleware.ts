import { NextResponse } from 'next/server'
import type { MiddlewareConfig, NextRequest } from 'next/server'
import * as jose from 'jose'

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')
    if (!token) {
        return NextResponse.rewrite(new URL('/auth/signin', request.url))
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET)
        const jwt = await jose.jwtVerify(token.value, secret)
        console.log('jwt', jwt);
        
        if (!jwt) {
            return NextResponse.rewrite(new URL('/auth/signin', request.url))
        }
        return NextResponse.next()
    } catch (error) {
        return NextResponse.rewrite(new URL('/auth/signin', request.url))
    }
}

export const config: MiddlewareConfig = {
    matcher: '/console/:path*',
}