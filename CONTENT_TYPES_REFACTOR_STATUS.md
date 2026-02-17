# Content Types Refactor - Status & Implementation Guide

## 📊 Progress Overview

**Completed: 5/13 tasks (38%)**

### ✅ Phase 1: Database & Schema (COMPLETED)

1. **Migration SQL** ✅
   - Created `migration-editorial-content-types.sql`
   - Tables: `editorial_content_types`, `site_content_type_settings`
   - Added `content_type_id` to `content` table
   - Deprecated old `content_types` table

2. **Seed Data** ✅
   - Created `seed-editorial-content-types.sql`
   - 10 core content types with complete specs:
     - `top10` - Top 10 lists (exactly 10 H2, 1200+ words)
     - `news` - Short news articles (400-800 words, 2-4 H2)
     - `guide` - Comprehensive guides (1500+ words, 4-8 H2)
     - `howto` - Step-by-step tutorials (1000+ words, 3-6 H2)
     - `review` - Product/content reviews (1200+ words, 4-6 H2)
     - `comparison` - Comparative articles (1400+ words, 5-7 H2)
     - `interview` - Interviews/portraits (1000+ words, 3-6 H2)
     - `explainer` - Explainer articles (1300+ words, 4-6 H2)
     - `opinion` - Opinion pieces (900+ words, 3-5 H2)
     - `evergreen` - Long-form evergreen (2000+ words, 6-10 H2)

   Each type includes:
   - `template_schema` (structural definition)
   - `system_prompt`, `style_prompt`, `plan_prompt`, `format_prompt`
   - `validator_profile` (validation rules)
   - `allowed_html_tags`, `forbidden_patterns`

3. **Blueprint Schema Refactor** ✅
   - Removed `contentTypes` from `BlueprintV1Schema`
   - Removed `BlueprintContentTypeSchema`
   - Updated `types.ts` and `blueprintTemplateSchema.ts`
   - Blueprint now focuses on: site, authors, taxonomy, pages, SEO

4. **Blueprint Generator Update** ✅
   - Modified `generateBlueprintTemplate.ts`
   - AI no longer generates contentTypes
   - Prompts updated to exclude contentTypes from output
   - Constraints updated (removed contentTypes counts)

5. **Apply Engine Refactor** ✅
   - Modified `applyBlueprintTemplate.ts`
   - Removed content types creation from blueprint
   - Added `initializeSiteContentTypes()` function
   - Auto-activates default types based on `site_type`:
     - news_media → news, explainer, interview, opinion
     - gaming_popculture → news, review, guide, top10
     - affiliate_guides → guide, review, comparison, top10, howto
     - lifestyle → guide, top10, howto, opinion
     - niche_passion → news, guide, review, top10, howto

---

## 🔄 Phase 2: Services & Business Logic (IN PROGRESS)

### 6. Content Type Registry Service 🔄
**File:** `lib/services/contentTypes/contentTypeRegistry.ts`

**Purpose:** Centralized service to load content types with overrides

**Functions needed:**
```typescript
// Load content type with site-specific overrides
getContentTypeForSite(siteId: string, contentTypeKey: string): Promise<ResolvedContentType>

// Load all enabled content types for a site
getEnabledContentTypes(siteId: string): Promise<ResolvedContentType[]>

// Resolve template_schema + overrides
resolveContentTypeRules(contentType, siteOverrides): ResolvedRules

// Helper: merge canonical + override values
mergeOverrides(canonical, override): Merged
```

**Data structure:**
```typescript
interface ResolvedContentType {
  id: string;
  key: string;
  label: string;
  
  // Template (merged with overrides)
  templateSchema: any;
  
  // Prompts (merged with overrides)
  systemPrompt: string;
  styleProm prompt: string;
  planPrompt: string;
  formatPrompt: string;
  
  // Validation (merged with overrides)
  validatorProfile: any;
  allowedHtmlTags: string[];
  forbiddenPatterns: string[];
  
  // Metadata
  source: 'canonical' | 'overridden';
  overrides: string[]; // List of overridden fields
}
```

### 7. Prompt Builder Service 🔄
**File:** `lib/services/contentTypes/promptBuilder.ts`

**Purpose:** Compose final AI prompts from content type + context

**Function:**
```typescript
buildPromptFromContentType(params: {
  contentType: ResolvedContentType;
  article: {
    title: string;
    angle?: string;
    category: string;
    site: string;
  };
}): {
  systemPrompt: string;  // Complete system prompt
  userPrompt: string;    // Complete user prompt
}
```

**Composition order:**
1. Platform base prompt (Foundry global rules)
2. Content type system_prompt
3. Content type format_prompt
4. Content type plan_prompt
5. Content type style_prompt
6. Article context (title, angle, category, site)
7. Template schema translated to human instructions

### 8. Validator Refactor 🔄
**File:** `lib/services/articles/articleValidator.ts`

**Changes needed:**
- Replace old rules logic with `validator_profile` from content type
- Use `template_schema` for structural validation
- Support new validation rules:
  - `h2_count_exact` (for top10)
  - `h2_count_min`/`h2_count_max`
  - `min_paragraphs_per_h2`
  - `max_lists`
  - `forbidden_substrings` (array)
- Return detailed errors with validation profile used

### 9. Article Factory Refactor 🔄
**File:** `lib/services/ai/generateArticleFromIdea.ts`

**Changes needed:**
- Replace `contentType.rulesJson` with `ResolvedContentType`
- Use `promptBuilder.buildPromptFromContentType()`
- Use new validator with `template_schema` + `validator_profile`
- Store `content_type_id` (UUID) instead of `content_type_key` (string)
- Log which content type version/config was used in AI job

---

## 🌐 Phase 3: Admin APIs (TODO)

### 10. Editorial Content Types API 📋
**File:** `app/api/admin/editorial-content-types/route.ts`

**Endpoints:**
- `GET /api/admin/editorial-content-types` - List all types
- `GET /api/admin/editorial-content-types/[key]` - Get one type
- `POST /api/admin/editorial-content-types` - Create new type (admin only)
- `PATCH /api/admin/editorial-content-types/[key]` - Update type (admin only)
- `DELETE /api/admin/editorial-content-types/[key]` - Delete type (only non-system)

**Permissions:** Super admin only

### 11. Site Content Type Settings API 📋
**File:** `app/api/admin/sites/[id]/content-type-settings/route.ts`

**Endpoints:**
- `GET /api/admin/sites/[id]/content-type-settings` - List settings for site
- `GET /api/admin/sites/[id]/content-type-settings/[key]` - Get one setting
- `PATCH /api/admin/sites/[id]/content-type-settings/[key]` - Update overrides
- `POST /api/admin/sites/[id]/content-type-settings/[key]/enable` - Enable type
- `POST /api/admin/sites/[id]/content-type-settings/[key]/disable` - Disable type

**Permissions:** Site owner or admin

---

## 🎨 Phase 4: Admin UI (TODO)

### 12. Admin UI for Content Types 📋

**Page 1: Content Types List**
- `/admin/editorial-content-types`
- Table: key, label, status, actions
- Filter: active/inactive, system/custom
- Actions: View, Edit, Duplicate

**Page 2: Content Type Editor**
- `/admin/editorial-content-types/[key]/edit`
- Tabs:
  1. **General** - label, description, status
  2. **Template** - template_schema editor (JSON with validation)
  3. **Prompts** - system_prompt, style_prompt, plan_prompt, format_prompt
  4. **Validation** - validator_profile editor (JSON)
  5. **Format** - allowed_html_tags, forbidden_patterns
- Actions: Save, Preview Prompt, Test Validation

**Page 3: Site Content Type Settings**
- `/admin/sites/[id]/content-type-settings`
- List of all content types with:
  - Enable/Disable toggle
  - Override indicator
  - Edit overrides button
- Per-type override editor:
  - Show canonical value + override field
  - "Reset to canonical" button

**Features:**
- JSON schema validation for template_schema and validator_profile
- Prompt preview (shows final composed prompt)
- Test validator (paste HTML, see validation result)
- Diff view (canonical vs override)

---

## 📦 Phase 5: Migration & Cleanup (TODO)

### 13. Retrocompatibility Migration 📋

**File:** `lib/db/migration-content-types-retrocompat.sql`

**Purpose:** Migrate existing articles to new system

**Steps:**
1. Map old `content_type_key` to new `content_type_id`:
   ```sql
   -- Create mapping function
   CREATE OR REPLACE FUNCTION map_content_type_key_to_id(key TEXT)
   RETURNS UUID AS $$
   BEGIN
     RETURN (
       SELECT id FROM editorial_content_types 
       WHERE key = CASE
         WHEN key LIKE '%top%10%' OR key LIKE '%list%' THEN 'top10'
         WHEN key LIKE '%news%' OR key LIKE '%actualit%' THEN 'news'
         WHEN key LIKE '%guide%' THEN 'guide'
         WHEN key LIKE '%how%to%' OR key LIKE '%tuto%' THEN 'howto'
         WHEN key LIKE '%review%' OR key LIKE '%test%' THEN 'review'
         WHEN key LIKE '%compar%' THEN 'comparison'
         WHEN key LIKE '%interview%' THEN 'interview'
         WHEN key LIKE '%opinion%' THEN 'opinion'
         ELSE 'evergreen'
       END
       LIMIT 1
     );
   END;
   $$ LANGUAGE plpgsql;
   
   -- Update all articles
   UPDATE content
   SET content_type_id = map_content_type_key_to_id(content_type_key)
   WHERE content_type_key IS NOT NULL
   AND content_type_id IS NULL;
   ```

2. Log unmapped types for manual review
3. Set fallback (`evergreen`) for articles that can't be mapped

---

## 🚀 How to Apply This Refactor

### Step 1: Run Migrations
```bash
# In Supabase SQL Editor, run in this order:
1. migration-editorial-content-types.sql
2. seed-editorial-content-types.sql
3. (later) migration-content-types-retrocompat.sql
```

### Step 2: Test Blueprint Generation
```bash
# Create a new site
# Generate blueprint with AI
# Verify:
# - Blueprint JSON has no contentTypes field
# - site_content_type_settings has rows for the site
# - Content types are from editorial_content_types table
```

### Step 3: Implement Services
```bash
# Complete Phase 2 (services)
# Test with existing article generation
```

### Step 4: Build Admin UI
```bash
# Complete Phase 3 (APIs) + Phase 4 (UI)
# Test editing content types and overrides
```

### Step 5: Migrate Old Data
```bash
# Run retrocompatibility migration
# Verify all articles have content_type_id
# Deprecate/remove old content_types table
```

---

## ✅ Acceptance Criteria

- [ ] New sites can be created without contentTypes in blueprint
- [ ] Content types are stable and identical across sites (from registry)
- [ ] No duplicates possible (UNIQUE key constraint)
- [ ] Users can enable/disable types per site
- [ ] Users can override rules per site
- [ ] Admin can add/edit content types via UI
- [ ] Article generation uses new prompts system
- [ ] Validator uses template_schema + validator_profile
- [ ] All AI jobs log which content type config was used
- [ ] Old articles migrated to new system (content_type_id set)
- [ ] No breaking changes for existing articles

---

## 📝 Notes

- **Key is immutable** - Never change a content type's `key` field
- **Overrides are optional** - NULL = use canonical value
- **System types protected** - `is_system=true` types cannot be deleted
- **Versioning optional** - Can add `editorial_content_type_versions` table later
- **Prompts editable** - All prompts can be edited via UI (careful with breaking changes)
- **Test thoroughly** - Each content type should be tested with real article generation

---

## 🔗 Related Files

### Database
- `lib/db/migration-editorial-content-types.sql`
- `lib/db/seed-editorial-content-types.sql`
- `lib/db/migration-content-types-retrocompat.sql` (TODO)

### Blueprint
- `lib/services/blueprint/types.ts` ✅
- `lib/services/blueprint/blueprintTemplateSchema.ts` ✅
- `lib/services/ai/generateBlueprintTemplate.ts` ✅
- `lib/services/setup/applyBlueprintTemplate.ts` ✅

### Content Types (NEW)
- `lib/services/contentTypes/contentTypeRegistry.ts` (TODO)
- `lib/services/contentTypes/promptBuilder.ts` (TODO)

### Articles
- `lib/services/ai/generateArticleFromIdea.ts` (TODO)
- `lib/services/articles/articleValidator.ts` (TODO)

### APIs (TODO)
- `app/api/admin/editorial-content-types/route.ts`
- `app/api/admin/editorial-content-types/[key]/route.ts`
- `app/api/admin/sites/[id]/content-type-settings/route.ts`
- `app/api/admin/sites/[id]/content-type-settings/[key]/route.ts`

### UI (TODO)
- `app/admin/editorial-content-types/page.tsx`
- `app/admin/editorial-content-types/[key]/edit/page.tsx`
- `app/admin/sites/[id]/content-type-settings/page.tsx`

---

**Last Updated:** $(date)
**Status:** Phase 1 Complete (38%), Phase 2 In Progress
