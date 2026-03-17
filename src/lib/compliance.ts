/**
 * Nevada Compliance Utilities
 * All AI-generated outreach must include Monica's license footer.
 * DNC contacts must never receive outreach.
 */

export const NEVADA_COMPLIANCE_FOOTER = `
Monica Selvaggio · Nevada License S.0190894 · Century21 Americana · This message is intended for the named recipient only.`;

export const NEVADA_COMPLIANCE_FOOTER_SHORT = `Monica Selvaggio · NV License S.0190894 · Century21 Americana`;

/**
 * Append the compliance footer to any AI-generated email body.
 */
export function appendComplianceFooter(body: string): string {
  return `${body.trimEnd()}\n\n---\n${NEVADA_COMPLIANCE_FOOTER.trim()}`;
}

/**
 * Append the short compliance footer to any AI-generated SMS.
 */
export function appendSMSCompliance(message: string): string {
  return `${message.trimEnd()}\n\n${NEVADA_COMPLIANCE_FOOTER_SHORT}`;
}

/**
 * Returns true if a contact should be blocked from outreach.
 */
export function isBlockedFromOutreach(contact: {
  dnc?: boolean;
  email_unsubscribed?: boolean;
  pipeline_stage?: string;
}): boolean {
  return (
    contact.dnc === true ||
    contact.email_unsubscribed === true ||
    contact.pipeline_stage === 'dnc'
  );
}
