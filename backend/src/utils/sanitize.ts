/**
 * Sanitize user input before passing to CLI Agent.
 * Prevents command injection attacks (INV-4).
 */
export function sanitizeInput(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, "");

  // Remove shell metacharacters that could enable injection
  // Allow: letters, digits, spaces, punctuation (.,!?;:-'"()[]{})
  // Block: $ ` | & ; ( ) < > (in shell context)
  sanitized = sanitized.replace(/[`$|&;<>]/g, "");

  // Trim excessive whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  // Enforce max length
  if (sanitized.length > 10000) {
    sanitized = sanitized.slice(0, 10000);
  }

  return sanitized;
}
