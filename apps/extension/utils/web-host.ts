export function webHost(): string {
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  const fromEnv = env.WXT_PUBLIC_LOCKER_WEB_HOST;
  return (fromEnv ?? "http://localhost:3000").replace(/\/$/, "");
}
