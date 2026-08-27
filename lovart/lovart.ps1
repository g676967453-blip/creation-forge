# Lovart Agent client wrapper
# Usage: .\lovart.ps1 query-mode
#        .\lovart.ps1 chat --prompt "draw a cat" --json --download
#        .\lovart.ps1 projects / threads / config / create-project ...
# Reads credentials & proxy from .env, then calls official agent_skill.py

$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
  # Explicit UTF-8 read: PS 5.1 Get-Content defaults to ANSI and mangles UTF-8 comments
  [System.IO.File]::ReadAllLines($envFile, [System.Text.Encoding]::UTF8) | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z0-9_]+)=(.*)$') {
      [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim('"'), "Process")
    }
  }
}

# Proxy: prefer LOVART_PROXY from .env; do not override external HTTPS_PROXY
if (-not $env:HTTPS_PROXY -and $env:LOVART_PROXY) { $env:HTTPS_PROXY = $env:LOVART_PROXY }

$agentScript = Join-Path $PSScriptRoot "..\lovart-skill\skills\lovart-skill\scripts\agent_skill.py"
if (-not (Test-Path $agentScript)) { $agentScript = "J:\ceshi\lovart-skill\skills\lovart-skill\scripts\agent_skill.py" }

if (-not $env:LOVART_ACCESS_KEY -or -not $env:LOVART_SECRET_KEY) {
  Write-Error "Missing LOVART_ACCESS_KEY / LOVART_SECRET_KEY (check .env)"
  exit 1
}

python $agentScript @args
exit $LASTEXITCODE
