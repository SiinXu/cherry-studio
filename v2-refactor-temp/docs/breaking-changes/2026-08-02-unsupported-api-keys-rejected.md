---
title: Unsupported API keys are rejected before use
category: changed
severity: notice
introduced_in_pr: "#TBD"
date: 2026-08-02
---

## What changed

Provider API keys containing characters that cannot be represented in an HTTP header are now rejected when they are saved. Existing invalid keys now produce a validation error before a model request starts and remain available to replace, disable, or remove.

## Why this matters to the user

Users with an invalid legacy key may see a provider-settings validation error instead of the opaque `Cannot convert argument to a ByteString` request failure. Ordinary provider-issued API keys are unaffected.

## What the user should do

Delete or replace the invalid entry with the exact API key issued by the provider. If the key was accidentally pasted with a provider name or other non-key text, copy it again from the provider console.

## Notes for release manager

Reported again on RC.4 during provider model detection. Deleting the previous API entry and adding it again was confirmed as a working user-side recovery.
