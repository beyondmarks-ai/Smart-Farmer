$ErrorActionPreference = "Stop"
$raw = aws secretsmanager get-secret-value --secret-id smart-farmer/external-apis --query SecretString --output text
$data = [ordered]@{}
[regex]::Matches($raw, '(?:\{|,)\s*([A-Z_]+)\s*:\s*([^,\}]+)') | ForEach-Object {
  $data[$_.Groups[1].Value] = $_.Groups[2].Value.Trim().Trim('"').Trim("'")
}
Get-Content -LiteralPath (Join-Path $env:USERPROFILE '.razorpay\config.yaml') | ForEach-Object {
  if ($_ -match '^\s*(key_id|key_secret):\s*["'']?([^"'']+?)["'']?\s*$') {
    $data['RAZORPAY_' + $matches[1].ToUpper()] = $matches[2].Trim()
  }
}
$required = 'WEATHER_API_KEY','MANDI_API_KEY','MANDI_RESOURCE_ID','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET'
$missing = $required | Where-Object { -not $data[$_] }
if ($missing) { throw "Missing secret fields: $($missing -join ',')" }
$temp = Join-Path $env:TEMP "smart-farmer-secret-$([guid]::NewGuid().ToString('N')).json"
try {
  [IO.File]::WriteAllText($temp, ($data | ConvertTo-Json -Compress), [Text.UTF8Encoding]::new($false))
  aws secretsmanager put-secret-value --secret-id smart-farmer/external-apis --secret-string "file://$temp" --query VersionId --output text | Out-Null
} finally {
  Remove-Item -LiteralPath $temp -Force -ErrorAction SilentlyContinue
}
$check = aws secretsmanager get-secret-value --secret-id smart-farmer/external-apis --query SecretString --output text | ConvertFrom-Json
if ($required | Where-Object { -not $check.$_ }) { throw 'Secret validation failed' }
Write-Output 'SECRET_REPAIRED'
