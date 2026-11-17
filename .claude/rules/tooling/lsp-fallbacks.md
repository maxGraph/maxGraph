# LSP Fallbacks (tsserver via mcp_ide)

Read this BEFORE any LSP operation. Update this file when new failures are discovered.

## Available operations

| Operation | Tool | Status | Notes |
|-----------|------|--------|-------|
| Get diagnostics | `mcp__ide__getDiagnostics` | Working | Returns TypeScript errors/warnings for a file |

## Fallback strategy

1. **LSP**: try `mcp__ide__getDiagnostics` first (~50 tokens vs ~2000 for Read)
2. **Grep**: search for usages, callers, patterns
3. **Read**: confirm in full context

## Known issues

None documented yet. Add entries here when LSP operations fail or return unexpected results.
