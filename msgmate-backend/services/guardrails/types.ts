/**
 * Security guardrails type definitions
 * Focused on content sanitization and basic threat detection
 */

// ── Enums ────────────────────────────────────────────────────────────────────

/**
 * Threat categories that the guardrails can detect.
 * Simplified enum for v1 of the security guardrails system.
 */
export enum ThreatType {
  TASK_OVERRIDE = 'task_override',
  PROMPT_INJECTION = 'prompt_injection',
  SENSITIVE_DATA = 'sensitive_data',
  DANGEROUS_ACTION = 'dangerous_action',
}

// ── Interfaces ───────────────────────────────────────────────────────────────

/**
 * A single security pattern with its regex, threat type, and replacement text.
 */
export interface SecurityPattern {
  pattern: RegExp;
  type: ThreatType;
  description: string;
  replacement?: string;
}

/**
 * Result of sanitizing untrusted content.
 */
export interface SanitizationResult {
  sanitized: string;
  threats: ThreatType[];
  modified: boolean;
}

/**
 * Future extensibility — validation result for content that should not be modified.
 */
export interface ValidationResult {
  isValid: boolean;
  threats?: ThreatType[];
  message?: string;
}
