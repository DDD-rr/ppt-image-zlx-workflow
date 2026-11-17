# Complete single-page inputs

The normal command sequence is in `single-page-execution.md`. Keep prepare's sessionFile for later commands. A fresh design uses one brief following `single-page-design-contract.md`; ready --session-file <file> --brief-file <brief.json> --verified writes its separate immutable artifacts. Program-copied confirmed decisions remain complete, and the model supplies the exact prompt and page-specific visual design. Recovery documentation is loaded only for an actual exception.

Run the existing prepare command with --packet-only to receive a small status plus packetPath. Read page-input.json once. It retains the complete frozen input, including active source text/screenshots, global/page decisions, user overrides, asset identities, design artifacts and applicable planning/QA reference paths with file hashes. Rule text stays in its existing authoritative files and is loaded once for the relevant stage. The normal return shape remains supported for existing callers.

## Supplemental image references

When a prompt depends on a prior slide or crop, save a project-local JSON specification and pass --references-file to prepare or record/ready. Paths are relative to the project root. The existing packaged images are always included, respecting explicit asset omissions already authorized in the frozen input. Supplemental references cannot remove or change their roles.

```json
{
  "mode": "edit",
  "references": [
    {"path": "final_image/slide_41_v015.png", "role": "edit-base"},
    {"path": "work/confirmed-table-crop.png", "role": "reference-crop"}
  ]
}
```

Only include a crop that actually exists and has been inspected. Allowed roles are edit-base, reference-crop, layout-reference and content-reference. The program verifies file existence, project confinement and bytes. Edit mode requires a declared edit-base and automatically marks the attempt localized-repair. The agent still checks that the declaration covers every image mentioned in the prompt. Avoid standalone reuse of an edit prompt that requires a prior slide.

Each actual recorded attempt receives immutable image-inputs.json with every path, role, byte count and hash. The execution record points to that list by hash. Later checks verify supplemental images along with the packaged assets. Changed references require a distinct verified attempt. A cross-request standalone draft can retain its supplemental references only while all hashes remain current. Missing or changed cache references cause a rebuild. Old same-run records remain available for inspection; an absent image list cannot establish complete reference coverage.

For a fresh generation, `ready` binds the exact prompt to the complete declared image-input set. The wrapper records that contract only after successful image QA and candidate registration, then rechecks every current path and hash before reuse. Edit mode retains its base dependency and prevents standalone cache promotion. The legacy `--source-only-inputs` flag is not required for normal generation.

## Fixed transport plan

Windows paths produce a conversation-first transport plan. Display each original in viewPaths once, following the plan's order, then use the current tool's supported conversation-reference mechanism. The edit base comes first, followed by the remaining distinct actual image files. Preserve every role, actual source and exact prompt. recentImageCount is provided only when the set fits the known recent-image capacity. Larger sets remain complete and require a capability check; the program never silently drops references. A plan is not a tool call or an authorization grant. Follow the actual image tool documentation and report an unsupported input requirement.

After ready/check, tool-input.json contains the exact checked prompt and complete image list plus transport plan. With --packet-only the command returns its path instead of printing the prompt again. Use the existing authorized runtime to read that file programmatically and pass its exact values to the official image call. Full-image creation, localized edits, official result handoff and actual-image QA continue through the existing workflow. Keep all quality rules and source fidelity requirements.
