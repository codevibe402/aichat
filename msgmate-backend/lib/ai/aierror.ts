export class AIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class EmptyResponseError extends AIError {
  constructor() {
    super("AI returned an empty response", 502);
  }
}

export class InvalidJsonError extends AIError {
  constructor() {
    super("AI response was not valid JSON", 502);
  }
}

export class InvalidReplyCountError extends AIError {
  constructor() {
    super("AI response did not contain exactly 3 replies", 502);
  }
}

export class GroqUnauthorizedError extends AIError {
  constructor(message = "Invalid Groq API key") {
    super(message, 401);
  }
}

export class GroqRateLimitError extends AIError {
  constructor(message = "Groq rate limit exceeded") {
    super(message, 429);
  }
}

export class GroqRequestError extends AIError {
  constructor(
    message = "Groq request failed",
    statusCode = 500,
  ) {
    super(message, statusCode);
  }
}