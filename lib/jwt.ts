import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { env } from "./env";

const secret = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);


export async function encrypt(payload: any) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h") // Access token expires in 1 hour
    .sign(secret);

  const refreshToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Refresh token expires in 7 days
    .sign(refreshSecret);

  return { token, refreshToken };
}

export async function decrypt(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function decryptRefreshToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, refreshSecret);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getJWTPayload(request: NextRequest) {
  const cookieStore = cookies();
  const token = request.headers.get("authorization")?.split(" ")[1] || 
                cookieStore.get("token")?.value;

  if (!token) return null;

  const payload = await decrypt(token);
  return payload;
}

export async function getRefreshTokenPayload() {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) return null;

  const payload = await decryptRefreshToken(refreshToken);
  return payload;
}

export function setTokenCookie(token: string, refreshToken: string) {
  const cookieStore = cookies();
  
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 // 1 hour
  });

  cookieStore.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 // 7 days
  });
}

export function clearTokenCookie() {
  const cookieStore = cookies();
  cookieStore.delete("token");
  cookieStore.delete("refreshToken");
}