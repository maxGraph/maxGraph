# LSP Fallbacks (tsserver via mcp_ide)

Read this BEFORE any LSP operation. Update this file when new failures are discovered.

## Available operations

| Operation | Tool | Status | Notes |
|-----------|------|--------|-------|
| Get diagnostics | `mcp__ide__getDiagnostics` | Working | Returns TypeScript errors/warnings for a file |

## Fallback strategy

1. **LSP** — Try `mcp__ide__getDiagnostics` first (~50 tokens vs ~2000 for Read)
2. **Grep** — Search for usages, callers, patterns
3. **Read** — Confirm in full context

## Known issues

None documented yet. Add entries here when LSP operations fail or return unexpected results.
