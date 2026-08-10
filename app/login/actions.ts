"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  authCookieName,
  authTokenValue,
  personCookieName,
  teamCookieName,
  teamTokenValue,
} from "@/lib/auth";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30, // 30 Tage
  path: "/",
};

export async function login(formData: FormData) {
  const password = formData.get("password");
  if (typeof password !== "string" || password.length === 0) {
    redirect("/login?error=1");
  }

  const cookieStore = await cookies();

  if (process.env.APP_PASSWORD && password === process.env.APP_PASSWORD) {
    cookieStore.set(authCookieName, await authTokenValue(), cookieOptions);
    redirect("/dashboard");
  }

  if (process.env.TEAM_PASSWORD && password === process.env.TEAM_PASSWORD) {
    cookieStore.set(teamCookieName, await teamTokenValue(), cookieOptions);
    redirect("/log");
  }

  redirect("/login?error=1");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(authCookieName);
  cookieStore.delete(teamCookieName);
  cookieStore.delete(personCookieName);
  redirect("/login");
}
