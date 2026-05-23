---
name: requirements-to-plan
description: "convert a new requirement into a code-backed system design and implementation plan. use when you need requirement analysis, architecture options, existing-code leverage mapping, change impact analysis, phased implementation steps, risks, and a handoff package for execution."
---

# Purpose

Turn a new requirement into an executable, code-backed implementation plan without making code changes.

# Scope

This skill is for planning only.

- In scope: requirement clarification, design from requirements, impact analysis, implementation planning, risk and rollback planning, execution handoff.
- Out of scope: editing source code, running migrations, modifying infrastructure, making implementation commits.

# Required Inputs

- Requirement statement
- Constraints and acceptance criteria (if available)
- Existing repository source tree
- Existing docs under `/docs` (especially architecture and feature docs)
- Root README and configuration files

If acceptance criteria are missing, explicitly derive and label proposed criteria.

# Precondition

Before planning, check whether architecture docs are stale for the target scope.

- If stale or missing, instruct using `codebase-doc-writer` first for a bootstrap or scoped refresh.
- Continue only when baseline understanding is sufficient for a reliable plan.

# Analysis Order

1. Parse requirement and define in-scope vs out-of-scope
2. Extract explicit constraints and derive missing assumptions
3. Read relevant architecture/feature/module docs
4. Trace current implementation paths in code
5. Design candidate approaches and compare tradeoffs
6. Select recommended approach with rationale
7. Build change impact matrix
8. Build phased implementation plan
9. Define test and validation strategy
10. Build rollback strategy and execution handoff package

# Planning Rules

- Separate findings into:
  - **Observed**: directly verified in code/docs
  - **Inferred**: derived from patterns and wiring
  - **Unknown**: not yet verified
- Prefer file-backed explanations and concrete symbols
- Do not pretend uncertain flows are complete
- Keep scope tight to the requirement
- Identify contradictions between requirement and current implementation
- Include Mermaid design diagrams for workflows when confidence is sufficient
- If a diagram would require guessed edges, mark missing parts as **Unknown**

# Required Outputs

Produce all sections below in this order.

## 1) Requirement Brief

- Problem statement
- Business/technical objective
- In-scope and out-of-scope
- Constraints
- Assumptions
- Acceptance criteria

## 2) Current-State Leverage Map

- Existing components/services/routes/data models to reuse
- Relevant files/modules and why they matter
- Gaps between requirement and current behavior

## 3) Proposed System Design

- Recommended approach
- At least one alternative and why it was not selected
- Data flow and control flow impacts
- API/schema/config changes needed
- Mermaid diagram if applicable

## 4) Change Impact Matrix

For each impacted area, include:

- Area (API, service, model, persistence, config, tests, docs)
- Target files/modules
- Change type (add/update/remove)
- Risk level (low/medium/high)
- Dependency notes

## 5) Implementation Plan

- Phase-by-phase sequence
- Each phase must include:
  - Goal
  - Concrete tasks
  - Dependencies
  - Verification steps
  - Exit criteria

## 6) Validation Strategy

- Unit/integration/e2e expectations by phase
- Backward compatibility checks
- Non-functional checks if relevant (security/performance)

## 7) Rollback Strategy

- Rollback trigger conditions
- Minimal rollback steps
- Data/schema rollback notes (if any)

## 8) Execution Handoff Package

Provide a structured handoff object for `implementation-executor` with:

- Scope
- Acceptance criteria
- Approved approach
- Phases/tasks
- Impacted files/modules
- Risks/mitigations
- Validation checklist
- Rollback plan
- Open unknowns and decisions needed

# Hard Gates

- Stop and flag if critical unknowns block safe planning
- Do not output implementation patches
- Do not collapse planning and execution into one step
- If requirement is ambiguous, include decision options and recommended default

# Quality Checklist

- Plan is traceable to requirement clauses
- Reuse is explicit before introducing new abstractions
- Every high-risk task has a mitigation and validation step
- Handoff package is immediately executable by `implementation-executor`
