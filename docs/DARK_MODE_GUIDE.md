# Theme Dark Admin - Guide de conversion

## Palette de couleurs

### Backgrounds
- `bg-white` → `bg-gray-800`
- `bg-gray-50` → `bg-gray-900`
- `bg-gray-100` → `bg-gray-800`
- `hover:bg-gray-50` → `hover:bg-gray-750` (ou `hover:bg-gray-700`)

### Text
- `text-gray-900` → `text-white`
- `text-gray-700` → `text-gray-200`
- `text-gray-600` → `text-gray-400`
- `text-gray-500` → `text-gray-500` (inchangé)

### Borders
- `border-gray-200` → `border-gray-700`
- `border-gray-300` → `border-gray-600`

### Inputs & Forms
- `bg-white` (input) → `bg-gray-700`
- `border-gray-300` (input) → `border-gray-600`
- `text-gray-900` (input) → `text-white`
- `focus:ring-blue-500` → `focus:ring-blue-500` (inchangé)

### Buttons
- Primary: `bg-blue-600` + `hover:bg-blue-700` (inchangé)
- Secondary: `bg-gray-100 text-gray-700` → `bg-gray-700 text-gray-200`
- Danger: `text-red-600` → `text-red-400`

### Status badges
- Success: `bg-green-100 text-green-800` → `bg-green-900/30 text-green-400`
- Info: `bg-blue-100 text-blue-800` → `bg-blue-900/30 text-blue-400`
- Warning: `bg-yellow-100 text-yellow-800` → `bg-yellow-900/30 text-yellow-400`

## Classes CSS personnalisées

### Scrollbar (déjà dans globals.css)
```css
.admin-dark ::-webkit-scrollbar {
  width: 10px;
}
.admin-dark ::-webkit-scrollbar-track {
  @apply bg-gray-800;
}
.admin-dark ::-webkit-scrollbar-thumb {
  @apply bg-gray-600 rounded;
}
```

### Hover effect subtil
`hover:bg-gray-750` peut être simulé avec `hover:bg-gray-700/50`

## Composants convertis

✅ `app/admin/layout.tsx` - Layout principal
✅ `app/admin/page.tsx` - Dashboard

⏳ À convertir (utilisez ce guide):
- `app/admin/sites/**`
- `app/admin/content/**`
- `app/admin/terms/**`
- `app/admin/media/**`
- Tous les composants clients

## Script de remplacement rapide (search & replace)

Dans VS Code, utilisez "Replace in Files" (`Ctrl+Shift+H`) avec Regex activé:

### Backgrounds
```
Search: className="([^"]*)\bbg-white\b
Replace: className="$1bg-gray-800
```

### Text colors
```
Search: text-gray-900
Replace: text-white
---
Search: text-gray-600
Replace: text-gray-400
```

### Borders
```
Search: border-gray-200
Replace: border-gray-700
```

**Note**: Testez sur un seul fichier d'abord !
