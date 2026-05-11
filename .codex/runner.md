# Codex Runner Activation

## Active App Automation
The Codex app automation registry has one active scheduler entry for SpecDiff:

- Automation ID: `specdiff-complete-audit`
- Name: `SpecDiff Autonomous Maintenance Loop`
- Registry file: `/Users/chappie/.codex/automations/specdiff-complete-audit/automation.toml`
- Status: `ACTIVE`
- Cadence: every 3 hours
- Workspace: `/Users/Shared/Projects/compare`

This single automation is the runtime entrypoint. It keeps work in the same dedicated automation conversation and executes the audit, planner, implementer, and docs responsibilities as one loop. Do not create separate active app automations for each heartbeat unless the product owner explicitly accepts multiple conversation threads.

## Repo Heartbeat Files
The files in `.codex/heartbeats` remain the role-specific contract for the loop:

- `audit.yml`
- `planner.yml`
- `implementer.yml`
- `docs.yml`

The active app automation prompt tells Codex to read those files before each run.

## Consent
Per-step approval prompting is disabled for normal repository maintenance. The runner may create or update issues, create commits, and push verified changes directly to `origin/main`. It may not force push or delete production code autonomously.

## Operational Note
If this repo is moved to another machine or Codex profile, recreate the automation registry entry from `.codex/heartbeats` and keep the same automation ID when possible so memory continuity is preserved.
