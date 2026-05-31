param(
    [Parameter(Mandatory = $true)][string]$Tag
)

. (Join-Path $PSScriptRoot 'common.ps1')

$tagExists = git -C $script:RepositoryRoot tag --list $Tag
if ($tagExists -ne $Tag) {
    throw "Git tag does not exist: $Tag"
}

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "$script:SkillName-$Tag-$([Guid]::NewGuid().ToString('N'))"
$archivePath = Join-Path $tempRoot 'skill.zip'
$extractPath = Join-Path $tempRoot 'extract'

try {
    New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null
    git -C $script:RepositoryRoot archive --format=zip --output=$archivePath $Tag "skill/$script:SkillName"
    Expand-Archive -LiteralPath $archivePath -DestinationPath $extractPath
    $taggedSkillPath = Join-Path $extractPath "skill\$script:SkillName"
    Install-SkillDirectory -Source $taggedSkillPath
    Write-Host "Restored tagged release: $Tag"
}
finally {
    if (Test-Path -LiteralPath $tempRoot) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force
    }
}

