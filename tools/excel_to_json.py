#!/usr/bin/env python3
"""
excel_to_json.py — Convert a RegIntel Excel export back to the required JSON format.

Usage:
    python3 excel_to_json.py input.xlsx [output.json]

If output.json is omitted, writes <input-stem>.json next to the input file.
Supports both JSON array output (default) and JSONL with --jsonl flag.
"""

import sys
import json
import argparse
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit("Missing dependency: pip install openpyxl")


# Fields that should be arrays (comma-separated in Excel → list in JSON)
ARRAY_FIELDS = {"hstm_role"}

# Fields that should be booleans
BOOL_FIELDS = {"explicit_training"}

# Fields that are nested objects (prefix → dict key in output)
NESTED_PREFIXES = ("source_record.", "extraction_metadata.")

# Fields whose numeric-looking values must stay as strings
STRING_FIELDS = {
    "record_id", "citation", "citation_subsection", "hours_required",
    "identifier", "openlaws_path", "source_file", "parsed_by",
}


def coerce(col: str, raw) -> object:
    """Convert a cell value to its correct Python type."""
    if raw is None or raw == "":
        return None

    val = str(raw).strip()

    if val == "":
        return None

    # Boolean fields
    if col in BOOL_FIELDS:
        return val.lower() in ("true", "1", "yes")

    # Array fields — split on ", " or "," with optional spaces
    if col in ARRAY_FIELDS:
        parts = [p.strip() for p in val.split(",") if p.strip()]
        return parts if parts else None

    # Keep designated string fields as strings
    if col in STRING_FIELDS:
        return val

    # Try int, then float, else keep as string
    if col not in STRING_FIELDS:
        try:
            as_int = int(val)
            # Guard: if it looks like a plain integer with no decimal, return int
            if str(as_int) == val:
                return as_int
        except ValueError:
            pass
        try:
            return float(val)
        except ValueError:
            pass

    return val


def nest(flat: dict) -> dict:
    """Re-nest dot-notation keys into sub-dicts."""
    out = {}
    nested: dict[str, dict] = {}

    for col, val in flat.items():
        matched = False
        for prefix in NESTED_PREFIXES:
            if col.startswith(prefix):
                group_key = prefix.rstrip(".")   # "source_record" or "extraction_metadata"
                sub_key   = col[len(prefix):]
                if group_key not in nested:
                    nested[group_key] = {}
                nested[group_key][sub_key] = val
                matched = True
                break
        if not matched:
            out[col] = val

    # Merge nested dicts into output; keep None if all sub-values are None
    for group_key, sub in nested.items():
        all_none = all(v is None for v in sub.values())
        out[group_key] = None if all_none else sub

    return out


def read_excel(path: Path) -> list[dict]:
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        sys.exit("Excel sheet is empty.")

    headers = [str(h).strip() if h is not None else "" for h in rows[0]]
    records = []

    for row in rows[1:]:
        # Skip completely blank rows
        if all(cell is None or str(cell).strip() == "" for cell in row):
            continue

        flat = {}
        for col, cell in zip(headers, row):
            if not col:
                continue
            # Determine the bare field name for type coercion
            bare = col.split(".")[-1]
            flat[col] = coerce(bare, cell)

        records.append(nest(flat))

    wb.close()
    return records


def main():
    parser = argparse.ArgumentParser(description="Convert RegIntel Excel → JSON")
    parser.add_argument("input",  help="Path to .xlsx file")
    parser.add_argument("output", nargs="?", help="Path to output .json (default: <input>.json)")
    parser.add_argument("--jsonl", action="store_true", help="Write JSONL instead of a JSON array")
    args = parser.parse_args()

    in_path  = Path(args.input).expanduser().resolve()
    out_path = Path(args.output).expanduser().resolve() if args.output \
               else in_path.with_suffix(".jsonl" if args.jsonl else ".json")

    if not in_path.exists():
        sys.exit(f"File not found: {in_path}")
    if in_path.suffix.lower() not in (".xlsx", ".xlsm", ".xls"):
        print(f"Warning: expected an Excel file, got {in_path.suffix}", file=sys.stderr)

    records = read_excel(in_path)
    print(f"Read {len(records)} rows from {in_path.name}")

    with open(out_path, "w", encoding="utf-8") as f:
        if args.jsonl:
            for rec in records:
                json.dump(rec, f, ensure_ascii=False)
                f.write("\n")
        else:
            json.dump(records, f, indent=2, ensure_ascii=False)

    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
