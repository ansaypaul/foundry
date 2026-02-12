import { computeSiteDecisionProfile } from './siteDecisionEngine';
import { DecisionEngineInput } from './types';

describe('Site Decision Engine', () => {
  test('niche_passion + manual + auto => small', () => {
    const input: DecisionEngineInput = {
      siteType: 'niche_passion',
      automationLevel: 'manual',
      ambitionLevel: 'auto',
      language: 'fr',
      country: 'FR',
    };

    const profile = computeSiteDecisionProfile(input);

    expect(profile.siteSize).toBe('small');
    expect(profile.complexity).toBe(1);
    expect(profile.velocity).toBe('low');
    expect(profile.targets.authors).toEqual({ min: 1, max: 2 });
    expect(profile.targets.categories).toEqual({ min: 3, max: 5 });
    expect(profile.rationale.some(r => r.includes('score='))).toBe(true);
  });

  test('niche_passion + ai_auto + auto => medium (auto becomes growth)', () => {
    const input: DecisionEngineInput = {
      siteType: 'niche_passion',
      automationLevel: 'ai_auto',
      ambitionLevel: 'auto',
      language: 'fr',
      country: 'FR',
    };

    const profile = computeSiteDecisionProfile(input);

    expect(profile.siteSize).toBe('medium');
    expect(profile.complexity).toBe(2);
    expect(profile.velocity).toBe('medium');
    expect(profile.targets.authors).toEqual({ min: 3, max: 5 });
    expect(profile.targets.categories).toEqual({ min: 6, max: 10 });
    expect(profile.rationale.some(r => r.includes("substituted to 'growth'"))).toBe(true);
  });

  test('news_media + ai_auto + factory => large', () => {
    const input: DecisionEngineInput = {
      siteType: 'news_media',
      automationLevel: 'ai_auto',
      ambitionLevel: 'factory',
      language: 'en',
      country: 'US',
    };

    const profile = computeSiteDecisionProfile(input);

    expect(profile.siteSize).toBe('large');
    expect(profile.complexity).toBe(3);
    expect(profile.velocity).toBe('high');
    expect(profile.targets.authors).toEqual({ min: 6, max: 10 });
    expect(profile.targets.categories).toEqual({ min: 10, max: 20 });
    expect(profile.targets.contentTypes).toEqual({ min: 6, max: 8 });
    expect(profile.targets.mandatoryPages).toEqual({ min: 6, max: 8 });
  });

  test('gaming_popculture + ai_assisted + growth => medium', () => {
    const input: DecisionEngineInput = {
      siteType: 'gaming_popculture',
      automationLevel: 'ai_assisted',
      ambitionLevel: 'growth',
      language: 'fr',
      country: 'FR',
    };

    const profile = computeSiteDecisionProfile(input);

    expect(profile.siteSize).toBe('medium');
    expect(profile.complexity).toBe(2);
    expect(profile.velocity).toBe('medium');
  });

  test('affiliate_guides + ai_auto + starter => medium', () => {
    const input: DecisionEngineInput = {
      siteType: 'affiliate_guides',
      automationLevel: 'ai_auto',
      ambitionLevel: 'starter',
      language: 'en',
      country: 'GB',
    };

    const profile = computeSiteDecisionProfile(input);

    // affiliate_guides=2, ai_auto=2, starter=0 => score=4 => medium
    expect(profile.siteSize).toBe('medium');
    expect(profile.complexity).toBe(2);
    expect(profile.velocity).toBe('medium');
  });

  test('all rationale lines present', () => {
    const input: DecisionEngineInput = {
      siteType: 'news_media',
      automationLevel: 'ai_auto',
      ambitionLevel: 'factory',
      language: 'fr',
      country: 'FR',
    };

    const profile = computeSiteDecisionProfile(input);

    expect(profile.rationale.length).toBeGreaterThan(0);
    expect(profile.rationale.some(r => r.includes('siteTypeWeight='))).toBe(true);
    expect(profile.rationale.some(r => r.includes('automationWeight='))).toBe(true);
    expect(profile.rationale.some(r => r.includes('ambitionWeight='))).toBe(true);
    expect(profile.rationale.some(r => r.includes('score='))).toBe(true);
    expect(profile.rationale.some(r => r.includes('targets table'))).toBe(true);
  });
});
