from __future__ import annotations

from typing import Any

_HEX = "0123456789abcdef"


def _escape_json_string(value: str) -> str:
    out: list[str] = ['"']
    for char in value:
        code = ord(char)
        if char == "\\":
            out.append("\\\\")
        elif char == '"':
            out.append('\\"')
        elif code < 0x20:
            hex_digits = f"{code:04x}"
            if any(digit not in _HEX for digit in hex_digits):
                raise ValueError("canonical json: invalid control hex")
            out.append(f"\\u{hex_digits}")
        else:
            out.append(char)
    out.append('"')
    return "".join(out)


def canonical_json(value: Any) -> str:
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int) and not isinstance(value, bool):
        if abs(value) > 9007199254740991:
            raise ValueError("canonical json: only safe integers are allowed")
        return str(value)
    if isinstance(value, str):
        return _escape_json_string(value)
    if isinstance(value, list):
        return "[" + ",".join(canonical_json(item) for item in value) + "]"
    if isinstance(value, dict):
        keys = sorted(value.keys())
        fields = [_escape_json_string(key) + ":" + canonical_json(value[key]) for key in keys]
        return "{" + ",".join(fields) + "}"
    raise ValueError("canonical json: unsupported value")
