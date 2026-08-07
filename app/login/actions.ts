"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookieName, authTokenValue } from "@/lib/auth";

export async function login(formData: FormData) {
  const password = formData.get("password");

  if (
    typeof password !== "string" ||
    !process.env.APP_PASSWORD ||
    password !== process.env.APP_PASSWORD
  ) {
    redirect("/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(authCookieName, await authTokenValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 Tage
    path: "/",
  });

  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(authCookieName);
  redirect("/login");
}
