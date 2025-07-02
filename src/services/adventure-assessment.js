/**
 * Adventure Assessment Service
 * Analyzes user context and history to determine readiness for content expansion
 */

import { ADVENTURE_PATTERNS, ENTITY_TYPES, RELATION_TYPES } from '../config/memory-entities.js';

export class AdventureAssessmentService {
  constructor(memoryService) {
    this.memory = memoryService;
  }

  /**
   * Assess user's current adventure readiness based on context and history
   */
  async assessAdventureReadiness(context) {
    try {
      const userMemory = await this.memory.retrieveLocalMemory();
      const adventureProfile = await this.getAdventureProfile(userMemory);
      
      const assessment = {
        readiness_level: 'medium',
        confidence: 0.5,
        factors: [],
        recommended_expansion_type: 'adjacent',
        expansion_suggestions: [],
        reasoning: ''
      };

      // Analyze context indicators
      const contextReadiness = this.analyzeContextReadiness(context);
      assessment.factors.push(contextReadiness);

      // Analyze historical patterns
      const historicalReadiness = await this.analyzeHistoricalReadiness(userMemory, adventureProfile);
      assessment.factors.push(historicalReadiness);

      // Analyze timing patterns
      const timingReadiness = this.analyzeTimingReadiness(context, userMemory);
      assessment.factors.push(timingReadiness);

      // Calculate overall readiness
      assessment.readiness_level = this.calculateOverallReadiness(assessment.factors);
      assessment.confidence = this.calculateConfidence(assessment.factors);
      
      // Recommend expansion strategy
      const expansionStrategy = this.recommendExpansionStrategy(assessment.readiness_level, adventureProfile);
      assessment.recommended_expansion_type = expansionStrategy.type;
      assessment.expansion_suggestions = expansionStrategy.suggestions;
      assessment.reasoning = this.generateReasoning(assessment);

      // Store assessment in memory
      await this.storeAssessment(assessment, context);

      return assessment;

    } catch (error) {
      console.error('Adventure assessment error:', error);
      return this.getDefaultAssessment();
    }
  }

  /**
   * Analyze language and context for adventure readiness indicators
   */
  analyzeContextReadiness(context) {
    const { situation_description = '', mood = '', viewing_companions = '' } = context;
    const textToAnalyze = `${situation_description} ${mood} ${viewing_companions}`.toLowerCase();

    let readinessScore = 0.5; // neutral baseline
    const indicators = [];

    // High readiness indicators
    ADVENTURE_PATTERNS.READINESS_INDICATORS.HIGH.forEach(indicator => {
      if (textToAnalyze.includes(indicator.toLowerCase())) {
        readinessScore += 0.3;
        indicators.push({ type: 'high', indicator, weight: 0.3 });
      }
    });

    // Medium readiness indicators
    ADVENTURE_PATTERNS.READINESS_INDICATORS.MEDIUM.forEach(indicator => {
      if (textToAnalyze.includes(indicator.toLowerCase())) {
        readinessScore += 0.1;
        indicators.push({ type: 'medium', indicator, weight: 0.1 });
      }
    });

    // Low readiness indicators (reduce score)
    ADVENTURE_PATTERNS.READINESS_INDICATORS.LOW.forEach(indicator => {
      if (textToAnalyze.includes(indicator.toLowerCase())) {
        readinessScore -= 0.2;
        indicators.push({ type: 'low', indicator, weight: -0.2 });
      }
    });

    // Contextual factors
    const contextualFactors = this.analyzeContextualFactors(context);
    readinessScore += contextualFactors.adjustment;
    indicators.push(...contextualFactors.factors);

    return {
      source: 'context_analysis',
      score: Math.max(0, Math.min(1, readinessScore)),
      weight: 0.4,
      indicators: indicators,
      details: 'Analysis of current situation description and mood'
    };
  }

  /**
   * Analyze contextual factors beyond language
   */
  analyzeContextualFactors(context) {
    const factors = [];
    let adjustment = 0;

    // Time availability factor
    if (context.time_available) {
      if (context.time_available > 180) {
        adjustment += 0.1;
        factors.push({ type: 'time_positive', factor: 'extended_time', weight: 0.1 });
      } else if (context.time_available < 90) {
        adjustment -= 0.1;
        factors.push({ type: 'time_negative', factor: 'limited_time', weight: -0.1 });
      }
    }

    // Viewing companions factor
    if (context.viewing_companions) {
      const companions = context.viewing_companions.toLowerCase();
      if (companions.includes('solo') || companions.includes('alone')) {
        adjustment += 0.1;
        factors.push({ type: 'companion_positive', factor: 'solo_viewing', weight: 0.1 });
      } else if (companions.includes('family') || companions.includes('kids')) {
        adjustment -= 0.1;
        factors.push({ type: 'companion_restrictive', factor: 'family_viewing', weight: -0.1 });
      }
    }

    return { adjustment, factors };
  }

  /**
   * Analyze user's historical adventure patterns
   */
  async analyzeHistoricalReadiness(userMemory, adventureProfile) {
    const expansionOutcomes = userMemory.filter(entity => 
      entity.type === ENTITY_TYPES.EXPANSION_OUTCOME
    );

    let historicalScore = 0.5; // neutral baseline
    const patterns = [];

    if (adventureProfile) {
      historicalScore = this.mapRiskToleranceToScore(adventureProfile.data.risk_tolerance);
      patterns.push({
        type: 'risk_tolerance',
        value: adventureProfile.data.risk_tolerance,
        weight: 0.3
      });

      if (adventureProfile.data.expansion_success_rate !== undefined) {
        const successBonus = adventureProfile.data.expansion_success_rate * 0.2;
        historicalScore += successBonus;
        patterns.push({
          type: 'success_rate',
          value: adventureProfile.data.expansion_success_rate,
          weight: successBonus
        });
      }
    }

    // Analyze recent expansion outcomes
    const recentExpansions = expansionOutcomes
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);

    if (recentExpansions.length > 0) {
      const recentSuccessRate = recentExpansions.filter(outcome => 
        ['loved', 'liked', 'completed'].includes(outcome.data.outcome)
      ).length / recentExpansions.length;

      const recentBonus = (recentSuccessRate - 0.5) * 0.2;
      historicalScore += recentBonus;
      patterns.push({
        type: 'recent_success',
        value: recentSuccessRate,
        weight: recentBonus
      });
    }

    return {
      source: 'historical_analysis',
      score: Math.max(0, Math.min(1, historicalScore)),
      weight: 0.4,
      patterns: patterns,
      details: 'Analysis of past adventure attempts and outcomes'
    };
  }

  /**
   * Analyze timing patterns for adventure readiness
   */
  analyzeTimingReadiness(context, userMemory) {
    let timingScore = 0.5;
    const timingFactors = [];

    // Recent viewing pattern analysis
    const recentOutcomes = userMemory.filter(entity => 
      entity.type === ENTITY_TYPES.RECOMMENDATION_OUTCOME
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 3);

    if (recentOutcomes.length > 0) {
      const recentComfortContent = recentOutcomes.filter(outcome => 
        outcome.data.adventure_level === 'comfort' || !outcome.data.adventure_level
      ).length;

      // Post-comfort expansion opportunity
      if (recentComfortContent >= 2) {
        timingScore += 0.2;
        timingFactors.push({
          type: 'post_comfort_opportunity',
          factor: 'recent_comfort_viewing',
          weight: 0.2
        });
      }

      // Recent expansion fatigue
      const recentExpansions = recentOutcomes.filter(outcome =>
        outcome.data.adventure_level && outcome.data.adventure_level !== 'comfort'
      ).length;

      if (recentExpansions >= 2) {
        timingScore -= 0.1;
        timingFactors.push({
          type: 'expansion_fatigue',
          factor: 'recent_expansion_attempts',
          weight: -0.1
        });
      }
    }

    return {
      source: 'timing_analysis',
      score: Math.max(0, Math.min(1, timingScore)),
      weight: 0.2,
      factors: timingFactors,
      details: 'Analysis of recent viewing patterns and timing'
    };
  }

  /**
   * Calculate overall readiness level from all factors
   */
  calculateOverallReadiness(factors) {
    const weightedScore = factors.reduce((sum, factor) => {
      return sum + (factor.score * factor.weight);
    }, 0);

    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
    const normalizedScore = totalWeight > 0 ? weightedScore / totalWeight : 0.5;

    if (normalizedScore >= 0.7) return 'high';
    if (normalizedScore >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence in the assessment
   */
  calculateConfidence(factors) {
    // More data points = higher confidence
    const dataPoints = factors.reduce((sum, factor) => {
      return sum + (factor.indicators?.length || factor.patterns?.length || factor.factors?.length || 1);
    }, 0);

    const baseConfidence = 0.3 + (dataPoints * 0.1);
    return Math.min(0.95, baseConfidence);
  }

  /**
   * Recommend expansion strategy based on readiness level
   */
  recommendExpansionStrategy(readinessLevel, adventureProfile) {
    const strategies = {
      high: {
        type: 'challenge',
        suggestions: [
          'Try a completely different genre',
          'Explore international cinema',
          'Consider art house or independent films',
          'Experiment with different eras or decades'
        ]
      },
      medium: {
        type: 'stretch',
        suggestions: [
          'Same genre with a different approach',
          'Familiar actors in new roles',
          'Similar themes in different settings',
          'Subgenre exploration within comfort zone'
        ]
      },
      low: {
        type: 'adjacent',
        suggestions: [
          'Stick to familiar preferences with slight variations',
          'Same style but different title',
          'Comfort viewing with highest ratings',
          'Popular content within established preferences'
        ]
      }
    };

    return strategies[readinessLevel] || strategies.medium;
  }

  /**
   * Generate human-readable reasoning for the assessment
   */
  generateReasoning(assessment) {
    const readinessTexts = {
      high: "You seem ready for an adventure! Your context and patterns suggest you're open to trying something new.",
      medium: "You're moderately open to discovery. I'll suggest some gentle expansions alongside familiar options.",
      low: "You seem to prefer familiar content right now. Let's stick to your comfort zone with perhaps a small variation."
    };

    return readinessTexts[assessment.readiness_level];
  }

  /**
   * Get adventure profile from memory
   */
  async getAdventureProfile(userMemory) {
    return userMemory.find(entity => entity.type === ENTITY_TYPES.ADVENTURE_PROFILE);
  }

  /**
   * Map risk tolerance to numeric score
   */
  mapRiskToleranceToScore(riskTolerance) {
    const mapping = {
      'conservative': 0.2,
      'moderate': 0.5,
      'adventurous': 0.8,
      'experimental': 0.9
    };
    return mapping[riskTolerance] || 0.5;
  }

  /**
   * Store assessment in memory for learning
   */
  async storeAssessment(assessment, context) {
    try {
      await this.memory.createMemoryNode('adventure_assessment', {
        readiness_level: assessment.readiness_level,
        confidence: assessment.confidence,
        context: context,
        factors: assessment.factors,
        recommended_expansion_type: assessment.recommended_expansion_type,
        reasoning: assessment.reasoning
      });
    } catch (error) {
      console.error('Failed to store adventure assessment:', error);
    }
  }

  /**
   * Get default assessment when analysis fails
   */
  getDefaultAssessment() {
    return {
      readiness_level: 'medium',
      confidence: 0.3,
      factors: [],
      recommended_expansion_type: 'adjacent',
      expansion_suggestions: [
        'I\'ll suggest content similar to what you\'ve enjoyed before',
        'Let\'s try gentle variations on your preferences'
      ],
      reasoning: 'Using default moderate approach due to limited context'
    };
  }

  /**
   * Update adventure profile based on outcome
   */
  async updateAdventureProfile(expansionOutcome) {
    try {
      const userMemory = await this.memory.retrieveLocalMemory();
      let adventureProfile = userMemory.find(entity => 
        entity.type === ENTITY_TYPES.ADVENTURE_PROFILE
      );

      if (!adventureProfile) {
        // Create initial adventure profile
        adventureProfile = await this.memory.createMemoryNode(
          ENTITY_TYPES.ADVENTURE_PROFILE,
          {
            user_id: 'entertainment_user',
            risk_tolerance: 'moderate',
            expansion_success_rate: 0.5,
            successful_expansions: [],
            failed_expansions: [],
            readiness_indicators: []
          }
        );
      }

      // Update based on outcome
      const updates = { ...adventureProfile.data };
      
      if (['loved', 'liked', 'completed'].includes(expansionOutcome.outcome)) {
        updates.successful_expansions.push({
          title: expansionOutcome.content_title,
          type: expansionOutcome.expansion_type,
          timestamp: new Date().toISOString()
        });
      } else {
        updates.failed_expansions.push({
          title: expansionOutcome.content_title,
          type: expansionOutcome.expansion_type,
          reason: expansionOutcome.user_feedback,
          timestamp: new Date().toISOString()
        });
      }

      // Recalculate success rate
      const totalExpansions = updates.successful_expansions.length + updates.failed_expansions.length;
      if (totalExpansions > 0) {
        updates.expansion_success_rate = updates.successful_expansions.length / totalExpansions;
      }

      // Adjust risk tolerance based on success rate
      if (updates.expansion_success_rate > 0.7 && updates.risk_tolerance === 'moderate') {
        updates.risk_tolerance = 'adventurous';
      } else if (updates.expansion_success_rate < 0.3 && updates.risk_tolerance === 'moderate') {
        updates.risk_tolerance = 'conservative';
      }

      await this.memory.updateMemoryNode(adventureProfile.id, updates);

      return updates;

    } catch (error) {
      console.error('Failed to update adventure profile:', error);
      return null;
    }
  }
}