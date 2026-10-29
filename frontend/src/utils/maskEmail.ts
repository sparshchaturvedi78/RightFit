export function maskEmail(email: string): string {
  const [name, domain] = email.split('@')
  if (!domain) return email
  const visible = name.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(name.length - 2, 2))}@${domain}`
}
