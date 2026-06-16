param(
  [Parameter(Mandatory=$true)]
  [string]$OutputPath,

  [int]$CanvasWidth = 1600,
  [int]$CanvasHeight = 900,
  [int]$TitleZoneWidth = 720,
  [int]$TitleZoneHeight = 144,
  [int]$ContentLeft = 50,
  [int]$ContentTop = 180,
  [int]$ContentRight = 1550,
  [int]$ContentBottom = 830
)

Add-Type -AssemblyName System.Drawing

$parent = Split-Path -Parent $OutputPath
if ($parent) {
  New-Item -ItemType Directory -Path $parent -Force | Out-Null
}

$bmp = New-Object System.Drawing.Bitmap $CanvasWidth, $CanvasHeight
$g = [System.Drawing.Graphics]::FromImage($bmp)
try {
  $g.Clear([System.Drawing.Color]::FromArgb(255, 245, 247, 250))
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  $titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(80, 0, 163, 255))
  $contentPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 44, 110, 160), 3)
  $startPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 224, 120, 30), 3)
  $bottomPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 190, 60, 60), 3)
  $font = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 35, 50, 70))
  try {
    $g.FillRectangle($titleBrush, 0, 0, $TitleZoneWidth, $TitleZoneHeight)
    $g.DrawRectangle($contentPen, $ContentLeft, $ContentTop, $ContentRight - $ContentLeft, $ContentBottom - $ContentTop)
    $g.DrawLine($startPen, $ContentLeft, $ContentTop, $ContentRight, $ContentTop)
    $g.DrawLine($bottomPen, $ContentLeft, $ContentBottom, $ContentRight, $ContentBottom)
    $g.DrawString("TITLE EXCLUSION ZONE", $font, $textBrush, 24, 24)
    $g.DrawString("FIRST BODY MODULE START", $font, $textBrush, $ContentLeft + 12, $ContentTop + 10)
    $g.DrawString("BOTTOM SAFE LINE", $font, $textBrush, $ContentLeft + 12, $ContentBottom - 34)
  } finally {
    $titleBrush.Dispose()
    $contentPen.Dispose()
    $startPen.Dispose()
    $bottomPen.Dispose()
    $font.Dispose()
    $textBrush.Dispose()
  }

  $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $g.Dispose()
  $bmp.Dispose()
}

Write-Output $OutputPath
