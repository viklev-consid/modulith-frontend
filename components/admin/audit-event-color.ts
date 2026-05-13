export function auditEventColor(eventType: string): string {
  const normalized = eventType.toLowerCase();
  if (
    normalized.includes("password") ||
    normalized.includes("password.changed")
  ) {
    return "bg-amber-500";
  }
  if (normalized.includes("google") || normalized.includes("provider")) {
    return "bg-purple-500";
  }
  if (
    normalized.includes("login") ||
    normalized.includes("onboarding") ||
    normalized.includes("registered")
  ) {
    return "bg-emerald-500";
  }
  if (normalized.includes("role") || normalized.includes("invitation")) {
    return "bg-sky-500";
  }
  if (
    normalized.includes("delete") ||
    normalized.includes("revoke") ||
    normalized.includes("error")
  ) {
    return "bg-red-500";
  }
  return "bg-muted-foreground";
}
