/**
 * Content sanitizer for removing malicious patterns from untrusted content.
 * This is the workhorse of the security guardrails — it scans text for
 * threats, redacts them, and returns a clean result.
 */

import type { SanitizationResult, ThreatType } from './types';
import { getPatterns } from './patterns';

// ── Logger ───────────────────────────────────────────────────────────────────

const logger = {
  debug: (msg: string, ...args: unknown[]) => console.debug('[guardrails]', msg, ...args),
  info: (msg: string, ...args: unknown[]) => console.info('[guardrails]', msg, ...args),
  error: (msg: string, ...args: unknown[]) => console.error('[guardrails]', msg, ...args),
};

// ── Public API: Sanitization ──────────────────────────────────────────────────

/**
 * Sanitize untrusted content by removing dangerous patterns.
 *
 * Normalizes unicode, strips zero-width characters, applies all security
 * patterns (with optional strict patterns), and cleans up leftover
 * double-spaces and empty tags.
 *
 * @param content - Raw untrusted content (e.g., user message text)
 * @param strict - Whether to include additional strict-mode patterns
 * @returns Sanitization result with cleaned content, detected threats, and modification flag
 */
export function sanitizeContent(content: string | undefined, strict: boolean = false): SanitizationResult {
  if (!content || content.trim() === '') {
    return {
      sanitized: '',
      threats: [],
      modified: false,
    };
  }

  let sanitized = content.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '');
  const detectedThreats = new Set<ThreatType>();
  let wasModified = false;

  const patterns = getPatterns(strict);

  for (const securityPattern of patterns) {
    try {
      const originalLength = sanitized.length;

      const regex = new RegExp(securityPattern.pattern.source, securityPattern.pattern.flags);

      if (regex.test(sanitized)) {
        detectedThreats.add(securityPattern.type);

        const replacementRegex = new RegExp(securityPattern.pattern.source, securityPattern.pattern.flags);
        sanitized = sanitized.replace(replacementRegex, securityPattern.replacement || '');

        if (sanitized.length !== originalLength) {
          wasModified = true;
          logger.debug(`Sanitized ${securityPattern.type}: ${securityPattern.description}`);
        }
      }
    } catch (error) {
      logger.error(`Error processing pattern ${securityPattern.type}:`, error);
    }
  }

  if (wasModified) {
    sanitized = sanitized
      .replace(/[^\S\r\n]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    sanitized = cleanEmptyTags(sanitized);
  }

  return {
    sanitized,
    threats: Array.from(detectedThreats),
    modified: wasModified,
  };
}

// ── Public API: Threat detection (no modification) ────────────────────────────

/**
 * Detect threats in content without modifying it.
 * Useful for validation without sanitization.
 *
 * @param content - Content to analyze for threats
 * @param strict - Whether to include additional strict-mode patterns
 * @returns Array of detected threat types
 */
export function detectThreats(content: string, strict: boolean = false): ThreatType[] {
  if (!content || content.trim() === '') {
    return [];
  }

  const detectedThreats = new Set<ThreatType>();
  const patterns = getPatterns(strict);

  for (const securityPattern of patterns) {
    try {
      const regex = new RegExp(securityPattern.pattern.source, securityPattern.pattern.flags);

      if (regex.test(content)) {
        detectedThreats.add(securityPattern.type);
        logger.debug(`Threat detected: ${securityPattern.type} - ${securityPattern.description}`);
      }
    } catch (error) {
      logger.error(`Error testing pattern ${securityPattern.type}:`, error);
    }
  }

  return Array.from(detectedThreats);
}

// ── Public API: Tag cleanup ───────────────────────────────────────────────────

/**
 * Removes empty element pairs (e.g., `<div></div>`) and stray empty tags (e.g., `<>`)
 * left behind after pattern replacements.
 *
 * @param content - Content to clean up
 * @returns Content with empty tags removed
 */
export function cleanEmptyTags(content: string): string {
  const emptyPairPattern = /<(\w+)[^>]*>\s*<\/\1>/g;
  let result = content.replace(emptyPairPattern, '');
  const strayEmptyTagPattern = /<\s*\/?\s*>/g;
  result = result.replace(strayEmptyTagPattern, '');
  return result;
}
