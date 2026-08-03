---
title: Built-in MCP auto-install works after V2 migration
category: data-migration
severity: notice
introduced_in_pr: '#TBD'
date: 2026-08-02
---

## What changed

The built-in MCP auto-install server now uses the published `@mcpmarket/mcp-auto-install` package. Fresh V1-to-V2 migrations and existing V2 databases both replace only the removed package token while preserving the configured command and other launch arguments.

## Why this matters to the user

Users whose built-in auto-install entry still referenced `@cherry/mcp-auto-install` could no longer start that MCP server because the package is unavailable. The entry is repaired automatically during migration or the next V2 startup.

## What the user should do

Nothing — automatic.

## Notes for release manager

This is the V2 forward-port of the fix tracked by issue #17688. Correctly configured and non-builtin MCP servers are left unchanged.
