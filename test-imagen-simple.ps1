# Simple PowerShell script to test Imagen 3
# Run this: .\test-imagen-simple.ps1

$TOKEN = gcloud auth print-access-token

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    instances = @(
        @{
            prompt = "A cute watercolor illustration of a happy rabbit in a garden"
        }
    )
    parameters = @{
        sampleCount = 1
        aspectRatio = "1:1"
    }
} | ConvertTo-Json -Depth 5

$url = "https://us-central1-aiplatform.googleapis.com/v1/projects/nestify-474408/locations/us-central1/publishers/google/models/imagen-3.0-generate-002:predict"

Write-Host "Testing Imagen endpoint..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host "Details:" $_.ErrorDetails.Message
    }
}

