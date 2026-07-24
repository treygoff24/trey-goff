interface Principal {
  authenticator: string;
  principalId: string;
}

export const CHAT_TOOL_NAMES = ["read_memory", "read_own_journal", "read_site"] as const;
export const SCHEDULE_WRITE_TOOL_NAMES = ["write_journal_entry", "write_memory"] as const;

export function isSchedulePrincipal(principal: Principal | null | undefined): boolean {
  return principal?.authenticator === "app" && principal.principalId === "eve:app";
}

export function scheduleWritesEnabled(): boolean {
  return process.env.RESIDENT_SCHEDULE_ENABLED === "true";
}
