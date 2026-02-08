# Script de conversion automatique vers Dark Mode
# Usage: .\convert-to-dark.ps1

$files = Get-ChildItem -Path "app\admin" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Backgrounds
    $content = $content -replace 'bg-white\b', 'bg-gray-800'
    $content = $content -replace 'bg-gray-50\b', 'bg-gray-900'
    $content = $content -replace 'bg-gray-100\b', 'bg-gray-800'
    $content = $content -replace 'hover:bg-gray-50\b', 'hover:bg-gray-700'
    
    # Text colors
    $content = $content -replace 'text-gray-900\b', 'text-white'
    $content = $content -replace 'text-gray-700\b', 'text-gray-200'
    $content = $content -replace 'text-gray-600\b', 'text-gray-400'
    
    # Borders
    $content = $content -replace 'border-gray-200\b', 'border-gray-700'
    $content = $content -replace 'border-gray-300\b', 'border-gray-600'
    
    # Status colors (keep vibrant for contrast)
    # Blue badges
    $content = $content -replace 'bg-blue-100 text-blue-800', 'bg-blue-900/20 text-blue-400'
    # Green badges
    $content = $content -replace 'bg-green-100 text-green-800', 'bg-green-900/20 text-green-400'
    # Purple badges
    $content = $content -replace 'bg-purple-100 text-purple-800', 'bg-purple-900/20 text-purple-400'
    # Gray badges
    $content = $content -replace 'bg-gray-100 text-gray-800', 'bg-gray-700 text-gray-300'
    
    Set-Content $file.FullName $content -NoNewline
    Write-Host "Converti: $($file.Name)"
}

Write-Host "`nConversion terminée ! Vérifiez les fichiers avant de commit."
