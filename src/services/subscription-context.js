import { MemoryService } from './memory.js';

export class SubscriptionContextService {
  constructor(memoryService) {
    this.memory = memoryService || new MemoryService();
  }

  async updateContext({ contextType, platform, accessDetails }) {
    try {
      // Check if context already exists for this platform
      const existingContexts = await this.memory.retrieveMemoryNodes('subscription_context', {
        platform: platform
      });

      const contextData = {
        contextType: contextType,
        platform: platform,
        accessDetails: accessDetails,
        isActive: true,
        lastUpdated: new Date().toISOString()
      };

      // Add context-specific intelligence
      const enrichedData = this.enrichContextData(contextData);

      let result;
      if (existingContexts.length > 0) {
        // Update existing context
        const existingContext = existingContexts[0];
        result = await this.memory.updateMemoryNode(existingContext.id, {
          data: enrichedData
        });
      } else {
        // Create new context
        result = await this.memory.createMemoryNode('subscription_context', enrichedData);
      }

      return {
        status: 'success',
        action: existingContexts.length > 0 ? 'updated' : 'created',
        platform: platform,
        context_type: contextType,
        intelligence: enrichedData.contextIntelligence,
        message: `${platform} subscription context ${existingContexts.length > 0 ? 'updated' : 'added'} successfully`
      };

    } catch (error) {
      console.error('Subscription context update error:', error);
      return {
        status: 'error',
        error: error.message,
        platform: platform
      };
    }
  }

  enrichContextData(contextData) {
    const enriched = {
      ...contextData,
      contextIntelligence: this.analyzeContextIntelligence(contextData),
      availabilityRules: this.generateAvailabilityRules(contextData),
      priorityScore: this.calculatePriorityScore(contextData)
    };

    return enriched;
  }

  analyzeContextIntelligence(contextData) {
    const { contextType, accessDetails } = contextData;
    
    const intelligence = {
      accessPattern: this.determineAccessPattern(accessDetails),
      reliability: this.assessReliability(contextType, accessDetails),
      constraints: this.identifyConstraints(accessDetails),
      recommendations: this.generateContextRecommendations(contextType, accessDetails)
    };

    return intelligence;
  }

  determineAccessPattern(accessDetails) {
    const details = accessDetails.toLowerCase();
    
    if (details.includes('always') || details.includes('anytime') || details.includes('24/7')) {
      return 'unrestricted';
    } else if (details.includes('weekend') || details.includes('saturday') || details.includes('sunday')) {
      return 'weekend_only';
    } else if (details.includes('evening') || details.includes('night') || details.includes('after')) {
      return 'evening_only';
    } else if (details.includes('when') && (details.includes('home') || details.includes('present'))) {
      return 'conditional_presence';
    } else if (details.includes('family') || details.includes('together')) {
      return 'group_dependent';
    } else {
      return 'situational';
    }
  }

  assessReliability(contextType, accessDetails) {
    const reliabilityScores = {
      'personal': 95,
      'shared': 70,
      'family': 80,
      'situational': 60
    };

    let baseScore = reliabilityScores[contextType] || 50;
    
    // Adjust based on access details
    const details = accessDetails.toLowerCase();
    if (details.includes('sometimes') || details.includes('maybe')) {
      baseScore -= 20;
    } else if (details.includes('usually') || details.includes('often')) {
      baseScore -= 10;
    } else if (details.includes('always') || details.includes('guaranteed')) {
      baseScore += 10;
    }

    return Math.max(0, Math.min(100, baseScore));
  }

  identifyConstraints(accessDetails) {
    const constraints = [];
    const details = accessDetails.toLowerCase();

    // Time constraints
    if (details.includes('weekend')) constraints.push({ type: 'temporal', rule: 'weekends_only' });
    if (details.includes('evening')) constraints.push({ type: 'temporal', rule: 'evenings_only' });
    if (details.includes('after work')) constraints.push({ type: 'temporal', rule: 'after_6pm' });

    // Social constraints
    if (details.includes('when partner') || details.includes('with partner')) {
      constraints.push({ type: 'social', rule: 'partner_present' });
    }
    if (details.includes('family')) constraints.push({ type: 'social', rule: 'family_context' });
    if (details.includes('alone') || details.includes('solo')) {
      constraints.push({ type: 'social', rule: 'solo_only' });
    }

    // Location constraints
    if (details.includes('at home')) constraints.push({ type: 'location', rule: 'home_only' });
    if (details.includes('travel')) constraints.push({ type: 'location', rule: 'travel_restricted' });

    return constraints;
  }

  generateContextRecommendations(contextType, accessDetails) {
    const recommendations = [];

    if (contextType === 'shared') {
      recommendations.push('Consider discussing viewing preferences with account owner');
      recommendations.push('Check availability before making plans to watch');
    }

    if (contextType === 'family') {
      recommendations.push('Look for family-friendly content during shared access times');
      recommendations.push('Consider creating separate viewing lists for different family members');
    }

    if (contextType === 'situational') {
      recommendations.push('Have backup entertainment options for when this platform is unavailable');
      recommendations.push('Consider the reliability score when planning viewing sessions');
    }

    return recommendations;
  }

  calculatePriorityScore(contextData) {
    const { contextType } = contextData;
    
    const typeScores = {
      'personal': 100,
      'family': 80,
      'shared': 60,
      'situational': 40
    };

    let score = typeScores[contextType] || 50;
    
    // Adjust based on reliability
    if (contextData.contextIntelligence?.reliability) {
      score = (score * contextData.contextIntelligence.reliability) / 100;
    }

    return Math.round(score);
  }

  generateAvailabilityRules(contextData) {
    const rules = [];
    const constraints = contextData.contextIntelligence?.constraints || [];

    constraints.forEach(constraint => {
      switch (constraint.type) {
        case 'temporal':
          rules.push({
            type: 'time_check',
            condition: constraint.rule,
            priority: 'high'
          });
          break;
        case 'social':
          rules.push({
            type: 'context_check',
            condition: constraint.rule,
            priority: 'medium'
          });
          break;
        case 'location':
          rules.push({
            type: 'location_check', 
            condition: constraint.rule,
            priority: 'low'
          });
          break;
      }
    });

    return rules;
  }

  async getAvailablePlatforms(viewingContext = {}) {
    try {
      const allContexts = await this.memory.retrieveMemoryNodes('subscription_context');
      const availablePlatforms = [];

      for (const context of allContexts) {
        if (await this.isPlatformAvailable(context, viewingContext)) {
          availablePlatforms.push({
            platform: context.data.platform,
            contextType: context.data.contextType,
            reliability: context.data.contextIntelligence?.reliability || 50,
            priorityScore: context.data.priorityScore || 50
          });
        }
      }

      // Sort by priority and reliability
      availablePlatforms.sort((a, b) => {
        const scoreA = a.priorityScore * (a.reliability / 100);
        const scoreB = b.priorityScore * (b.reliability / 100);
        return scoreB - scoreA;
      });

      return availablePlatforms;

    } catch (error) {
      console.error('Platform availability check error:', error);
      return this.getDefaultPlatforms();
    }
  }

  async isPlatformAvailable(subscriptionContext, viewingContext) {
    const rules = subscriptionContext.data.availabilityRules || [];
    
    for (const rule of rules) {
      if (!await this.evaluateRule(rule, viewingContext)) {
        return false;
      }
    }

    return true;
  }

  async evaluateRule(rule, viewingContext) {
    switch (rule.type) {
      case 'time_check':
        return this.evaluateTimeRule(rule.condition, viewingContext);
      case 'context_check':
        return this.evaluateContextRule(rule.condition, viewingContext);
      case 'location_check':
        return this.evaluateLocationRule(rule.condition, viewingContext);
      default:
        return true;
    }
  }

  evaluateTimeRule(condition, viewingContext) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    switch (condition) {
      case 'weekends_only':
        return currentDay === 0 || currentDay === 6;
      case 'evenings_only':
        return currentHour >= 18;
      case 'after_6pm':
        return currentHour >= 18;
      default:
        return true;
    }
  }

  evaluateContextRule(condition, viewingContext) {
    const companions = viewingContext.companions?.toLowerCase() || '';

    switch (condition) {
      case 'partner_present':
        return companions.includes('partner') || companions.includes('with partner');
      case 'family_context':
        return companions.includes('family') || companions.includes('kids');
      case 'solo_only':
        return companions.includes('solo') || companions.includes('alone');
      default:
        return true;
    }
  }

  evaluateLocationRule(condition, viewingContext) {
    // This would integrate with location services in a real implementation
    // For now, assume home context
    switch (condition) {
      case 'home_only':
        return true; // Assume at home for demo
      case 'travel_restricted':
        return true; // Assume not traveling for demo
      default:
        return true;
    }
  }

  getDefaultPlatforms() {
    return [
      { platform: 'Netflix', contextType: 'personal', reliability: 95, priorityScore: 100 },
      { platform: 'Amazon Prime', contextType: 'personal', reliability: 95, priorityScore: 90 },
      { platform: 'Disney+', contextType: 'family', reliability: 80, priorityScore: 80 }
    ];
  }

  async getSubscriptionSummary() {
    try {
      const contexts = await this.memory.retrieveMemoryNodes('subscription_context');
      
      const summary = {
        totalPlatforms: contexts.length,
        byType: {},
        byReliability: { high: 0, medium: 0, low: 0 },
        recommendations: []
      };

      contexts.forEach(context => {
        const type = context.data.contextType;
        const reliability = context.data.contextIntelligence?.reliability || 50;

        summary.byType[type] = (summary.byType[type] || 0) + 1;

        if (reliability >= 80) summary.byReliability.high++;
        else if (reliability >= 60) summary.byReliability.medium++;
        else summary.byReliability.low++;
      });

      // Generate recommendations based on context analysis
      if (summary.byReliability.low > summary.byReliability.high) {
        summary.recommendations.push('Consider upgrading to personal subscriptions for more reliable access');
      }

      if (summary.byType.situational > 2) {
        summary.recommendations.push('You have many situational subscriptions - consider backup entertainment options');
      }

      return summary;

    } catch (error) {
      console.error('Subscription summary error:', error);
      return {
        totalPlatforms: 0,
        byType: {},
        byReliability: { high: 0, medium: 0, low: 0 },
        recommendations: ['Unable to analyze subscription contexts'],
        error: error.message
      };
    }
  }
}