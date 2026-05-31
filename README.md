# ppt-image-zlx-workflow

Versioned source and rollback tools for the personal Codex skill
`ppt-image-zlx-workflow`.

## Layout

- `skill/ppt-image-zlx-workflow/`: versioned skill source.
- `tools/backup-active-skill.ps1`: copy the active Codex skill into this repository.
- `tools/deploy-skill.ps1`: deploy the repository source into Codex.
- `tools/rollback-skill.ps1`: restore a tagged skill version into Codex.

The active Codex copy remains at:

```text
$HOME\.codex\skills\ppt-image-zlx-workflow
```

## Daily Backup

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\backup-active-skill.ps1
git diff
git add .
git commit -m "Describe workflow update"
git push
```

To commit and push in one step:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\backup-active-skill.ps1 -CommitMessage "Describe workflow update" -Push
```

After confirming a stable version:

```powershell
git tag -a v0.2.0 -m "Stable workflow version"
git push origin v0.2.0
```

## Deploy And Roll Back

Deploy the current repository source:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\deploy-skill.ps1
```

Restore a stable tagged release without changing the working branch:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\rollback-skill.ps1 -Tag v0.1.0
```

Every deploy and rollback creates a timestamped local snapshot under:

```text
$HOME\.codex\skill-backups\ppt-image-zlx-workflow
```

Restart Codex after deployment or rollback so the skill is reloaded.
