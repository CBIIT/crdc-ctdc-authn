---
name: implementation-executor
description: "execute an approved implementation plan in controlled batches with validation and closeout. use when a requirements-to-plan handoff exists and you need to implement code changes, verify results, track deviations, and complete documentation closeout."
---

# Purpose

Execute an approved implementation plan safely and incrementally, with continuous verification and closeout updates.

# Scope

This skill is for implementation and delivery.

- In scope: code changes, tests, validation, plan tracking, closeout documentation updates.
- Out of scope: creating a brand-new architecture direction without a plan, uncontrolled large rewrites, silent scope expansion.

# Required Inputs

- Execution handoff package from `requirements-to-plan`
- Approved scope and constraints
- Acceptance criteria
- Validation checklist
- Rollback strategy

If the handoff package is missing critical sections, pause and request plan completion first.

# Execution Strategy

Execute in small batches and validate after each batch.

1. Read handoff package and restate scope boundaries
2. Group tasks into minimum safe batches
3. Execute one batch at a time
4. Validate batch outcomes immediately
5. Record deviations and rationale
6. Continue only if batch exit criteria pass
7. Perform final closeout and docs updates

# Batch Rules

Each batch must include:

- Target files/modules
- Intended behavior change
- Risks and mitigations
- Validation commands/checks
- Expected outcome

After each batch, produce:

- What changed
- What was validated
- Pass/fail status
- Any deviation from plan
- Next action

# Deviation Policy

If execution diverges from plan:

- Label as `minor` or `major`
- Explain root cause
- Provide corrected path
- For major deviations, stop and request re-plan via `requirements-to-plan`

# Validation Requirements

Validation is mandatory at both batch and final stages.

- Run relevant tests for changed scope
- Run lint/build checks where applicable
- Verify acceptance criteria mapping
- Verify no unrelated regressions observed in touched areas
- If validation cannot run, state exactly why and mark risk

# Required Outputs

Produce all sections below.

## 1) Execution Summary

- Scope executed
- Batches completed
- Deviations encountered

## 2) Batch Logs

For each batch:

- Tasks completed
- Files/modules changed
- Validation performed
- Outcome

## 3) Acceptance Criteria Trace

Map each acceptance criterion to:

- Implemented change
- Validation evidence
- Status (met/partial/not met)

## 4) Risk and Issue Register

- New risks discovered
- Open issues
- Temporary compromises (if any)

## 5) Closeout

- Docs updated (feature/module/system docs as needed)
- `docs/known-gaps.md` updated with unresolved unknowns
- Operational notes (migration flags, config toggles, rollout notes)
- Final recommendation (ready/not ready)

# Hard Gates

- Do not expand scope silently
- Do not skip validation without explicit risk callout
- Do not claim completion with unmet acceptance criteria
- Do not bypass rollback considerations for high-risk changes

# Closeout Rules

When execution changes architecture, behavior, or flow semantics:

- Update relevant docs under `/docs`
- Keep observed vs inferred vs unknown labeling in new analysis notes
- Record contradictions between plan and implementation outcomes

# Quality Checklist

- Every completed task maps to a planned item
- Every acceptance criterion has evidence
- Any unmet criterion has a concrete follow-up action
- Final output is decision-ready for release review
