$log = "J:\ceshi\capture_log.txt"
$shotDir = "J:\ceshi\frames"
New-Item -ItemType Directory -Force -Path $shotDir | Out-Null
Remove-Item $log -ErrorAction SilentlyContinue
$start = Get-Date
$duration = 300  # 5 minutes
$i = 0
while ((Get-Date) -lt $start.AddSeconds($duration)) {
  $i++
  $ts = Get-Date -Format "HH:mm:ss"
  $shot = "$shotDir\f$i.png"
  $out = "$shotDir\f$i.txt"
  node "J:\ceshi\obsctl.mjs" ws://127.0.0.1:4455 shot "CWhgJ6SPnBeFY3yt" $shot 2>$null | Out-Null
  powershell -NoProfile -ExecutionPolicy Bypass -File "J:\ceshi\ocr.ps1" -ImagePath $shot -OutFile $out 2>$null | Out-Null
  $text = ""
  if (Test-Path $out) { $text = (Get-Content $out -Encoding UTF8 -Raw).Trim() }
  Add-Content -Path $log -Value ("[$ts] " + $text) -Encoding UTF8
  Start-Sleep -Seconds 8
}
Write-Output "CAPTURE_DONE frames=$i"
