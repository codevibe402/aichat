/**
 * System prompt used for all Groq API calls.
 * Instructs the model to return valid JSON and keep responses concise and polite.
 *
 * @internal — must never be modified by client-side code
 */
const SYSTEM_PROMPT = "Valid JSON only. Concise, polite replies.";

export { SYSTEM_PROMPT };
