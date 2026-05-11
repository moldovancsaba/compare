# Codex Runner Activation

## Active App Automation
The Codex app automation registry has one active scheduler entry for {compare}:

- Automation ID: `compare-complete-audit`
- Name: `{compare} Autonomous Maintenance Loop`
- Registry file: `/Users/chappie/.codex/automations/compare-complete-audit/automation.toml`
- Status: `ACTIVE`
- Cadence: every 3 hours
- Workspace: `/Users/Shared/Projects/compare`
- Canonical conversation: `compare-autonomous-maintenance`
- Canonical thread ID: `019e1698-ea4b-7681-b05e-975f83e0b7c5`

This single automation is the runtime entrypoint. It is pinned to the same dedicated automation conversation with `target_thread_id` in the active registry file and executes the audit, planner, implementer, and docs responsibilities as one loop. Do not create separate active app automations for each heartbeat unless the product owner explicitly accepts multiple conversation threads.

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
If this repo is moved to another machine or Codex profile, recreate the automation registry entry from `.codex/heartbeats`, keep the same automation ID when possible, and set `target_thread_id` to the dedicated maintenance conversation so memory continuity is preserved.
