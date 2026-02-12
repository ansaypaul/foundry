/**
 * Generate URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Remove accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace spaces with -
    .replace(/\s+/g, '-')
    // Remove all non-word chars
    .replace(/[^\w-]+/g, '')
    // Replace multiple - with single -
    .replace(/--+/g, '-')
    // Remove leading/trailing -
    .replace(/^-+|-+$/g, '');
}
