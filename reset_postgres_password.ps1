# PostgreSQL Password Reset Script
# This script will update the postgres user password to 'postgres'

$ErrorActionPreference = "Stop"
$pgPath = "C:\Program Files\PostgreSQL\18"
$pgDataPath = "$pgPath\data"
$pgHbaConfig = "$pgDataPath\pg_hba.conf"
$pgHbaBackup = "$pgDataPath\pg_hba.conf.backup"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Password Reset Script" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Backup pg_hba.conf
Write-Host "[1/7] Backing up pg_hba.conf..." -ForegroundColor Yellow
try {
    Copy-Item -Path $pgHbaConfig -Destination $pgHbaBackup -Force
    Write-Host "✅ Backup created: $pgHbaBackup" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to backup pg_hba.conf: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Stop PostgreSQL service
Write-Host ""
Write-Host "[2/7] Stopping PostgreSQL service..." -ForegroundColor Yellow
try {
    Stop-Service -Name "postgresql-x64-18" -Force
    Start-Sleep -Seconds 2
    Write-Host "✅ PostgreSQL service stopped" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to stop service: $_" -ForegroundColor Red
    Write-Host "⚠️  Restoring backup..." -ForegroundColor Yellow
    Copy-Item -Path $pgHbaBackup -Destination $pgHbaConfig -Force
    exit 1
}

# Step 3: Modify pg_hba.conf to allow trust authentication
Write-Host ""
Write-Host "[3/7] Modifying pg_hba.conf for temporary access..." -ForegroundColor Yellow
try {
    $content = Get-Content $pgHbaConfig
    $newContent = $content -replace 'scram-sha-256', 'trust'
    $newContent | Set-Content $pgHbaConfig
    Write-Host "✅ pg_hba.conf modified (all connections set to 'trust')" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to modify pg_hba.conf: $_" -ForegroundColor Red
    Write-Host "⚠️  Restoring backup..." -ForegroundColor Yellow
    Copy-Item -Path $pgHbaBackup -Destination $pgHbaConfig -Force
    Start-Service -Name "postgresql-x64-18"
    exit 1
}

# Step 4: Start PostgreSQL service
Write-Host ""
Write-Host "[4/7] Starting PostgreSQL service..." -ForegroundColor Yellow
try {
    Start-Service -Name "postgresql-x64-18"
    Start-Sleep -Seconds 5
    Write-Host "✅ PostgreSQL service started" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start service: $_" -ForegroundColor Red
    Write-Host "⚠️  Restoring backup..." -ForegroundColor Yellow
    Copy-Item -Path $pgHbaBackup -Destination $pgHbaConfig -Force
    exit 1
}

# Step 5: Update password
Write-Host ""
Write-Host "[5/7] Updating postgres user password..." -ForegroundColor Yellow
try {
    $psqlPath = "$pgPath\bin\psql.exe"
    $result = & $psqlPath -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Password updated successfully to 'postgres'" -ForegroundColor Green
    } else {
        throw "psql command failed: $result"
    }
} catch {
    Write-Host "❌ Failed to update password: $_" -ForegroundColor Red
    Write-Host "⚠️  Restoring backup and restarting service..." -ForegroundColor Yellow
    Stop-Service -Name "postgresql-x64-18" -Force
    Copy-Item -Path $pgHbaBackup -Destination $pgHbaConfig -Force
    Start-Service -Name "postgresql-x64-18"
    exit 1
}

# Step 6: Restore pg_hba.conf security settings
Write-Host ""
Write-Host "[6/7] Restoring pg_hba.conf security settings..." -ForegroundColor Yellow
try {
    Copy-Item -Path $pgHbaBackup -Destination $pgHbaConfig -Force
    Write-Host "✅ Security settings restored" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to restore pg_hba.conf: $_" -ForegroundColor Red
    exit 1
}

# Step 7: Restart PostgreSQL service
Write-Host ""
Write-Host "[7/7] Restarting PostgreSQL service..." -ForegroundColor Yellow
try {
    Restart-Service -Name "postgresql-x64-18" -Force
    Start-Sleep -Seconds 3
    Write-Host "✅ PostgreSQL service restarted" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to restart service: $_" -ForegroundColor Red
    exit 1
}

# Step 8: Verify new password
Write-Host ""
Write-Host "[8/8] Verifying new password..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "postgres"
    $psqlPath = "$pgPath\bin\psql.exe"
    $result = & $psqlPath -U postgres -d postgres -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Password verification successful!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Password may not be updated correctly" -ForegroundColor Yellow
        Write-Host "Result: $result" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not verify password: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✅ PASSWORD UPDATE COMPLETE!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "New PostgreSQL password: postgres" -ForegroundColor Green
Write-Host "Backup file: $pgHbaBackup" -ForegroundColor Gray
Write-Host ""
Write-Host "You can now start the backend server!" -ForegroundColor Yellow
Write-Host ""
