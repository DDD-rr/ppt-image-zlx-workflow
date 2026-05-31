$ErrorActionPreference = 'Stop'

$script:SkillName = 'ppt-image-zlx-workflow'
$script:RepositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$script:RepositorySkillPath = Join-Path $script:RepositoryRoot "skill\$script:SkillName"
$script:ActiveSkillPath = Join-Path $HOME ".codex\skills\$script:SkillName"
$script:BackupRoot = Join-Path $HOME ".codex\skill-backups\$script:SkillName"

function Assert-PathWithin {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Root
    )

    $fullPath = [System.IO.Path]::GetFullPath($Path)
    $fullRoot = [System.IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'
    if (-not $fullPath.StartsWith($fullRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to operate outside expected root: $fullPath"
    }
}

function Get-RelativeFileHashes {
    param([Parameter(Mandatory = $true)][string]$Root)

    if (-not (Test-Path -LiteralPath $Root)) {
        return @()
    }

    return @(
        Get-ChildItem -LiteralPath $Root -Recurse -File -Force |
            Sort-Object FullName |
            ForEach-Object {
                [PSCustomObject]@{
                    RelativePath = $_.FullName.Substring($Root.Length).TrimStart('\')
                    Hash = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
                }
            }
    )
}

function Assert-DirectoriesMatch {
    param(
        [Parameter(Mandatory = $true)][string]$Expected,
        [Parameter(Mandatory = $true)][string]$Actual
    )

    $difference = Compare-Object `
        (Get-RelativeFileHashes -Root $Expected) `
        (Get-RelativeFileHashes -Root $Actual) `
        -Property RelativePath, Hash

    if ($difference) {
        $difference | Format-Table -AutoSize | Out-String | Write-Host
        throw 'File hash verification failed.'
    }
}

function New-ActiveSkillSnapshot {
    if (-not (Test-Path -LiteralPath $script:ActiveSkillPath)) {
        return $null
    }

    New-Item -ItemType Directory -Path $script:BackupRoot -Force | Out-Null
    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $snapshotPath = Join-Path $script:BackupRoot $timestamp
    Assert-PathWithin -Path $snapshotPath -Root $script:BackupRoot
    Copy-Item -LiteralPath $script:ActiveSkillPath -Destination $snapshotPath -Recurse
    return $snapshotPath
}

function Install-SkillDirectory {
    param([Parameter(Mandatory = $true)][string]$Source)

    if (-not (Test-Path -LiteralPath (Join-Path $Source 'SKILL.md'))) {
        throw "Source skill is missing SKILL.md: $Source"
    }

    $skillsRoot = Join-Path $HOME '.codex\skills'
    Assert-PathWithin -Path $script:ActiveSkillPath -Root $skillsRoot
    $snapshot = New-ActiveSkillSnapshot

    if (Test-Path -LiteralPath $script:ActiveSkillPath) {
        Remove-Item -LiteralPath $script:ActiveSkillPath -Recurse -Force
    }
    New-Item -ItemType Directory -Path $skillsRoot -Force | Out-Null
    Copy-Item -LiteralPath $Source -Destination $script:ActiveSkillPath -Recurse
    Assert-DirectoriesMatch -Expected $Source -Actual $script:ActiveSkillPath

    if ($snapshot) {
        Write-Host "Snapshot created: $snapshot"
    }
    Write-Host "Skill deployed and verified: $script:ActiveSkillPath"
    Write-Host 'Restart Codex to reload the skill.'
}

