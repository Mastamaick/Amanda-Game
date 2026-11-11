param([string]$Dir, [int]$Max = 220)
Add-Type -AssemblyName System.Drawing
foreach ($f in Get-ChildItem $Dir -Filter *.png) {
  $im = [System.Drawing.Image]::FromFile($f.FullName); $s = [math]::Min(1.0, $Max / [math]::Max($im.Width, $im.Height))
  $w = [int]($im.Width*$s); $h = [int]($im.Height*$s)
  $b = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($b); $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($im, 0, 0, $w, $h); $g.Dispose(); $im.Dispose(); $b.Save($f.FullName, [System.Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
  "$($f.Name) ${w}x${h}"
}
