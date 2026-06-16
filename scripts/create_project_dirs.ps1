param(
  [Parameter(Mandatory=$true)]
  [string]$RootDir,

  [Parameter(Mandatory=$true)]
  [string]$Topic
)

$stamp = Get-Date -Format "yyyyMMdd_HHmm"
$safeTopic = $Topic -replace '[\\/:*?"<>|]', ''
$project = Join-Path $RootDir "PPT_Image_Project_${safeTopic}_${stamp}"

$dirs = @(
  $project,
  (Join-Path $project "source_documents"),
  (Join-Path $project "assets\images"),
  (Join-Path $project "prompts"),
  (Join-Path $project "body_image"),
  (Join-Path $project "final_image")
)

foreach ($dir in $dirs) {
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

Write-Output $project
