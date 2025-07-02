/**
 * Memory Entity Structure for Entertainment Discovery
 * Defines the knowledge graph structure for persistent user learning
 */

export const ENTITY_TYPES = {
  // Core user profile - the main branch
  USER_PROFILE: 'user_profile',
  
  // Content and preferences
  CONTENT_ITEM: 'content_item',
  GENRE_PREFERENCE: 'genre_preference',
  MOOD_PATTERN: 'mood_pattern',
  
  // Adventure and discovery tracking
  ADVENTURE_PROFILE: 'adventure_profile',
  EXPANSION_OUTCOME: 'expansion_outcome',
  COMFORT_ZONE: 'comfort_zone',
  
  // Subscription and access
  SUBSCRIPTION_CONTEXT: 'subscription_context',
  PLATFORM_ACCESS: 'platform_access',
  
  // Viewing contexts
  VIEWING_CONTEXT: 'viewing_context',
  SITUATION_PATTERN: 'situation_pattern',
  
  // Learning and feedback
  FEEDBACK: 'feedback',
  RECOMMENDATION_OUTCOME: 'recommendation_outcome',
  PREFERENCE_EVOLUTION: 'preference_evolution'
};

export const RELATION_TYPES = {
  // Core relationships
  BELONGS_TO: 'belongs_to',
  RELATES_TO: 'relates_to',
  
  // Preference relationships
  LOVES: 'loves',
  LIKES: 'likes',
  NEUTRAL: 'neutral',
  DISLIKES: 'dislikes',
  HATES: 'hates',
  
  // Adventure relationships
  COMFORTABLE_WITH: 'comfortable_with',
  WILLING_TO_TRY: 'willing_to_try',
  CHALLENGES_WITH: 'challenges_with',
  EXPANDED_TO: 'expanded_to',
  SUCCEEDED_WITH: 'succeeded_with',
  FAILED_WITH: 'failed_with',
  
  // Context relationships
  PREFERS_IN_CONTEXT: 'prefers_in_context',
  AVAILABLE_IN_CONTEXT: 'available_in_context',
  WATCHES_WITH: 'watches_with',
  
  // Temporal relationships
  EVOLVED_FROM: 'evolved_from',
  INFLUENCED_BY: 'influenced_by',
  LEADS_TO: 'leads_to',
  
  // Access relationships
  HAS_ACCESS_TO: 'has_access_to',
  SHARES_ACCESS_WITH: 'shares_access_with',
  RESTRICTED_BY: 'restricted_by'
};

export const MEMORY_ENTITY_SCHEMAS = {
  [ENTITY_TYPES.USER_PROFILE]: {
    required: ['user_id', 'created_at'],
    properties: {
      user_id: { type: 'string' },
      display_name: { type: 'string' },
      entertainment_personality: { type: 'string' },
      overall_satisfaction_score: { type: 'number' },
      total_recommendations: { type: 'number' },
      successful_recommendations: { type: 'number' },
      created_at: { type: 'string' },
      updated_at: { type: 'string' }
    }
  },

  [ENTITY_TYPES.ADVENTURE_PROFILE]: {
    required: ['user_id', 'risk_tolerance'],
    properties: {
      user_id: { type: 'string' },
      risk_tolerance: { 
        type: 'string', 
        enum: ['conservative', 'moderate', 'adventurous', 'experimental'] 
      },
      expansion_success_rate: { type: 'number' },
      comfort_zone_size: { type: 'number' },
      last_adventure_attempt: { type: 'string' },
      successful_expansions: { type: 'array' },
      failed_expansions: { type: 'array' },
      readiness_indicators: { type: 'array' },
      recovery_patterns: { type: 'object' }
    }
  },

  [ENTITY_TYPES.CONTENT_ITEM]: {
    required: ['title', 'content_type'],
    properties: {
      title: { type: 'string' },
      content_type: { type: 'string', enum: ['movie', 'tv_series', 'documentary', 'special'] },
      genres: { type: 'array' },
      release_year: { type: 'number' },
      runtime_minutes: { type: 'number' },
      imdb_rating: { type: 'number' },
      tmdb_id: { type: 'string' },
      poster_url: { type: 'string' },
      backdrop_url: { type: 'string' },
      streaming_links: { type: 'object' },
      adventure_level: { 
        type: 'string', 
        enum: ['comfort', 'adjacent', 'stretch', 'challenge'] 
      },
      recommendation_count: { type: 'number' },
      success_rate: { type: 'number' }
    }
  },

  [ENTITY_TYPES.VIEWING_CONTEXT]: {
    required: ['context_name', 'user_id'],
    properties: {
      context_name: { type: 'string' },
      user_id: { type: 'string' },
      typical_duration: { type: 'number' },
      companions: { type: 'string' },
      mood_patterns: { type: 'array' },
      preferred_genres: { type: 'array' },
      adventure_tolerance: { type: 'string' },
      platform_preferences: { type: 'array' },
      usage_frequency: { type: 'number' },
      last_used: { type: 'string' }
    }
  },

  [ENTITY_TYPES.SUBSCRIPTION_CONTEXT]: {
    required: ['platform', 'access_type'],
    properties: {
      platform: { type: 'string' },
      access_type: { 
        type: 'string', 
        enum: ['personal', 'shared', 'family', 'situational', 'borrowed'] 
      },
      access_details: { type: 'string' },
      availability_schedule: { type: 'object' },
      shared_with: { type: 'array' },
      geographic_restrictions: { type: 'array' },
      quality_level: { type: 'string' },
      last_verified: { type: 'string' },
      usage_priority: { type: 'number' }
    }
  },

  [ENTITY_TYPES.EXPANSION_OUTCOME]: {
    required: ['content_title', 'expansion_type', 'outcome'],
    properties: {
      content_title: { type: 'string' },
      expansion_type: { 
        type: 'string', 
        enum: ['adjacent', 'mood_bridge', 'genre_stretch', 'challenge'] 
      },
      outcome: { 
        type: 'string', 
        enum: ['loved', 'liked', 'completed', 'abandoned', 'rejected'] 
      },
      user_feedback: { type: 'string' },
      context_factors: { type: 'object' },
      learning_insights: { type: 'string' },
      recommendation_confidence: { type: 'number' },
      follow_up_behavior: { type: 'string' },
      created_at: { type: 'string' }
    }
  },

  [ENTITY_TYPES.MOOD_PATTERN]: {
    required: ['mood_name', 'user_id'],
    properties: {
      mood_name: { type: 'string' },
      user_id: { type: 'string' },
      content_preferences: { type: 'object' },
      genre_affinities: { type: 'object' },
      runtime_preferences: { type: 'object' },
      platform_preferences: { type: 'array' },
      adventure_tolerance: { type: 'number' },
      typical_contexts: { type: 'array' },
      success_patterns: { type: 'object' },
      last_updated: { type: 'string' }
    }
  },

  [ENTITY_TYPES.RECOMMENDATION_OUTCOME]: {
    required: ['content_title', 'recommendation_context', 'outcome'],
    properties: {
      content_title: { type: 'string' },
      recommendation_context: { type: 'object' },
      outcome: { 
        type: 'string', 
        enum: ['watched_loved', 'watched_liked', 'watched_neutral', 'watched_disliked', 'not_watched', 'abandoned'] 
      },
      watch_completion_percentage: { type: 'number' },
      user_rating: { type: 'number' },
      feedback_text: { type: 'string' },
      context_match_score: { type: 'number' },
      platform_used: { type: 'string' },
      viewing_companions: { type: 'string' },
      follow_up_requests: { type: 'array' },
      created_at: { type: 'string' }
    }
  }
};

/**
 * Adventure Assessment Patterns
 * Used to determine user readiness for content expansion
 */
export const ADVENTURE_PATTERNS = {
  READINESS_INDICATORS: {
    HIGH: [
      'feeling adventurous',
      'surprise me',
      'something different',
      'want to try something new',
      'open to anything',
      'recommend something I wouldn\'t normally watch'
    ],
    MEDIUM: [
      'open to suggestions',
      'maybe something new',
      'not sure what I want',
      'flexible tonight',
      'curious about'
    ],
    LOW: [
      'comfort viewing',
      'familiar',
      'safe choice',
      'similar to',
      'more of the same',
      'stressed',
      'tired',
      'sick'
    ]
  },

  EXPANSION_TYPES: {
    ADJACENT: {
      description: 'Same genre, different style or approach',
      risk_level: 'low',
      success_rate_threshold: 0.7
    },
    MOOD_BRIDGE: {
      description: 'Different genre, same emotional satisfaction',
      risk_level: 'medium',
      success_rate_threshold: 0.5
    },
    GENRE_STRETCH: {
      description: 'New genre with familiar elements',
      risk_level: 'medium-high',
      success_rate_threshold: 0.4
    },
    CHALLENGE: {
      description: 'Completely different content type',
      risk_level: 'high',
      success_rate_threshold: 0.3
    }
  },

  SUCCESS_METRICS: {
    COMFORT_ZONE: 0.8,    // Expected success rate for comfort content
    ADJACENT: 0.6,        // Expected success rate for adjacent discoveries
    STRETCH: 0.4,         // Expected success rate for stretch recommendations
    CHALLENGE: 0.25       // Expected success rate for challenge content
  }
};

/**
 * Memory Query Patterns
 * Common patterns for retrieving and analyzing memory data
 */
export const MEMORY_QUERIES = {
  GET_USER_ADVENTURE_PROFILE: {
    entity_type: ENTITY_TYPES.ADVENTURE_PROFILE,
    include_relations: [RELATION_TYPES.SUCCEEDED_WITH, RELATION_TYPES.FAILED_WITH]
  },

  GET_CONTEXT_PREFERENCES: {
    entity_type: ENTITY_TYPES.VIEWING_CONTEXT,
    include_relations: [RELATION_TYPES.PREFERS_IN_CONTEXT, RELATION_TYPES.COMFORTABLE_WITH]
  },

  GET_RECENT_FEEDBACK: {
    entity_type: ENTITY_TYPES.RECOMMENDATION_OUTCOME,
    sort_by: 'created_at',
    limit: 10,
    include_relations: [RELATION_TYPES.INFLUENCED_BY]
  },

  GET_PLATFORM_CONTEXT: {
    entity_type: ENTITY_TYPES.SUBSCRIPTION_CONTEXT,
    include_relations: [RELATION_TYPES.HAS_ACCESS_TO, RELATION_TYPES.AVAILABLE_IN_CONTEXT]
  }
};