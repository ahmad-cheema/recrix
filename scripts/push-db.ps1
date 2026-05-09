$envPath = Join-Path (Get-Location) ".env.local"

if (-not (Test-Path $envPath)) {
  Write-Error "Missing .env.local"
  exit 1
}

$raw = Get-Content $envPath -Raw
$envMap = @{}

foreach ($line in ($raw -split "`r?`n")) {
  $trim = $line.Trim()
  if (-not $trim) { continue }
  if ($trim.StartsWith("#")) { continue }
  $eq = $trim.IndexOf("=")
  if ($eq -lt 0) { continue }
  $key = $trim.Substring(0, $eq).Trim()
  $value = $trim.Substring($eq + 1).Trim()
  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  } elseif ($value.StartsWith("'") -and $value.EndsWith("'")) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  $envMap[$key] = $value
}

$dbUrl = $envMap["DATABASE_URL"]
if (-not $dbUrl) { $dbUrl = $envMap["SUPABASE_DB_URL"] }
if (-not $dbUrl) { $dbUrl = $envMap["SUPABASE_CONNECTION_STRING"] }
if (-not $dbUrl) { $dbUrl = $envMap["POSTGRES_URL"] }
if (-not $dbUrl) { $dbUrl = $envMap["POSTGRESQL_URL"] }
if (-not $dbUrl) { $dbUrl = $envMap["SUPABASE_DATABASE_URL"] }
if (-not $dbUrl) {
  $candidate = $envMap["NEXT_PUBLIC_SUPABASE_URL"]
  if ($candidate -and $candidate -match "^postgres(ql)?://") {
    $dbUrl = $candidate
  }
}

if (-not $dbUrl) {
  Write-Error "No database connection string found. Add DATABASE_URL (recommended) in .env.local."
  exit 1
}

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  Write-Error "psql not found. Install PostgreSQL client tools (psql) and retry."
  exit 1
}

Write-Host "Running schema.sql"
psql -v ON_ERROR_STOP=1 $dbUrl -f "supabase/schema.sql"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Running seed.sql"
psql -v ON_ERROR_STOP=1 $dbUrl -f "supabase/seed.sql"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
