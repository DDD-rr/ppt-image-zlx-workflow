param(
  [Parameter(Mandatory=$true)]
  [string]$ProjectDir,

  [Parameter(Mandatory=$true)]
  [string]$TitleMapPath,

  [string]$BodyDir = "body_image",
  [string]$OutputDir = "final_image",
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
      $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(150, 0, 0, 0))
      $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
      $blueBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0, 163, 255))
      $mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 87, 198, 220))

      $g.DrawString($Title, $font, $shadowBrush, $TitleX + 3, $TitleY + 3)
      $g.DrawString($Title, $font, $textBrush, $TitleX, $TitleY)
      $g.FillRectangle($blueBrush, 50, 104, 90, 5)
      $g.FillRectangle($mutedBrush, 145, 105, 70, 2)

      $font.Dispose()
      $shadowBrush.Dispose()
      $textBrush.Dispose()
      $blueBrush.Dispose()
      $mutedBrush.Dispose()

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
