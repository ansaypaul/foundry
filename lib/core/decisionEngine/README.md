# Decision Engine

Module de décision centralisé pour calculer le profil d'un site basé sur ses paramètres.

## Inputs

- `siteType`: niche_passion | news_media | gaming_popculture | affiliate_guides | lifestyle
- `automationLevel`: manual | ai_assisted | ai_auto
- `ambitionLevel`: auto | starter | growth | factory (default: auto)
- `language`: code ISO (ex: fr, en)
- `country`: code ISO (ex: FR, US)
- `description`: texte optionnel

## Outputs

```typescript
{
  siteSize: "small" | "medium" | "large",
  complexity: 1 | 2 | 3,
  velocity: "low" | "medium" | "high",
  targets: {
    authors: { min, max },
    categories: { min, max },
    contentTypes: { min, max },
    mandatoryPages: { min, max }
  },
  rationale: string[]
}
```

## Utilisation

```typescript
import { computeSiteDecisionProfile } from '@/lib/core/decisionEngine/siteDecisionEngine';

const profile = computeSiteDecisionProfile({
  siteType: 'niche_passion',
  automationLevel: 'ai_auto',
  ambitionLevel: 'auto',
  language: 'fr',
  country: 'FR'
});

console.log(profile.siteSize); // "medium"
console.log(profile.targets.authors); // { min: 3, max: 5 }
```

## Tests

```bash
npm test -- siteDecisionEngine.test.ts
```
