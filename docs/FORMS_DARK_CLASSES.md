# Guide de Classes CSS pour Formulaires Dark Mode

## 🎨 Classes à utiliser pour les formulaires

### Container de formulaire
```tsx
className="bg-gray-800 border border-gray-700 rounded-lg p-6"
```

### Labels
```tsx
className="block text-sm font-medium text-gray-300 mb-2"
```

### Inputs text
```tsx
className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
```

### Select
```tsx
className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
```

### Textarea
```tsx
className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
```

### Helper text
```tsx
className="mt-1 text-sm text-gray-400"
```

### Section info (badges)
```tsx
className="p-4 bg-gray-700/50 rounded-lg"
```

### Titres de section
```tsx
className="text-lg font-semibold text-white mb-4"
```

### Messages d'erreur
```tsx
className="p-4 bg-red-900/20 border border-red-500 rounded-lg"
className="text-red-400 text-sm"
```

### Messages de succès
```tsx
className="p-4 bg-green-900/20 border border-green-500 rounded-lg"
className="text-green-400 text-sm"
```

## ✅ Checklist pour chaque formulaire

- [ ] Container : `bg-gray-800 border-gray-700`
- [ ] Labels : `text-gray-300`
- [ ] Inputs : `bg-gray-700 border-gray-600 text-white`
- [ ] Placeholders : `placeholder-gray-400`
- [ ] Helper text : `text-gray-400`
- [ ] Titres : `text-white`
- [ ] Sections info : `bg-gray-700/50`
- [ ] Contraste visible sur tous les champs

## 🔧 Exemple complet d'un input

```tsx
<div>
  <label 
    htmlFor="title" 
    className="block text-sm font-medium text-gray-300 mb-2"
  >
    Titre *
  </label>
  <input
    type="text"
    id="title"
    name="title"
    required
    placeholder="Entrez un titre"
    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
  <p className="mt-1 text-sm text-gray-400">
    Le titre sera affiché en haut de la page
  </p>
</div>
```
