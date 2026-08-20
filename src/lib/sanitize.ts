export function sanitizeInput(value: string): string {
  return value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export function checkCsrfOrigin(request: Request, allowedOrigins: string[]): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin) {
    return allowedOrigins.some((o) => origin === o || origin.endsWith(new URL(o).hostname));
  }
  if (referer) {
    try {
      const refUrl = new URL(referer);
      return allowedOrigins.some((o) => {
        const allowed = new URL(o);
        return refUrl.hostname === allowed.hostname;
      });
    } catch {
      return false;
    }
  }
  return false;
}
