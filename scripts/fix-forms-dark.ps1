# Script pour corriger les inputs sur fond dark
# Corrige les inputs blancs qui ne se voient pas

$files = Get-ChildItem -Path "app\admin" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Corriger les containers de formulaires
    $content = $content -replace 'className="([^"]*\s)?bg-white(\s[^"]*)"', 'className="$1bg-gray-800 border-gray-700$2"'
    $content = $content -replace 'className="bg-white"', 'className="bg-gray-800 border border-gray-700"'
    
    # Corriger les labels
    $content = $content -replace 'text-gray-700(\s+mb-2)', 'text-gray-300$1'
    
    # Corriger les inputs
    $content = $content -replace 'border-gray-300(\s+rounded)', 'bg-gray-700 border-gray-600 text-white placeholder-gray-400$1'
    
    # Corriger les selects
    $content = $content -replace '(className="[^"]*)(border border-gray-300)([^"]*")', '$1bg-gray-700 border-gray-600 text-white$3'
    
    # Corriger les textareas
    $content = $content -replace '(textarea[^>]*className="[^"]*)(border border-gray-300)([^"]*")', '$1bg-gray-700 border-gray-600 text-white placeholder-gray-400$3'
    
    # Corriger les helper texts
    $content = $content -replace 'text-gray-500(\s+mt-)', 'text-gray-400$1'
    
    # Corriger les badges de statut dans les infos
    $content = $content -replace 'bg-gray-50(\s+rounded)', 'bg-gray-700/50$1'
    $content = $content -replace 'text-sm text-gray-600"', 'text-sm text-gray-400"'
    $content = $content -replace 'font-medium">([^<]+)</p>', 'font-medium text-white">$1</p>'
    
    Set-Content $file.FullName $content -Encoding UTF8
    Write-Host "Corrigé: $($file.Name)" -ForegroundColor Green
}

Write-Host "`n✅ Correction terminée ! Tous les formulaires sont maintenant lisibles en dark mode." -ForegroundColor Cyan
