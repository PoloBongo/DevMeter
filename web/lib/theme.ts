import { cookies } from "next/headers";

export type Theme = "dark" | "light";

export const THEME_COOKIE = "devmeter-theme";

/** Reads the persisted theme so the server can render the correct `data-theme` on `<html>` up front — no client-side flash or flip on navigation. */
export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  return store.get(THEME_COOKIE)?.value === "light" ? "light" : "dark";
}
