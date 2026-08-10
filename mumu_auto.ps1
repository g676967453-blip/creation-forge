# MUMU Auto Play Script
# Duration: 30 minutes. Captures screenshots, records screen segments, and simulates taps.

$adb = "G:\MuMu Player 12\nx_main\adb.exe"
$device = "127.0.0.1:16416"
$durationMinutes = 30
$outDir = "J:\ceshi\mumu_auto_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
"Output directory: $outDir" | Out-File -FilePath "$outDir\log.txt" -Append

$startTime = Get-Date
$screenshotIndex = 0

# Background screen recording job
$recordJob = Start-Job -ScriptBlock {
    param($adb, $device, $outDir)
    $index = 0
    while ($true) {
        $remoteFile = "/sdcard/record_$($index.ToString('D3')).mp4"
        $localFile = Join-Path $outDir "record_$($index.ToString('D3')).mp4"
        & $adb -s $device shell screenrecord --time-limit 180 --bit-rate 4000000 $remoteFile
        Start-Sleep -Seconds 1
        & $adb -s $device pull $remoteFile $localFile | Out-Null
        & $adb -s $device shell rm $remoteFile | Out-Null
        $index++
    }
} -ArgumentList $adb, $device, $outDir

"Screen recording started" | Out-File -FilePath "$outDir\log.txt" -Append

try {
    while (((Get-Date) - $startTime).TotalMinutes -lt $durationMinutes) {
        $elapsed = [math]::Round(((Get-Date) - $startTime).TotalMinutes, 1)
        $screenshotFile = Join-Path $outDir "screen_$($screenshotIndex.ToString('D4')).png"

        # Capture screenshot
        & $adb -s $device shell screencap -p /sdcard/auto_screen.png | Out-Null
        & $adb -s $device pull /sdcard/auto_screen.png $screenshotFile | Out-Null

        # Random tap in lower screen area
        $x = Get-Random -Minimum 100 -Maximum 1000
        $y = Get-Random -Minimum 900 -Maximum 1700
        & $adb -s $device shell input tap $x $y | Out-Null

        # Occasional swipe
        if ($screenshotIndex % 10 -eq 0) {
            $x1 = Get-Random -Minimum 200 -Maximum 800
            $y1 = Get-Random -Minimum 1000 -Maximum 1500
            $x2 = Get-Random -Minimum 200 -Maximum 800
            $y2 = Get-Random -Minimum 1000 -Maximum 1500
            & $adb -s $device shell input swipe $x1 $y1 $x2 $y2 200 | Out-Null
        }

        "[$elapsed min] Screenshot $screenshotIndex, tap ($x, $y)" | Out-File -FilePath "$outDir\log.txt" -Append

        $screenshotIndex++
        Start-Sleep -Seconds 5
    }
}
finally {
    "30 minutes reached, stopping recording" | Out-File -FilePath "$outDir\log.txt" -Append
    Stop-Job $recordJob -ErrorAction SilentlyContinue
    Remove-Job $recordJob -ErrorAction SilentlyContinue

    Start-Sleep -Seconds 5
    $remoteFiles = & $adb -s $device shell ls /sdcard/record_*.mp4 2>$null
    if ($remoteFiles) {
        foreach ($rf in $remoteFiles -split "\r?\n") {
            $rf = $rf.Trim()
            if ($rf -match 'record_(\d{3})\.mp4') {
                $idx = $matches[1]
                $localFile = Join-Path $outDir "record_$idx.mp4"
                & $adb -s $device pull $rf $localFile | Out-Null
                & $adb -s $device shell rm $rf | Out-Null
            }
        }
    }
}

"Script completed. Output directory: $outDir" | Out-File -FilePath "$outDir\log.txt" -Append
