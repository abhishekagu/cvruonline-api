import { parseStackTrace } from "./errorLocation.js";

/**
 * Custom Class for operational API errors with location tracking
 */
class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    const parsed = parseStackTrace(this.stack);
    this.location = parsed.location;
    this.file = parsed.file;
    this.line = parsed.line;
    this.column = parsed.column;
    this.functionName = parsed.functionName;
  }
}

export { ApiError };
export default ApiError;
