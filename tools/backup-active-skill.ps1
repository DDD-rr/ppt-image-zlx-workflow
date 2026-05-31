param(
    [string]$CommitMessage,
    [switch]$Push,
    [string]$StableTag
)

. (Join-Path $PSScriptRoot 'common.ps1')

if (-not (Test-Path -LiteralPath (Join-Path $script:ActiveSkillPath 'SKILL.md'))) {
    throw "Active skill is missing: $script:ActiveSkillPath"
}

Assert-PathWithin -Path $script:RepositorySkillPath -Root $script:RepositoryRoot

if (Test-Path -LiteralPath $script:RepositorySkillPath) {
    Remove-Item -LiteralPath $script:RepositorySkillPath -Recurse -Force
}
New-Item -ItemType Directory -Path (Split-Path -Parent $script:RepositorySkillPath) -Force | Out-Null
Copy-Item -LiteralPath $script:ActiveSkillPath -Destination $script:RepositorySkillPath -Recurse
Assert-DirectoriesMatch -Expected $script:ActiveSkillPath -Actual $script:RepositorySkillPath

Write-Host 'Active skill copied into repository and verified.'
git -c "safe.directory=$script:RepositoryRoot" -C $script:RepositoryRoot status --short

if ($CommitMessage) {
    git -c "safe.directory=$script:RepositoryRoot" -C $script:RepositoryRoot add --all
    git -c "safe.directory=$script:RepositoryRoot" -C $script:RepositoryRoot commit -m $CommitMessage
}

if ($StableTag) {
    if (-not $CommitMessage) {
        throw 'Use -CommitMessage when creating a stable tag.'
    }
    git -c "safe.directory=$script:RepositoryRoot" -C $script:RepositoryRoot tag -a $StableTag -m "Stable workflow version $StableTag"
}

if ($Push) {
    git -c "safe.directory=$script:RepositoryRoot" -C $script:RepositoryRoot push
    if ($StableTag) {
        git -c "safe.directory=$script:RepositoryRoot" -C $script:RepositoryRoot push origin $StableTag
    }
}
