type ValidationErrorBody = {
  message?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[] | string>;
};

const GENERIC_VALIDATION_TITLE = "One or more validation errors occurred.";

function tryParseJson(value: string): ValidationErrorBody | null {
  try {
    return JSON.parse(value) as ValidationErrorBody;
  } catch {
    return null;
  }
}

function toFieldLabel(field: string): string {
  const cleaned = field
    .replace(/^\$\./, "")
    .replace(/^\$?\[?\d+\]?\./, "")
    .replace(/\[\d+\]/g, "")
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();

  if (!cleaned) return "This field";

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function toFriendlyValidationMessage(field: string, message: string): string {
  const label = toFieldLabel(field);
  const normalized = message.trim();

  if (/required/i.test(normalized)) return `${label} is required.`;
  if (/must be a string with a minimum length of (\d+)/i.test(normalized)) {
    const match = normalized.match(/minimum length of (\d+)/i);
    return `${label} must be at least ${match?.[1] ?? ""} characters.`.trim();
  }
  if (/valid email/i.test(normalized) || /not a valid e-?mail/i.test(normalized)) {
    return "Please enter a valid email address.";
  }
  if (/not valid|invalid/i.test(normalized)) return `${label} is invalid.`;
  if (/could not be converted|conversion/i.test(normalized)) return `${label} has an invalid value.`;

  return normalized.endsWith(".") ? normalized : `${normalized}.`;
}

function parseValidationErrors(body: ValidationErrorBody): string | null {
  if (!body.errors) return null;

  const messages: string[] = [];
  for (const [field, fieldErrors] of Object.entries(body.errors)) {
    const list = Array.isArray(fieldErrors) ? fieldErrors : [fieldErrors];
    for (const raw of list) {
      if (!raw) continue;
      messages.push(toFriendlyValidationMessage(field, String(raw)));
    }
  }

  if (messages.length === 0) return null;
  return messages.join(" ");
}

function mapDatabaseError(raw: string): string | null {
  if (/value too long for type character\(1\)/i.test(raw)) {
    return "One field has a value that is too long. Please choose a shorter value and try again.";
  }
  if (/null value in column/i.test(raw)) {
    return "A required value is missing. Please fill in all required fields and try again.";
  }
  if (/violates foreign key constraint/i.test(raw)) {
    return "One selected record no longer exists. Please refresh and choose a valid option.";
  }
  if (/duplicate key value violates unique constraint/i.test(raw)) {
    return "That value already exists. Please use a different one.";
  }
  return null;
}

export function getApiErrorMessage(error: unknown, fallback = "Request failed."): string {
  if (!(error instanceof Error)) return fallback;

  const fromDatabase = mapDatabaseError(error.message);
  if (fromDatabase) return fromDatabase;

  const parsed = tryParseJson(error.message);
  if (parsed) {
    if (parsed.message) return parsed.message;

    const parsedValidationErrors = parseValidationErrors(parsed);
    if (parsedValidationErrors) return parsedValidationErrors;

    if (parsed.detail) return parsed.detail;
    if (parsed.title && parsed.title !== GENERIC_VALIDATION_TITLE) return parsed.title;
  }

  if (error.message.startsWith("Error: ")) {
    return error.message.slice("Error: ".length) || fallback;
  }

  return error.message || fallback;
}
