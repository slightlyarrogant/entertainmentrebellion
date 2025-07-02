import axios from 'axios';

export class ContentDiscoveryService {
  constructor(memoryService = null, adventureAssessmentService = null) {
    this.watchmodeApiKey = process.env.WATCHMODE_API_KEY;
    this.tmdbApiKey = process.env.TMDB_API_KEY;
    this.watchmodeBaseUrl = 'https://api.watchmode.com/v1';
    this.tmdbBaseUrl = 'https://api.themoviedb.org/3';
    this.memory = memoryService;
    this.adventureAssessment = adventureAssessmentService;
    
    // Debug logging
    console.error('ContentDiscoveryService initialized with:');
    console.error('Watchmode API Key:', this.watchmodeApiKey ? `${this.watchmodeApiKey.substring(0, 10)}...` : 'NOT SET');
    console.error('TMDB API Key:', this.tmdbApiKey ? `${this.tmdbApiKey.substring(0, 10)}...` : 'NOT SET');
    
    // Test API connectivity on initialization
    if (this.watchmodeApiKey) {
      this.testWatchmodeConnection();
    }
  }

  async discoverWithContext({ situationDescription, mood, timeAvailable, viewingCompanions }) {
    try {
      console.error('Starting content discovery with memory integration...');
      
      // Initialize memory for first-time users
      await this.initializeUserMemoryIfNeeded();
      
      // Parse the viewing context
      const context = this.parseViewingContext({
        situationDescription,
        mood,
        timeAvailable,
        viewingCompanions
      });

      // Enhance context with memory data
      const enhancedContext = await this.enhanceContextWithMemory(context);

      // Assess adventure readiness
      const adventureAssessment = await this.assessAdventureReadiness(enhancedContext);
      enhancedContext.adventure_assessment = adventureAssessment;

      // Get available platforms from memory service
      const availablePlatforms = await this.getAvailablePlatformsFromMemory(enhancedContext);

      // Search for content based on enhanced context
      const contentCandidates = await this.searchContentByContext(enhancedContext, availablePlatforms);

      // Rank recommendations using memory insights and adventure assessment
      const recommendations = await this.rankRecommendationsWithAdventure(contentCandidates, enhancedContext);

      // Store this recommendation context for learning
      await this.storeRecommendationContext(recommendations, enhancedContext);

      // Generate visual artifact
      const artifactData = {
        recommendations: recommendations.slice(0, 3),
        context: {
          situation: enhancedContext.situation,
          mood: enhancedContext.mood,
          timeAvailable: enhancedContext.timeAvailable,
          companions: enhancedContext.companions
        },
        adventureAssessment: enhancedContext.adventure_assessment
      };

      return {
        recommendations: recommendations.slice(0, 3),
        context_analysis: enhancedContext,
        explanation: this.generateExplanation(recommendations, enhancedContext),
        memory_insights: enhancedContext.memory_insights,
        visual_artifact: artifactData,
        instruction: "IMPORTANT: You must now use the generate_visual_recommendations tool with the provided visual_artifact data to create an interactive recommendation card for the user."
      };

    } catch (error) {
      console.error('Content discovery error:', error);
      return {
        error: 'Failed to discover content',
        message: error.message,
        fallback_recommendations: await this.getFallbackRecommendations()
      };
    }
  }

  /**
   * Enhance context with data from memory service
   */
  async enhanceContextWithMemory(context) {
    if (!this.memory) {
      console.error('Memory service not available, using basic context');
      return {
        ...context,
        memory_insights: { status: 'no_memory_service' }
      };
    }

    try {
      console.error('Enhancing context with memory data...');
      
      // Get user's preference history
      const userMemory = await this.memory.retrieveLocalMemory();
      
      // Analyze memory patterns
      const memoryPatterns = await this.memory.analyzeMemoryPatterns();
      
      // Get subscription contexts
      const subscriptionContexts = userMemory.filter(node => 
        node.type === 'subscription_context'
      );

      // Get recent feedback patterns
      const recentFeedback = userMemory.filter(node => 
        node.type === 'feedback'
      ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

      // Get viewing context preferences
      const viewingContexts = userMemory.filter(node => 
        node.type === 'viewing_context'
      );

      const enhancedContext = {
        ...context,
        memory_insights: {
          subscription_contexts: subscriptionContexts,
          recent_feedback: recentFeedback,
          viewing_patterns: memoryPatterns.viewing_contexts,
          preference_evolution: memoryPatterns.preference_evolution,
          feedback_patterns: memoryPatterns.feedback_patterns,
          total_memory_nodes: userMemory.length
        }
      };

      // Enhance genre preferences based on memory
      if (memoryPatterns.preference_evolution?.genre_trends) {
        const memoryGenres = Object.keys(memoryPatterns.preference_evolution.genre_trends);
        enhancedContext.genre_preferences = [
          ...new Set([...context.genre_preferences, ...memoryGenres])
        ];
      }

      console.error('Context enhanced with memory:', enhancedContext.memory_insights.total_memory_nodes, 'nodes');
      return enhancedContext;

    } catch (error) {
      console.error('Failed to enhance context with memory:', error);
      return {
        ...context,
        memory_insights: { 
          status: 'memory_error',
          error: error.message 
        }
      };
    }
  }

  /**
   * Get available platforms from memory service
   */
  async getAvailablePlatformsFromMemory(context) {
    if (!this.memory || !context.memory_insights?.subscription_contexts) {
      console.error('Using default platforms - no memory data available');
      return ['netflix', 'amazon-prime', 'disney-plus', 'hbo-max', 'hulu'];
    }

    try {
      const subscriptionContexts = context.memory_insights.subscription_contexts;
      const availablePlatforms = [];

      for (const subscription of subscriptionContexts) {
        const platform = subscription.data.platform?.toLowerCase();
        const contextType = subscription.data.contextType;
        const accessDetails = subscription.data.accessDetails;

        // Determine if platform is currently available based on context
        let isAvailable = false;

        switch (contextType) {
          case 'personal':
            isAvailable = true;
            break;
          case 'shared':
            // Check if sharing conditions are met
            if (accessDetails.includes('weekend') && this.isWeekend()) {
              isAvailable = true;
            } else if (accessDetails.includes('partner') && context.companions.includes('partner')) {
              isAvailable = true;
            } else if (accessDetails.includes('always')) {
              isAvailable = true;
            }
            break;
          case 'family':
            if (context.companions.includes('family') || context.companions.includes('kids')) {
              isAvailable = true;
            }
            break;
          case 'situational':
            // Parse situational access
            isAvailable = true; // Default to available for now
            break;
        }

        if (isAvailable && platform) {
          availablePlatforms.push(platform);
        }
      }

      console.error('Available platforms from memory:', availablePlatforms);
      return availablePlatforms.length > 0 ? availablePlatforms : ['netflix', 'amazon-prime'];

    } catch (error) {
      console.error('Error getting platforms from memory:', error);
      return ['netflix', 'amazon-prime', 'disney-plus', 'hbo-max', 'hulu'];
    }
  }

  /**
   * Check if it's currently weekend
   */
  isWeekend() {
    const day = new Date().getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  }

  /**
   * Assess user's adventure readiness
   */
  async assessAdventureReadiness(context) {
    if (!this.adventureAssessment) {
      console.error('Adventure assessment service not available');
      return {
        readiness_level: 'medium',
        confidence: 0.3,
        reasoning: 'Adventure assessment service not available'
      };
    }

    try {
      console.error('Assessing adventure readiness...');
      const assessment = await this.adventureAssessment.assessAdventureReadiness({
        situation_description: context.situation,
        mood: context.mood,
        time_available: context.timeAvailable,
        viewing_companions: context.companions
      });

      console.error('Adventure assessment:', assessment.readiness_level, 'confidence:', assessment.confidence);
      return assessment;

    } catch (error) {
      console.error('Adventure assessment failed:', error);
      return {
        readiness_level: 'medium',
        confidence: 0.3,
        reasoning: 'Assessment failed, using moderate approach'
      };
    }
  }

  parseViewingContext({ situationDescription, mood, timeAvailable, viewingCompanions }) {
    // AI-powered context analysis
    const context = {
      situation: situationDescription || 'general viewing',
      mood: mood || 'neutral',
      timeAvailable: timeAvailable || 120, // default 2 hours
      companions: viewingCompanions || 'solo',
      complexity_preference: this.inferComplexityPreference(situationDescription, mood),
      energy_level: this.inferEnergyLevel(mood, timeAvailable),
      genre_preferences: this.inferGenrePreferences(mood, viewingCompanions)
    };

    return context;
  }

  inferComplexityPreference(situation, mood) {
    const lowComplexityIndicators = ['tired', 'stressed', 'background', 'casual', 'relaxed'];
    const highComplexityIndicators = ['engage', 'think', 'learn', 'challenge', 'focus'];
    
    const text = `${situation} ${mood}`.toLowerCase();
    
    if (lowComplexityIndicators.some(indicator => text.includes(indicator))) {
      return 'low';
    } else if (highComplexityIndicators.some(indicator => text.includes(indicator))) {
      return 'high';
    }
    return 'medium';
  }

  inferEnergyLevel(mood, timeAvailable) {
    const lowEnergyMoods = ['tired', 'relaxed', 'calm', 'peaceful'];
    const highEnergyMoods = ['excited', 'energetic', 'pumped', 'motivated'];
    
    if (lowEnergyMoods.includes(mood?.toLowerCase()) || timeAvailable > 180) {
      return 'low';
    } else if (highEnergyMoods.includes(mood?.toLowerCase()) || timeAvailable < 90) {
      return 'high';
    }
    return 'medium';
  }

  inferGenrePreferences(mood, companions) {
    const genreMap = {
      'stressed': ['comedy', 'romance', 'animation'],
      'sad': ['comedy', 'feel-good', 'romance'],
      'excited': ['action', 'adventure', 'thriller'],
      'thoughtful': ['drama', 'documentary', 'sci-fi'],
      'romantic': ['romance', 'drama'],
      'solo': ['thriller', 'drama', 'documentary'],
      'with partner': ['romance', 'comedy', 'drama'],
      'family': ['animation', 'adventure', 'comedy'],
      'friends': ['comedy', 'action', 'horror']
    };

    const preferences = [];
    if (mood && genreMap[mood.toLowerCase()]) {
      preferences.push(...genreMap[mood.toLowerCase()]);
    }
    if (companions && genreMap[companions.toLowerCase()]) {
      preferences.push(...genreMap[companions.toLowerCase()]);
    }

    return [...new Set(preferences)]; // Remove duplicates
  }

  async getAvailablePlatforms(context) {
    // This will integrate with memory service to get user's subscription context
    // For now, return default platforms
    return ['netflix', 'amazon-prime', 'disney-plus', 'hbo-max', 'hulu'];
  }

  async searchContentByContext(context, platforms) {
    const searchQueries = this.generateSearchQueries(context);
    const allResults = [];

    for (const query of searchQueries) {
      try {
        const results = await this.searchWatchmode(query, platforms);
        allResults.push(...results);
      } catch (error) {
        console.error(`Search failed for query: ${query}`, error);
      }
    }

    // Remove duplicates and enrich with TMDB data
    const uniqueResults = this.removeDuplicates(allResults);
    const enrichedResults = await this.enrichWithTMDB(uniqueResults);

    return enrichedResults;
  }

  generateSearchQueries(context) {
    const queries = [];
    
    // Genre-based queries
    if (context.genre_preferences && context.genre_preferences.length > 0) {
      queries.push(...context.genre_preferences);
    }

    // Mood-based queries  
    const moodQueries = {
      'stressed': 'feel good comedy',
      'sad': 'uplifting heartwarming',
      'excited': 'action adventure',
      'thoughtful': 'thought provoking drama',
      'romantic': 'romantic drama'
    };

    if (context.mood && moodQueries[context.mood.toLowerCase()]) {
      queries.push(moodQueries[context.mood.toLowerCase()]);
    }

    // Time-based queries
    if (context.timeAvailable < 90) {
      queries.push('short movie');
    } else if (context.timeAvailable > 180) {
      queries.push('series binge worthy');
    }

    return queries.length > 0 ? queries : ['popular'];
  }

  async searchWatchmode(query, platforms) {
    if (!this.watchmodeApiKey) {
      console.error('Watchmode API key not found, using mock data');
      return this.getMockWatchmodeResults(query);
    }

    console.error(`Attempting Watchmode API search for: ${query}`);
    try {
      // Correct Watchmode API implementation based on documentation
      const searchUrl = `${this.watchmodeBaseUrl}/search/?apiKey=${this.watchmodeApiKey}&search_field=name&search_value=${encodeURIComponent(query)}`;
      console.error('Watchmode search URL:', searchUrl);
      
      const response = await axios.get(searchUrl);
      console.error('Watchmode search response:', response.status, response.data);

      if (response.data && response.data.title_results) {
        // Enhance results with streaming sources
        const enrichedResults = await this.enrichWithWatchmodeSources(response.data.title_results.slice(0, 10));
        return enrichedResults;
      }

      return [];
    } catch (error) {
      console.error('Watchmode API error:', error.response?.data || error.message);
      console.error('Full error:', error.response?.status, error.response?.statusText);
      console.error('Headers:', error.response?.headers);
      return this.getMockWatchmodeResults(query);
    }
  }

  /**
   * Enrich Watchmode results with streaming source data
   */
  async enrichWithWatchmodeSources(titleResults) {
    const enrichedResults = [];

    for (const title of titleResults) {
      try {
        // Get streaming sources using Watchmode ID
        const sourcesUrl = `${this.watchmodeBaseUrl}/title/${title.id}/sources/?apiKey=${this.watchmodeApiKey}&regions=US`;
        console.error(`Getting sources for ${title.name} (ID: ${title.id})`);
        
        const sourcesResponse = await axios.get(sourcesUrl);
        
        const enrichedTitle = {
          ...title,
          streaming_sources: sourcesResponse.data || [],
          watchmode_id: title.id
        };
        
        enrichedResults.push(enrichedTitle);
        
        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Failed to get sources for ${title.name}:`, error.response?.data || error.message);
        // Include title without sources rather than failing completely
        enrichedResults.push({
          ...title,
          streaming_sources: [],
          watchmode_id: title.id
        });
      }
    }

    return enrichedResults;
  }

  /**
   * Test Watchmode API connectivity
   */
  async testWatchmodeConnection() {
    try {
      console.error('Testing Watchmode API connectivity...');
      const testUrl = `${this.watchmodeBaseUrl}/sources/?apiKey=${this.watchmodeApiKey}`;
      const response = await axios.get(testUrl);
      console.error('Watchmode API test successful:', response.status);
      console.error('Available sources count:', response.data?.length || 0);
    } catch (error) {
      console.error('Watchmode API test failed:', error.response?.status, error.response?.data || error.message);
    }
  }

  getMockWatchmodeResults(query) {
    // Mock data for development/demo
    const mockResults = [
      { id: 1, title: 'The Office', type: 'tv_series', year: 2005, genre_names: ['Comedy'] },
      { id: 2, title: 'Stranger Things', type: 'tv_series', year: 2016, genre_names: ['Drama', 'Sci-Fi'] },
      { id: 3, title: 'The Grand Budapest Hotel', type: 'movie', year: 2014, genre_names: ['Comedy', 'Drama'] },
      { id: 4, title: 'Avatar: The Last Airbender', type: 'tv_series', year: 2005, genre_names: ['Animation', 'Adventure'] },
      { id: 5, title: 'Parasite', type: 'movie', year: 2019, genre_names: ['Thriller', 'Drama'] }
    ];

    return mockResults.filter(item => 
      item.genre_names.some(genre => 
        genre.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes(genre.toLowerCase())
      )
    );
  }

  async enrichWithTMDB(watchmodeResults) {
    const enriched = [];

    for (const item of watchmodeResults.slice(0, 20)) { // Limit to avoid rate limits
      try {
        // Use correct property names: Watchmode returns 'name' not 'title'
        const titleName = item.name || item.title;
        const contentType = item.type;
        
        console.error(`Enriching ${titleName} with TMDB data...`);
        const tmdbData = await this.getTMDBData(titleName, contentType);
        
        enriched.push({
          ...item,
          title: titleName, // Normalize to 'title' for consistency
          tmdb_data: tmdbData,
          context_score: 0 // Will be calculated in ranking
        });
        
        console.error(`TMDB enrichment ${tmdbData ? 'successful' : 'failed'} for ${titleName}`);
      } catch (error) {
        console.error(`Failed to enrich ${item.name || item.title}:`, error);
        enriched.push({
          ...item,
          title: item.name || item.title, // Normalize to 'title'
          tmdb_data: null,
          context_score: 0
        });
      }
    }

    return enriched;
  }

  async getTMDBData(title, type) {
    if (!this.tmdbApiKey) {
      return this.getMockTMDBData(title, type);
    }

    try {
      const searchType = type === 'movie' ? 'movie' : 'tv';
      const response = await axios.get(`${this.tmdbBaseUrl}/search/${searchType}`, {
        params: {
          api_key: this.tmdbApiKey,
          query: title
        }
      });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        
        // Get detailed information with images
        const detailResponse = await axios.get(`${this.tmdbBaseUrl}/${searchType}/${result.id}`, {
          params: {
            api_key: this.tmdbApiKey,
            append_to_response: 'images,videos,credits'
          }
        });

        const detailData = detailResponse.data;

        // Enhance with visual assets
        const visualAssets = this.buildVisualAssets(detailData);
        
        return {
          ...detailData,
          visual_assets: visualAssets,
          tmdb_id: detailData.id,
          content_type: searchType
        };
      }

      return null;
    } catch (error) {
      console.error('TMDB API error:', error.response?.data || error.message);
      console.error('TMDB status:', error.response?.status, error.response?.statusText);
      return this.getMockTMDBData(title, type);
    }
  }

  /**
   * Build visual assets object with different image sizes and URLs
   */
  buildVisualAssets(tmdbData) {
    const baseImageUrl = 'https://image.tmdb.org/t/p';
    
    const assets = {
      posters: {},
      backdrops: {},
      logos: {},
      stills: []
    };

    // Poster images in different sizes
    if (tmdbData.poster_path) {
      assets.posters = {
        thumbnail: `${baseImageUrl}/w154${tmdbData.poster_path}`,
        small: `${baseImageUrl}/w185${tmdbData.poster_path}`,
        medium: `${baseImageUrl}/w342${tmdbData.poster_path}`,
        large: `${baseImageUrl}/w500${tmdbData.poster_path}`,
        extra_large: `${baseImageUrl}/w780${tmdbData.poster_path}`,
        original: `${baseImageUrl}/original${tmdbData.poster_path}`
      };
    }

    // Backdrop images
    if (tmdbData.backdrop_path) {
      assets.backdrops = {
        small: `${baseImageUrl}/w300${tmdbData.backdrop_path}`,
        medium: `${baseImageUrl}/w780${tmdbData.backdrop_path}`,
        large: `${baseImageUrl}/w1280${tmdbData.backdrop_path}`,
        original: `${baseImageUrl}/original${tmdbData.backdrop_path}`
      };
    }

    // Additional images from append_to_response
    if (tmdbData.images) {
      // Logo images
      if (tmdbData.images.logos && tmdbData.images.logos.length > 0) {
        const logo = tmdbData.images.logos[0];
        assets.logos = {
          small: `${baseImageUrl}/w92${logo.file_path}`,
          medium: `${baseImageUrl}/w185${logo.file_path}`,
          large: `${baseImageUrl}/w300${logo.file_path}`,
          original: `${baseImageUrl}/original${logo.file_path}`
        };
      }

      // Still images (scenes)
      if (tmdbData.images.stills && tmdbData.images.stills.length > 0) {
        assets.stills = tmdbData.images.stills.slice(0, 3).map(still => ({
          thumbnail: `${baseImageUrl}/w185${still.file_path}`,
          medium: `${baseImageUrl}/w300${still.file_path}`,
          large: `${baseImageUrl}/w500${still.file_path}`
        }));
      }
    }

    // Trailer information
    if (tmdbData.videos && tmdbData.videos.results) {
      const trailer = tmdbData.videos.results.find(video => 
        video.type === 'Trailer' && video.site === 'YouTube'
      );
      if (trailer) {
        assets.trailer = {
          youtube_key: trailer.key,
          youtube_url: `https://www.youtube.com/watch?v=${trailer.key}`,
          youtube_embed: `https://www.youtube.com/embed/${trailer.key}`
        };
      }
    }

    return assets;
  }

  getMockTMDBData(title, type) {
    // Mock TMDB data for development with visual assets
    const mockPosterPath = '/mock-poster.jpg';
    const mockBackdropPath = '/mock-backdrop.jpg';
    
    return {
      title: title,
      overview: `A ${type} that matches your viewing preferences. This is an engaging story with compelling characters and excellent production values.`,
      vote_average: 7.5,
      runtime: type === 'movie' ? 120 : null,
      genres: [{ name: 'Drama' }, { name: 'Thriller' }],
      poster_path: mockPosterPath,
      backdrop_path: mockBackdropPath,
      tmdb_id: Math.floor(Math.random() * 100000),
      content_type: type === 'movie' ? 'movie' : 'tv',
      visual_assets: {
        posters: {
          thumbnail: `https://via.placeholder.com/154x231/1a1a2e/eee?text=${encodeURIComponent(title)}`,
          small: `https://via.placeholder.com/185x278/1a1a2e/eee?text=${encodeURIComponent(title)}`,
          medium: `https://via.placeholder.com/342x513/1a1a2e/eee?text=${encodeURIComponent(title)}`,
          large: `https://via.placeholder.com/500x750/1a1a2e/eee?text=${encodeURIComponent(title)}`,
          extra_large: `https://via.placeholder.com/780x1170/1a1a2e/eee?text=${encodeURIComponent(title)}`,
          original: `https://via.placeholder.com/1000x1500/1a1a2e/eee?text=${encodeURIComponent(title)}`
        },
        backdrops: {
          small: `https://via.placeholder.com/300x169/16213e/eee?text=${encodeURIComponent(title)}+Backdrop`,
          medium: `https://via.placeholder.com/780x439/16213e/eee?text=${encodeURIComponent(title)}+Backdrop`,
          large: `https://via.placeholder.com/1280x720/16213e/eee?text=${encodeURIComponent(title)}+Backdrop`,
          original: `https://via.placeholder.com/1920x1080/16213e/eee?text=${encodeURIComponent(title)}+Backdrop`
        },
        logos: {},
        stills: [],
        trailer: {
          youtube_key: 'dQw4w9WgXcQ',
          youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          youtube_embed: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        }
      }
    };
  }

  removeDuplicates(results) {
    const seen = new Set();
    return results.filter(item => {
      const key = `${item.title}-${item.year}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Rank recommendations using memory insights
   */
  async rankRecommendationsWithMemory(candidates, context) {
    return candidates
      .map(candidate => ({
        ...candidate,
        context_score: this.calculateContextScore(candidate, context),
        memory_score: this.calculateMemoryScore(candidate, context),
        total_score: this.calculateTotalScore(candidate, context)
      }))
      .sort((a, b) => b.total_score - a.total_score)
      .map(candidate => ({
        title: candidate.title,
        type: candidate.type,
        year: candidate.year,
        genres: candidate.genre_names || [],
        rating: candidate.tmdb_data?.vote_average || 'N/A',
        runtime: candidate.tmdb_data?.runtime || 'Unknown',
        overview: candidate.tmdb_data?.overview || `A ${candidate.type} that matches your viewing preferences.`,
        context_fit_score: Math.round(candidate.context_score),
        memory_fit_score: Math.round(candidate.memory_score),
        total_score: Math.round(candidate.total_score),
        why_recommended: this.generateRecommendationReason(candidate, context),
        tmdb_data: candidate.tmdb_data,
        streaming_sources: candidate.streaming_sources || []
      }));
  }

  /**
   * Calculate memory-based scoring
   */
  calculateMemoryScore(candidate, context) {
    if (!context.memory_insights || context.memory_insights.status === 'no_memory_service') {
      return 50; // Neutral score when no memory available
    }

    let memoryScore = 50; // Base score

    try {
      const { recent_feedback, preference_evolution, viewing_patterns } = context.memory_insights;

      // Score based on recent feedback patterns
      if (recent_feedback && recent_feedback.length > 0) {
        const candidateGenres = (candidate.genre_names || []).map(g => g.toLowerCase());
        
        for (const feedback of recent_feedback) {
          const feedbackGenres = (feedback.data.genres || []).map(g => g.toLowerCase());
          const genreOverlap = candidateGenres.filter(g => feedbackGenres.includes(g)).length;
          
          if (genreOverlap > 0) {
            const feedbackScore = this.feedbackTypeToScore(feedback.data.rating);
            memoryScore += (feedbackScore - 50) * 0.3 * genreOverlap;
          }
        }
      }

      // Score based on preference evolution
      if (preference_evolution?.genre_trends) {
        const candidateGenres = (candidate.genre_names || []).map(g => g.toLowerCase());
        
        for (const genre of candidateGenres) {
          const genreTrend = preference_evolution.genre_trends[genre];
          if (genreTrend && genreTrend.length > 0) {
            const averageRating = genreTrend.reduce((sum, trend) => sum + trend.rating, 0) / genreTrend.length;
            memoryScore += (averageRating - 3) * 10; // Scale 1-5 rating to score impact
          }
        }
      }

      // Score based on viewing context patterns
      if (viewing_patterns?.common_situations) {
        const currentSituation = context.situation.toLowerCase();
        for (const [situation, frequency] of Object.entries(viewing_patterns.common_situations)) {
          if (currentSituation.includes(situation.toLowerCase())) {
            memoryScore += Math.min(frequency * 2, 20); // Boost for familiar situations
          }
        }
      }

    } catch (error) {
      console.error('Error calculating memory score:', error);
    }

    return Math.max(0, Math.min(100, memoryScore));
  }

  /**
   * Calculate total score combining context and memory
   */
  calculateTotalScore(candidate, context) {
    const contextScore = this.calculateContextScore(candidate, context);
    const memoryScore = this.calculateMemoryScore(candidate, context);
    
    // Weight memory more heavily if we have good memory data
    const hasGoodMemory = context.memory_insights?.total_memory_nodes > 5;
    const memoryWeight = hasGoodMemory ? 0.6 : 0.3;
    const contextWeight = 1 - memoryWeight;
    
    return (contextScore * contextWeight) + (memoryScore * memoryWeight);
  }

  /**
   * Convert feedback type to numeric score
   */
  feedbackTypeToScore(feedbackType) {
    const scoreMap = {
      'hated': 10,
      'disliked': 25,
      'neutral': 50,
      'liked': 75,
      'loved': 90
    };
    return scoreMap[feedbackType] || 50;
  }

  /**
   * Store recommendation context for learning
   */
  async storeRecommendationContext(recommendations, context) {
    if (!this.memory) {
      console.error('Cannot store recommendation context - no memory service');
      return;
    }

    try {
      // Store the viewing context
      await this.memory.createMemoryNode('viewing_context', {
        situation: context.situation,
        mood: context.mood,
        timeAvailable: context.timeAvailable,
        companions: context.companions,
        genre_preferences: context.genre_preferences,
        complexity_preference: context.complexity_preference,
        recommendations_provided: recommendations.map(r => ({
          title: r.title,
          type: r.type,
          genres: r.genres,
          total_score: r.total_score
        })),
        timestamp: new Date().toISOString()
      });

      console.error('Stored recommendation context in memory');

    } catch (error) {
      console.error('Failed to store recommendation context:', error);
    }
  }

  /**
   * Rank recommendations with adventure assessment
   */
  async rankRecommendationsWithAdventure(candidates, context) {
    const recommendations = await this.rankRecommendationsWithMemory(candidates, context);
    
    if (!context.adventure_assessment) {
      return recommendations;
    }

    // Apply adventure-aware sorting and labeling
    const adventureEnhanced = recommendations.map((rec, index) => {
      const adventureLevel = this.determineContentAdventureLevel(rec, context, index);
      
      return {
        ...rec,
        adventure_level: adventureLevel,
        adventure_explanation: this.generateAdventureExplanation(rec, adventureLevel, context)
      };
    });

    // Sort based on adventure readiness
    const { readiness_level } = context.adventure_assessment;
    
    if (readiness_level === 'high') {
      // Prioritize challenge content for high adventure readiness
      return adventureEnhanced.sort((a, b) => {
        const adventureScore = { comfort: 1, adjacent: 2, stretch: 3, challenge: 4 };
        return adventureScore[b.adventure_level] - adventureScore[a.adventure_level];
      });
    } else if (readiness_level === 'low') {
      // Prioritize comfort content for low adventure readiness
      return adventureEnhanced.sort((a, b) => {
        const adventureScore = { comfort: 4, adjacent: 3, stretch: 2, challenge: 1 };
        return adventureScore[b.adventure_level] - adventureScore[a.adventure_level];
      });
    }

    // Medium readiness - balanced approach (keep original order but add labels)
    return adventureEnhanced;
  }

  /**
   * Determine adventure level for content
   */
  determineContentAdventureLevel(content, context, index) {
    const userGenrePrefs = context.genre_preferences || [];
    const contentGenres = (content.genres || []).map(g => g.toLowerCase());
    
    // Check genre overlap
    const genreOverlap = contentGenres.filter(g => 
      userGenrePrefs.some(pref => g.includes(pref.toLowerCase()))
    ).length;

    const genreMatch = genreOverlap / Math.max(contentGenres.length, 1);

    // Check memory patterns if available
    let memoryFamiliarity = 0.5;
    if (context.memory_insights?.recent_feedback) {
      const recentGenres = context.memory_insights.recent_feedback
        .flatMap(f => f.data.genres || [])
        .map(g => g.toLowerCase());
      
      const memoryOverlap = contentGenres.filter(g => recentGenres.includes(g)).length;
      memoryFamiliarity = memoryOverlap / Math.max(contentGenres.length, 1);
    }

    // Calculate familiarity score
    const familiarityScore = (genreMatch + memoryFamiliarity) / 2;

    // Position-based adventure level (first = comfort, last = challenge)
    if (index === 0 || familiarityScore > 0.7) {
      return 'comfort';
    } else if (index === 1 || familiarityScore > 0.4) {
      return 'adjacent';
    } else if (index === 2 || familiarityScore > 0.2) {
      return 'stretch';
    } else {
      return 'challenge';
    }
  }

  /**
   * Generate adventure explanation
   */
  generateAdventureExplanation(content, adventureLevel, context) {
    const explanations = {
      comfort: `Perfect for your current ${context.mood} mood - familiar and satisfying`,
      adjacent: `A gentle stretch from your usual preferences - similar feel with a fresh twist`,
      stretch: `Worth trying something new - different from your usual but likely to appeal`,
      challenge: `Ready for an adventure? This could expand your entertainment horizons`
    };

    return explanations[adventureLevel] || explanations.comfort;
  }

  async rankRecommendations(candidates, context) {
    // Fallback for when memory/adventure integration is not available
    return this.rankRecommendationsWithAdventure(candidates, context);
  }

  calculateContextScore(candidate, context) {
    let score = 0;

    // Genre matching
    if (candidate.genre_names && context.genre_preferences) {
      const genreMatch = candidate.genre_names.some(genre => 
        context.genre_preferences.some(pref => 
          genre.toLowerCase().includes(pref.toLowerCase())
        )
      );
      if (genreMatch) score += 30;
    }

    // Time availability matching
    if (candidate.tmdb_data?.runtime) {
      const timeDiff = Math.abs(candidate.tmdb_data.runtime - context.timeAvailable);
      if (timeDiff < 30) score += 20;
      else if (timeDiff < 60) score += 10;
    }

    // Quality score (TMDB rating)
    if (candidate.tmdb_data?.vote_average) {
      score += candidate.tmdb_data.vote_average * 2;
    }

    // Complexity matching
    const complexityScore = this.getComplexityScore(candidate, context.complexity_preference);
    score += complexityScore;

    return score;
  }

  getComplexityScore(candidate, preferredComplexity) {
    const complexGenres = ['drama', 'thriller', 'mystery', 'sci-fi'];
    const simpleGenres = ['comedy', 'romance', 'animation', 'action'];
    
    const genres = (candidate.genre_names || []).map(g => g.toLowerCase());
    const isComplex = genres.some(g => complexGenres.includes(g));
    const isSimple = genres.some(g => simpleGenres.includes(g));

    if (preferredComplexity === 'high' && isComplex) return 15;
    if (preferredComplexity === 'low' && isSimple) return 15;
    if (preferredComplexity === 'medium') return 10;
    
    return 0;
  }

  generateRecommendationReason(candidate, context) {
    const reasons = [];

    // Genre fit
    if (candidate.genre_names && context.genre_preferences) {
      const matchingGenres = candidate.genre_names.filter(genre => 
        context.genre_preferences.some(pref => 
          genre.toLowerCase().includes(pref.toLowerCase())
        )
      );
      if (matchingGenres.length > 0) {
        reasons.push(`Matches your ${context.mood} mood with ${matchingGenres.join(', ')}`);
      }
    }

    // Time fit
    if (candidate.tmdb_data?.runtime && context.timeAvailable) {
      if (Math.abs(candidate.tmdb_data.runtime - context.timeAvailable) < 30) {
        reasons.push(`Perfect length for your ${context.timeAvailable} minute window`);
      }
    }

    // Social context
    if (context.companions !== 'solo') {
      reasons.push(`Great for watching ${context.companions}`);
    }

    // Quality
    if (candidate.tmdb_data?.vote_average > 7) {
      reasons.push(`Highly rated (${candidate.tmdb_data.vote_average}/10)`);
    }

    return reasons.length > 0 ? reasons.join('; ') : 'Recommended based on your preferences';
  }

  generateExplanation(recommendations, context) {
    return `Based on your situation ("${context.situation}") and ${context.mood} mood, I found ${recommendations.length} perfect matches for your ${context.timeAvailable} minute viewing window ${context.companions}. Each recommendation considers your available platforms and current context.`;
  }

  async getPlatformAvailability(title) {
    try {
      if (!this.watchmodeApiKey) {
        console.error('Watchmode API key not found for platform availability');
        return this.getMockAvailability(title);
      }

      console.error(`Getting platform availability for: ${title}`);
      
      // Step 1: Search for the title using correct Watchmode API format
      const searchUrl = `${this.watchmodeBaseUrl}/search/?apiKey=${this.watchmodeApiKey}&search_field=name&search_value=${encodeURIComponent(title)}`;
      console.error('Platform search URL:', searchUrl);
      
      const searchResponse = await axios.get(searchUrl);
      console.error('Platform search response:', searchResponse.status, searchResponse.data);

      if (searchResponse.data.title_results && searchResponse.data.title_results.length > 0) {
        const watchmodeId = searchResponse.data.title_results[0].id;
        const titleInfo = searchResponse.data.title_results[0];
        
        console.error(`Found title: ${titleInfo.name} (Watchmode ID: ${watchmodeId})`);
        
        // Step 2: Get streaming sources using Watchmode ID with regions parameter
        const sourcesUrl = `${this.watchmodeBaseUrl}/title/${watchmodeId}/sources/?apiKey=${this.watchmodeApiKey}&regions=US`;
        console.error('Sources URL:', sourcesUrl);
        
        const sourcesResponse = await axios.get(sourcesUrl);
        console.error('Sources response:', sourcesResponse.status, sourcesResponse.data);

        const enhancedPlatforms = this.enhancePlatformData(sourcesResponse.data || []);

        return {
          title: title,
          watchmode_id: watchmodeId,
          watchmode_title_info: titleInfo,
          platforms: enhancedPlatforms,
          streaming_links: this.generateStreamingLinks(enhancedPlatforms),
          last_updated: new Date().toISOString(),
          source: 'watchmode_api'
        };
      }

      return {
        title: title,
        platforms: [],
        streaming_links: {},
        error: 'Title not found in Watchmode database',
        source: 'watchmode_api'
      };

    } catch (error) {
      console.error('Platform availability error:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status, error.response?.statusText);
      return this.getMockAvailability(title);
    }
  }

  /**
   * Enhance platform data with additional metadata and streaming information
   */
  enhancePlatformData(platforms) {
    return platforms.map(platform => ({
      ...platform,
      platform_name: this.standardizePlatformName(platform.name),
      access_type: this.determinePlatformType(platform.name),
      direct_link: this.generatePlatformLink(platform),
      logo_url: this.getPlatformLogo(platform.name),
      subscription_required: platform.type === 'subscription',
      free_with_ads: platform.type === 'free' || platform.type === 'tubi',
      rental_price: platform.price || null,
      purchase_price: platform.type === 'buy' ? platform.price : null
    }));
  }

  /**
   * Generate direct streaming links for each platform
   */
  generateStreamingLinks(platforms) {
    const links = {};
    
    platforms.forEach(platform => {
      const platformKey = this.standardizePlatformName(platform.name).toLowerCase().replace(/\s+/g, '_');
      
      links[platformKey] = {
        name: platform.platform_name,
        url: platform.web_url || platform.direct_link,
        type: platform.type,
        logo: platform.logo_url,
        subscription_required: platform.subscription_required,
        price: platform.rental_price || platform.purchase_price,
        quality: platform.quality || 'HD'
      };
    });

    return links;
  }

  /**
   * Standardize platform names for consistency
   */
  standardizePlatformName(name) {
    const nameMap = {
      'netflix': 'Netflix',
      'amazon-prime': 'Amazon Prime Video',
      'prime-video': 'Amazon Prime Video',
      'amazon': 'Amazon Prime Video',
      'disney-plus': 'Disney+',
      'disney+': 'Disney+',
      'hbo-max': 'HBO Max',
      'hbomax': 'HBO Max',
      'hulu': 'Hulu',
      'apple-tv-plus': 'Apple TV+',
      'appletv+': 'Apple TV+',
      'paramount-plus': 'Paramount+',
      'paramount+': 'Paramount+',
      'peacock': 'Peacock',
      'vudu': 'Vudu',
      'youtube': 'YouTube Movies',
      'google-play': 'Google Play Movies',
      'itunes': 'iTunes',
      'microsoft': 'Microsoft Store'
    };

    const normalized = name.toLowerCase().trim();
    return nameMap[normalized] || name;
  }

  /**
   * Determine platform type (subscription, rental, purchase, free)
   */
  determinePlatformType(platformName) {
    const subscriptionPlatforms = ['netflix', 'disney+', 'hbo max', 'hulu', 'apple tv+', 'paramount+', 'peacock'];
    const rentalPlatforms = ['vudu', 'amazon prime video', 'google play', 'itunes', 'microsoft store'];
    const freePlatforms = ['tubi', 'crackle', 'imdb tv', 'pluto tv'];

    const name = platformName.toLowerCase();
    
    if (subscriptionPlatforms.some(p => name.includes(p))) return 'subscription';
    if (rentalPlatforms.some(p => name.includes(p))) return 'rental';
    if (freePlatforms.some(p => name.includes(p))) return 'free';
    
    return 'unknown';
  }

  /**
   * Generate direct platform links (these would be actual deep links in production)
   */
  generatePlatformLink(platform) {
    if (platform.web_url) return platform.web_url;
    
    // Generate mock deep links for development
    const platformName = this.standardizePlatformName(platform.name).toLowerCase();
    const baseUrls = {
      'netflix': 'https://netflix.com/title/',
      'amazon prime video': 'https://amazon.com/gp/video/detail/',
      'disney+': 'https://disneyplus.com/movies/',
      'hbo max': 'https://hbomax.com/feature/',
      'hulu': 'https://hulu.com/watch/',
      'apple tv+': 'https://tv.apple.com/movie/',
      'paramount+': 'https://paramountplus.com/movies/',
      'peacock': 'https://peacocktv.com/watch/'
    };

    const baseUrl = baseUrls[platformName];
    return baseUrl ? `${baseUrl}${platform.id || 'mock-id'}` : '#';
  }

  /**
   * Get platform logo URLs
   */
  getPlatformLogo(platformName) {
    const logoMap = {
      'Netflix': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
      'Amazon Prime Video': 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png',
      'Disney+': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg',
      'HBO Max': 'https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg',
      'Hulu': 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg',
      'Apple TV+': 'https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg',
      'Paramount+': 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Paramount_Plus_logo.svg',
      'Peacock': 'https://upload.wikimedia.org/wikipedia/commons/d/d3/NBCUniversal_Peacock_Logo.svg'
    };

    return logoMap[platformName] || `https://via.placeholder.com/100x50/333/fff?text=${encodeURIComponent(platformName)}`;
  }

  getMockAvailability(title) {
    const mockPlatforms = [
      {
        name: 'Netflix',
        type: 'subscription',
        platform_name: 'Netflix',
        access_type: 'subscription',
        direct_link: `https://netflix.com/title/mock-${encodeURIComponent(title)}`,
        logo_url: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
        subscription_required: true,
        free_with_ads: false,
        rental_price: null,
        purchase_price: null,
        quality: 'HD'
      },
      {
        name: 'Amazon Prime Video',
        type: 'subscription',
        platform_name: 'Amazon Prime Video',
        access_type: 'subscription',
        direct_link: `https://amazon.com/gp/video/detail/mock-${encodeURIComponent(title)}`,
        logo_url: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png',
        subscription_required: true,
        free_with_ads: false,
        rental_price: null,
        purchase_price: null,
        quality: 'HD'
      },
      {
        name: 'Vudu',
        type: 'rental',
        platform_name: 'Vudu',
        access_type: 'rental',
        direct_link: `https://vudu.com/content/movies/details/mock-${encodeURIComponent(title)}`,
        logo_url: 'https://via.placeholder.com/100x50/333/fff?text=Vudu',
        subscription_required: false,
        free_with_ads: false,
        rental_price: '$3.99',
        purchase_price: '$12.99',
        quality: 'HD'
      }
    ];

    return {
      title: title,
      watchmode_id: `mock-${Date.now()}`,
      platforms: mockPlatforms,
      streaming_links: {
        netflix: {
          name: 'Netflix',
          url: `https://netflix.com/title/mock-${encodeURIComponent(title)}`,
          type: 'subscription',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
          subscription_required: true,
          price: null,
          quality: 'HD'
        },
        amazon_prime_video: {
          name: 'Amazon Prime Video',
          url: `https://amazon.com/gp/video/detail/mock-${encodeURIComponent(title)}`,
          type: 'subscription',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png',
          subscription_required: true,
          price: null,
          quality: 'HD'
        },
        vudu: {
          name: 'Vudu',
          url: `https://vudu.com/content/movies/details/mock-${encodeURIComponent(title)}`,
          type: 'rental',
          logo: 'https://via.placeholder.com/100x50/333/fff?text=Vudu',
          subscription_required: false,
          price: '$3.99',
          quality: 'HD'
        }
      },
      last_updated: new Date().toISOString(),
      note: 'Mock data - configure Watchmode API key for real availability'
    };
  }

  async learnFromFeedback({ recommendationTitle, feedbackType, feedbackReason }) {
    try {
      console.error(`Learning from feedback: ${recommendationTitle} - ${feedbackType}`);
      
      // Store feedback in memory
      const feedback = {
        title: recommendationTitle,
        rating: feedbackType,
        reason: feedbackReason,
        timestamp: new Date().toISOString()
      };

      if (this.memory) {
        // Store detailed feedback in memory
        await this.memory.createMemoryNode('feedback', {
          recommendation_title: recommendationTitle,
          feedback_type: feedbackType,
          feedback_reason: feedbackReason,
          rating: this.feedbackTypeToScore(feedbackType),
          timestamp: new Date().toISOString()
        });

        // Get content details if available
        const contentDetails = await this.getContentDetailsForLearning(recommendationTitle);
        if (contentDetails) {
          // Store content-specific learning
          await this.memory.createMemoryNode('content_preference', {
            title: recommendationTitle,
            genres: contentDetails.genres || [],
            content_type: contentDetails.type,
            user_rating: feedbackType,
            tmdb_rating: contentDetails.vote_average,
            why_liked_disliked: feedbackReason,
            timestamp: new Date().toISOString()
          });
        }

        console.error('Feedback stored in memory successfully');
      }

      return {
        status: 'feedback_recorded',
        title: recommendationTitle,
        feedback_type: feedbackType,
        message: `Thank you for the ${feedbackType} feedback on "${recommendationTitle}". This will help improve future recommendations.`,
        learning_applied: this.generateLearningInsight(feedbackType, feedbackReason),
        memory_updated: !!this.memory
      };

    } catch (error) {
      console.error('Error learning from feedback:', error);
      return {
        status: 'feedback_error',
        title: recommendationTitle,
        feedback_type: feedbackType,
        message: `Feedback received but had trouble storing it for learning.`,
        error: error.message
      };
    }
  }

  /**
   * Get content details for learning purposes
   */
  async getContentDetailsForLearning(title) {
    try {
      // Try to get TMDB data for learning
      const tmdbData = await this.getTMDBData(title, 'movie');
      if (tmdbData) {
        return {
          genres: tmdbData.genres?.map(g => g.name) || [],
          type: 'movie',
          vote_average: tmdbData.vote_average,
          overview: tmdbData.overview
        };
      }

      // Try as TV series if movie fails
      const tvData = await this.getTMDBData(title, 'tv');
      if (tvData) {
        return {
          genres: tvData.genres?.map(g => g.name) || [],
          type: 'tv_series',
          vote_average: tvData.vote_average,
          overview: tvData.overview
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to get content details for learning:', error);
      return null;
    }
  }

  generateLearningInsight(feedbackType, reason) {
    const insights = {
      'loved': 'Will prioritize similar content and genres in future recommendations',
      'liked': 'Will note positive elements for similar future suggestions',
      'neutral': 'Will consider this as a baseline preference',
      'disliked': 'Will avoid similar content patterns in future recommendations', 
      'hated': 'Will strongly avoid this type of content and similar characteristics'
    };

    return insights[feedbackType] || 'Will incorporate this feedback into future recommendations';
  }

  async initializeUserMemoryIfNeeded() {
    if (!this.memory) {
      console.error('Memory service not available for initialization');
      return;
    }

    try {
      const userMemory = await this.memory.retrieveLocalMemory();
      const hasProfile = userMemory.some(node => node.type === 'user_profile');
      
      if (!hasProfile) {
        console.error('First-time user detected - initializing memory nodes');
        
        // Create basic user profile
        await this.memory.createMemoryNode('user_profile', {
          entertainment_personality: 'discovering',
          overall_satisfaction_score: 0,
          created_at: new Date().toISOString(),
          first_time_user: true
        });
        
        // Create adventure profile
        await this.memory.createMemoryNode('adventure_profile', {
          risk_tolerance: 'medium',
          expansion_success_rate: 0,
          comfort_genres: [],
          explored_genres: [],
          created_at: new Date().toISOString()
        });
        
        console.error('Initial memory nodes created successfully');
      }
    } catch (error) {
      console.error('Error initializing user memory:', error);
    }
  }

  async getFallbackRecommendations() {
    return [
      {
        title: 'The Office',
        type: 'tv_series',
        year: 2005,
        reason: 'Popular comfort viewing for any mood'
      },
      {
        title: 'Spirited Away',
        type: 'movie', 
        year: 2001,
        reason: 'Universally beloved, great for any viewing situation'
      },
      {
        title: 'Brooklyn Nine-Nine',
        type: 'tv_series',
        year: 2013,
        reason: 'Light comedy perfect for casual viewing'
      }
    ];
  }
}