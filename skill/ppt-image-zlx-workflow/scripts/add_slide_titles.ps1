param(
  [Parameter(Mandatory=$true)]
  [string]$ProjectDir,

  [Parameter(Mandatory=$true)]
  [string]$TitleMapPath,

  [string]$BodyDir = "body_image",
  [string]$OutputDir = "final_image",
  [string]$TitleStylePath = "",
  [string]$FontName = "Microsoft YaHei UI",
  [int]$FontSizePx = 48,
  [int]$TitleX = 50,
  [int]$TitleY = 36
)

Add-Type -AssemblyName System.Drawing

$bodyPath = Join-Path $ProjectDir $BodyDir
$outPath = Join-Path $ProjectDir $OutputDir
New-Item -ItemType Directory -Path $outPath -Force | Out-Null

$titleMap = Get-Content -LiteralPath $TitleMapPath -Raw -Encoding UTF8 | ConvertFrom-Json
$stylePath = $TitleStylePath
if (-not $stylePath) {
  $candidateStylePath = Join-Path $ProjectDir "title_style.json"
  if (Test-Path -LiteralPath $candidateStylePath) {
    $stylePath = $candidateStylePath
  }
}

$style = $null
if ($stylePath) {
  $style = Get-Content -LiteralPath $stylePath -Raw -Encoding UTF8 | ConvertFrom-Json
  if ($style.font_name) { $FontName = $style.font_name }
  if ($style.font_size_px) { $FontSizePx = $style.font_size_px }
  if ($null -ne $style.title_x) { $TitleX = $style.title_x }
  if ($null -ne $style.title_y) { $TitleY = $style.title_y }
}

function New-Color {
  param(
    [object]$Values,
    [int[]]$Fallback
  )

  $channels = $Fallback
  if ($Values -and $Values.Count -eq 4) {
    $channels = @($Values | ForEach-Object { [int]$_ })
  }
  return [System.Drawing.Color]::FromArgb($channels[0], $channels[1], $channels[2], $channels[3])
}

function Get-ValueOrDefault {
  param(
    [object]$Value,
    [object]$Default
  )

  if ($null -ne $Value) { return $Value }
  return $Default
}

function Add-Title {
  param(
    [string]$InputPath,
    [string]$OutputPath,
    [string]$Title
  )

  $img = [System.Drawing.Image]::FromFile($InputPath)
  try {
    $bmp = New-Object System.Drawing.Bitmap $img.Width, $img.Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
      $g.DrawImage($img, 0, 0, $img.Width, $img.Height)

      $font = New-Object System.Drawing.Font($FontName, $FontSizePx, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
      $textBrush = New-Object System.Drawing.SolidBrush((New-Color $style.text_color @(255, 255, 255, 255)))

      $shadowEnabled = $true
      $shadowX = 3
      $shadowY = 3
      if ($style -and $style.shadow) {
        if ($null -ne $style.shadow.enabled) { $shadowEnabled = [bool]$style.shadow.enabled }
        if ($null -ne $style.shadow.offset_x) { $shadowX = [int]$style.shadow.offset_x }
        if ($null -ne $style.shadow.offset_y) { $shadowY = [int]$style.shadow.offset_y }
      }
      if ($shadowEnabled) {
        $shadowBrush = New-Object System.Drawing.SolidBrush((New-Color $style.shadow.color @(150, 0, 0, 0)))
        $g.DrawString($Title, $font, $shadowBrush, $TitleX + $shadowX, $TitleY + $shadowY)
        $shadowBrush.Dispose()
      }
      $g.DrawString($Title, $font, $textBrush, $TitleX, $TitleY)

      $components = @(
        [PSCustomObject]@{ type = "rect"; x = 50; y = 104; width = 90; height = 5; color = @(255, 0, 163, 255) },
        [PSCustomObject]@{ type = "rect"; x = 145; y = 105; width = 70; height = 2; color = @(220, 87, 198, 220) }
      )
      if ($style -and $null -ne $style.components) {
        $components = @($style.components)
      } elseif ($style -and $null -ne $style.decorations) {
        # Keep older project-level title styles working unchanged.
        $components = @($style.decorations | ForEach-Object {
          [PSCustomObject]@{
            type = "rect"
            x = $_.x
            y = $_.y
            width = $_.width
            height = $_.height
            color = $_.color
          }
        })
      }

      $titleWidth = $g.MeasureString($Title, $font).Width
      foreach ($component in $components) {
        $componentType = [string](Get-ValueOrDefault $component.type "rect")
        $componentX = [int](Get-ValueOrDefault $component.x $TitleX)
        $componentY = [int](Get-ValueOrDefault $component.y ($TitleY + $FontSizePx + 20))
        $componentWidth = [int](Get-ValueOrDefault $component.width 0)
        $componentHeight = [int](Get-ValueOrDefault $component.height 2)
        if ($component.width_mode -eq "title_ratio") {
          $ratio = [double](Get-ValueOrDefault $component.width_ratio 0.25)
          $minWidth = [int](Get-ValueOrDefault $component.min_width 48)
          $maxWidth = [int](Get-ValueOrDefault $component.max_width 180)
          $componentWidth = [Math]::Max($minWidth, [Math]::Min($maxWidth, [int]($titleWidth * $ratio)))
        }
        $componentBrush = New-Object System.Drawing.SolidBrush((New-Color $component.color @(255, 0, 163, 255)))
        try {
          if ($componentType -eq "ellipse") {
            $g.FillEllipse($componentBrush, $componentX, $componentY, $componentWidth, $componentHeight)
          } else {
            $g.FillRectangle($componentBrush, $componentX, $componentY, $componentWidth, $componentHeight)
          }
        } finally {
          $componentBrush.Dispose()
        }
      }

      $font.Dispose()
      $textBrush.Dispose()

      $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $g.Dispose()
      $bmp.Dispose()
    }
  } finally {
    $img.Dispose()
  }
}

foreach ($item in $titleMap.slides) {
  $input = Join-Path $bodyPath $item.body_file
  $output = Join-Path $outPath $item.output_file
  Add-Title -InputPath $input -OutputPath $output -Title $item.title
  Write-Output $output
}
