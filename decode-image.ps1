# Script to generate and save an Imagen image
# Usage: .\decode-image.ps1

$TOKEN = gcloud auth print-access-token

Write-Host "🎨 Generating image with Imagen 3..." -ForegroundColor Cyan

$response = curl.exe -s -X POST `
  "https://us-central1-aiplatform.googleapis.com/v1/projects/nestify-474408/locations/us-central1/publishers/google/models/imagen-3.0-generate-002:predict" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{\"instances\": [{\"prompt\": \"A cute watercolor illustration of a happy rabbit in a garden with flowers\"}], \"parameters\": {\"sampleCount\": 1, \"aspectRatio\": \"1:1\"}}'

# Parse JSON response
$jsonResponse = $response | ConvertFrom-Json

# Extract base64 image data
if ($jsonResponse.predictions) {
    $base64Image = $jsonResponse.predictions[0].bytesBase64Encoded
    
    Write-Host "✅ Image generated successfully!" -ForegroundColor Green
    Write-Host "📁 Saving to generated-image.png..." -ForegroundColor Yellow
    
    # Convert base64 to bytes and save as PNG
    $imageBytes = [Convert]::FromBase64String($base64Image)
    [System.IO.File]::WriteAllBytes("generated-image.png", $imageBytes)
    
    Write-Host "🎉 Image saved as 'generated-image.png'" -ForegroundColor Green
    Write-Host "📂 Opening image..." -ForegroundColor Yellow
    
    # Open the image in default viewer
    Start-Process "generated-image.png"
} else {
    Write-Host "❌ Error: No image data in response" -ForegroundColor Red
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host $response
}

