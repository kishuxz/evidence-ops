export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

const HEX_CONTROL = "0123456789abcdef";

function escapeJsonString(value: string): string {
  let out = "\"";
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code === undefined) {
      continue;
    }
    if (char === "\\") {
      out += "\\\\";
    } else if (char === "\"") {
      out += "\\\"";
    } else if (code < 0x20) {
      const hex = code.toString(16).padStart(4, "0");
      if ([...hex].some((h) => !HEX_CONTROL.includes(h))) {
        throw new Error("canonical json: invalid control hex");
      }
      out += `\\u${hex}`;
    } else {
      out += char;
    }
  }
  out += "\"";
  return out;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function canonicalJson(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (value === true) {
    return "true";
  }
  if (value === false) {
    return "false";
  }
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new Error("canonical json: only safe integers are allowed");
    }
    return String(value);
  }
  if (typeof value === "string") {
    return escapeJsonString(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    const fields = keys.map((key) => `${escapeJsonString(key)}:${canonicalJson(value[key])}`);
    return `{${fields.join(",")}}`;
  }
  throw new Error("canonical json: unsupported value");
}
