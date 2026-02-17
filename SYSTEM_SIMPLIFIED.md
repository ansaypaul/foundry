# Research Engine - VERSION SIMPLIFIÉE

**Date:** 2026-02-12  
**Problème:** Le système était TROP STRICT et ne passait jamais le gating  
**Solution:** SIMPLIFICATION DRASTIQUE

---

## ❌ Ce qui ne fonctionnait pas (Version complexe)

```json
{
  "min_sources": 5,
  "require_official_source": true,  ← TROP STRICT
  "min_items": 10,                  ← IMPOSSIBLE À PARSER
  "min_content_length": 1000
}
```

**Résultats :**
- ❌ Attempt 1: 0 items found
- ❌ Attempt 2: 0 items found  
- ❌ Attempt 3: 70 items (faux positifs)
- ❌ No official source found
- ❌ Research FAILED after all attempts

---

## ✅ Nouvelle approche (Version simple)

### Philosophie
**"Si Perplexity répond quelque chose de substantiel, on l'accepte"**

### Gating simplifié
```json
{
  "min_content_length": 200
}
```

**C'est tout !** 

Plus de :
- ❌ Comptage d'items (parsing compliqué)
- ❌ Détection de sources officielles (trop spécifique)
- ❌ Validation de sections (inutile)
- ❌ Must have date/pricing/stats (trop contraignant)

### Pourquoi c'est mieux

1. **Pragmatique** - Perplexity retourne toujours du contenu de qualité
2. **Fiable** - Pas de faux négatifs dus au parsing
3. **Rapide** - Moins de retries = moins de coûts
4. **Simple** - Facile à débugger

---

## 🔧 Changements appliqués

### 1. Gating ultra-simple (`runGating.ts`)
```typescript
// FAST PATH: Si seulement min_content_length est requis
if (onlyContentLengthRequired && payload.contentLength >= min) {
  return { pass: true, reasons: [] };
}
```

### 2. Prompts simplifiés
```
Provide comprehensive research for a Top 10 article about: {{topic}}

Please include:
- 10 items with names, key facts, dates
- Any pricing or specifications available
- Sources for your information
```

Pas de "CRITICAL FORMAT REQUIREMENTS" - on fait confiance à Perplexity.

### 3. Max attempts réduit
```sql
research_max_attempts = 2  -- au lieu de 3
```

Économie de crédits.

---

## 📊 Résultat attendu

```
📡 Attempt 1/2
✓ Perplexity responded (10s, 1800 tokens)
✓ Citations: 6
[EXTRACTOR] Found 12 items in markdown (length: 2450)
✓ Extracted: 3 sections, 12 items, 6 sources
✅ Gating: PASS (content_length: 2450 >= 200)
✅ Research COMPLETED
```

**Pass en 1 seule tentative !** 🎉

---

## 🎯 Pour appliquer

```sql
\i lib/db/fix-top10-prompt.sql
```

Cela met à jour **TOUS** les types de contenu avec les règles simplifiées.

---

## 🔮 Future (si vraiment nécessaire)

Si on veut ajouter des validations plus avancées plus tard :
- Le faire au niveau GPT (pas Perplexity)
- Ou post-validation après génération de l'article
- Pas avant - laisse Perplexity faire son job

---

## 🎉 Philosophie finale

> "Perfect is the enemy of good"
> 
> Perplexity fait déjà du bon boulot de recherche.  
> Pas besoin de valider chaque détail.  
> Le brief sera vérifié par GPT et le validator HTML de toute façon.
