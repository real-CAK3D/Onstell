param(
  [string]$Version = "latest"
)

$Repo = "real-CAK3D/Onstell"
$Arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { throw "Unsupported Windows architecture" }
$Asset = "Onstell-Setup-Windows-$Arch.exe"

if ($Version -eq "latest") {
  $Url = "https://github.com/$Repo/releases/latest/download/$Asset"
} else {
  $Url = "https://github.com/$Repo/releases/download/$Version/$Asset"
}

Write-Host "Onstell installer bootstrap"
Write-Host "Repository: $Repo"
Write-Host "Version: $Version"
Write-Host "This script is not active until Onstell release assets exist."
Write-Host "Planned asset: $Asset"
Write-Host "Planned URL: $Url"

