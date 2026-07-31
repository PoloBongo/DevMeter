/** Free/consumer mail providers — enterprise mode would otherwise let two strangers who share one of these accidentally merge into one "org". */
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
]);

export function emailDomain(email: string): string {
  return email.slice(email.indexOf("@") + 1).toLowerCase();
}

export function isEligibleForEnterpriseMode(email: string): boolean {
  return !FREE_EMAIL_DOMAINS.has(emailDomain(email));
}
