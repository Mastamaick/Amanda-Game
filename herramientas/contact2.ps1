param([string]$Dir, [string]$Out)
Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem $Dir -Filter *.png | Sort-Object Name
$cols = 6; $cell = 180; $rows = [math]::Ceiling($files.Count / $cols)
$bmp = New-Object System.Drawing.Bitmap ($cols*$cell), ($rows*$cell)
$g = [System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::FromArgb(120,200,120))
$i = 0
foreach ($f in $files) { $im = [System.Drawing.Image]::FromFile($f.FullName); $s = [math]::Min(($cell-10)/$im.Width, ($cell-10)/$im.Height)
  $x = ($i % $cols)*$cell + 5; $y = [math]::Floor($i / $cols)*$cell + 5
  $g.DrawImage($im, [int]$x, [int]$y, [int]($im.Width*$s), [int]($im.Height*$s)); $im.Dispose(); $i++ }
$bmp.Save($Out)
