#!/usr/bin/env node

// Demo runs independently of the MCP server
// import { EntertainmentDiscoveryServer } from '../src/index.js';

class DemoScenario {
  constructor() {
    this.scenarios = [
      {
        name: 'Stressed After Work - Solo Viewing',
        context: {
          situation_description: 'Just finished a really stressful day at work, partner is out of town, need something to help me unwind',
          mood: 'stressed',
          time_available: 90,
          viewing_companions: 'solo'
        },
        subscriptions: [
          { contextType: 'personal', platform: 'Netflix', accessDetails: 'Always available, my personal account' },
          { contextType: 'shared', platform: 'Disney+', accessDetails: 'Partner\'s account, only when they\'re home' },
          { contextType: 'family', platform: 'HBO Max', accessDetails: 'Family account, weekends only' }
        ]
      },
      {
        name: 'Date Night Planning',
        context: {
          situation_description: 'Planning a cozy date night at home, want something romantic but not too heavy',
          mood: 'romantic',
          time_available: 120,
          viewing_companions: 'with partner'
        },
        subscriptions: [
          { contextType: 'personal', platform: 'Netflix', accessDetails: 'Always available' },
          { contextType: 'shared', platform: 'Disney+', accessDetails: 'Available when partner is home' },
          { contextType: 'personal', platform: 'Amazon Prime', accessDetails: 'Always available' }
        ]
      },
      {
        name: 'Family Weekend Entertainment',
        context: {
          situation_description: 'Weekend morning with kids ages 8 and 12, want something everyone can enjoy together',
          mood: 'cheerful',
          time_available: 100,
          viewing_companions: 'family with kids'
        },
        subscriptions: [
          { contextType: 'family', platform: 'Disney+', accessDetails: 'Family account, always available on weekends' },
          { contextType: 'personal', platform: 'Netflix', accessDetails: 'Always available' },
          { contextType: 'family', platform: 'HBO Max', accessDetails: 'Family account, weekends and evenings' }
        ]
      }
    ];
  }

  async runDemo(scenarioIndex = 0) {
    if (scenarioIndex >= this.scenarios.length) {
      console.log('Invalid scenario index');
      return;
    }

    const scenario = this.scenarios[scenarioIndex];
    console.log(`\n🎬 DEMO SCENARIO: ${scenario.name}`);
    console.log('='.repeat(50));

    try {
      // Simulate the MCP server workflow
      console.log('\n📋 STEP 1: Setting up subscription contexts...');
      await this.setupSubscriptionContexts(scenario.subscriptions);

      console.log('\n🔍 STEP 2: Discovering content based on context...');
      const recommendations = await this.getRecommendations(scenario.context);

      console.log('\n🎯 STEP 3: Presenting recommendations...');
      this.presentRecommendations(recommendations, scenario);

      console.log('\n💬 STEP 4: Simulating user feedback...');
      await this.simulateFeedback(recommendations);

    } catch (error) {
      console.error('Demo error:', error);
    }
  }

  async setupSubscriptionContexts(subscriptions) {
    for (const sub of subscriptions) {
      console.log(`   ✓ ${sub.platform} (${sub.contextType}): ${sub.accessDetails}`);
    }
    console.log(`   📊 Total platforms configured: ${subscriptions.length}`);
  }

  async getRecommendations(context) {
    // Simulate the content discovery process
    console.log(`   🎯 Analyzing situation: "${context.situation_description}"`);
    console.log(`   😊 Mood: ${context.mood}`);
    console.log(`   ⏰ Time available: ${context.time_available} minutes`);
    console.log(`   👥 Viewing context: ${context.viewing_companions}`);

    // Mock recommendations based on context
    const mockRecommendations = this.generateMockRecommendations(context);
    
    console.log('   🧠 AI Context Analysis:');
    console.log(`      - Energy level: ${this.inferEnergyLevel(context.mood, context.time_available)}`);
    console.log(`      - Complexity preference: ${this.inferComplexityPreference(context.situation_description, context.mood)}`);
    console.log(`      - Genre preferences: ${this.inferGenrePreferences(context.mood, context.viewing_companions).join(', ')}`);

    return mockRecommendations;
  }

  generateMockRecommendations(context) {
    const recommendations = {
      'stressed': [
        {
          title: 'Brooklyn Nine-Nine',
          type: 'tv_series',
          year: 2013,
          genres: ['Comedy'],
          rating: 8.4,
          runtime: 22,
          overview: 'A comedic workplace series that follows a team of detectives in Brooklyn.',
          context_fit_score: 85,
          why_recommended: 'Perfect for stress relief with light comedy; short episodes fit your 90-minute window; highly rated comfort viewing'
        },
        {
          title: 'The Grand Budapest Hotel',
          type: 'movie',
          year: 2014,
          genres: ['Comedy', 'Drama'],
          rating: 8.1,
          runtime: 99,
          overview: 'A whimsical tale of a legendary concierge and his protégé.',
          context_fit_score: 78,
          why_recommended: 'Visually stunning and whimsical; perfect runtime for your evening; acclaimed stress-relieving entertainment'
        },
        {
          title: 'Queer Eye',
          type: 'tv_series',
          year: 2018,
          genres: ['Reality'],
          rating: 8.5,
          runtime: 45,
          overview: 'Feel-good makeover show that celebrates positivity and self-improvement.',
          context_fit_score: 72,
          why_recommended: 'Uplifting and positive; perfect for unwinding after stressful day; episode length works for solo viewing'
        }
      ],
      'romantic': [
        {
          title: 'The Half of It',
          type: 'movie',
          year: 2020,
          genres: ['Romance', 'Drama'],
          rating: 7.3,
          runtime: 104,
          overview: 'A shy student helps write love letters, leading to unexpected romance.',
          context_fit_score: 88,
          why_recommended: 'Perfect date night length; thoughtful romance without being heavy; excellent for couples viewing'
        },
        {
          title: 'Bridgerton',
          type: 'tv_series',
          year: 2020,
          genres: ['Romance', 'Drama'],
          rating: 7.3,
          runtime: 60,
          overview: 'Regency-era romance with beautiful costumes and compelling relationships.',
          context_fit_score: 82,
          why_recommended: 'Romantic and visually stunning; perfect for date night; binge-worthy for couples'
        },
        {
          title: 'To All the Boys I\'ve Loved Before',
          type: 'movie',
          year: 2018,
          genres: ['Romance', 'Comedy'],
          rating: 7.0,
          runtime: 99,
          overview: 'A teen\'s secret love letters get mailed out, changing her life.',
          context_fit_score: 75,
          why_recommended: 'Light romantic comedy; perfect runtime for cozy evening; feel-good entertainment for couples'
        }
      ],
      'cheerful': [
        {
          title: 'Moana',
          type: 'movie',
          year: 2016,
          genres: ['Animation', 'Adventure'],
          rating: 7.6,
          runtime: 107,
          overview: 'A Polynesian teenager sails across the Pacific to save her island.',
          context_fit_score: 92,
          why_recommended: 'Perfect family entertainment; great music and adventure; appropriate for kids 8-12; uplifting story'
        },
        {
          title: 'Avatar: The Last Airbender',
          type: 'tv_series',
          year: 2005,
          genres: ['Animation', 'Adventure'],
          rating: 9.3,
          runtime: 24,
          overview: 'A young airbender must master all four elements to save the world.',
          context_fit_score: 89,
          why_recommended: 'Excellent for family viewing; appeals to both kids and adults; epic adventure with great values'
        },
        {
          title: 'The Incredibles',
          type: 'movie',
          year: 2004,
          genres: ['Animation', 'Action'],
          rating: 8.0,
          runtime: 115,
          overview: 'A family of superheroes must work together to save the world.',
          context_fit_score: 85,
          why_recommended: 'Classic family favorite; action-packed but appropriate; great for weekend family time'
        }
      ]
    };

    return {
      recommendations: recommendations[context.mood] || recommendations['stressed'],
      context_analysis: context,
      explanation: `Based on your ${context.mood} mood and ${context.viewing_companions} context, I found 3 perfect matches for your ${context.time_available} minute viewing window. Each recommendation considers your available platforms and current situation.`
    };
  }

  presentRecommendations(recommendations, scenario) {
    console.log('\n🏆 TOP 3 RECOMMENDATIONS:');
    console.log('-'.repeat(40));

    recommendations.recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.title} (${rec.year})`);
      console.log(`   📱 Type: ${rec.type.replace('_', ' ')} | ⭐ Rating: ${rec.rating}/10 | ⏱️  Runtime: ${rec.runtime} min`);
      console.log(`   🎭 Genres: ${rec.genres.join(', ')}`);
      console.log(`   📝 ${rec.overview}`);
      console.log(`   🎯 Context Fit: ${rec.context_fit_score}%`);
      console.log(`   💡 Why recommended: ${rec.why_recommended}`);
    });

    console.log(`\n🤖 AI Explanation: ${recommendations.explanation}`);
  }

  async simulateFeedback(recommendations) {
    const feedbackScenarios = [
      { title: recommendations.recommendations[0].title, feedback: 'loved', reason: 'Perfect for my mood, exactly what I needed' },
      { title: recommendations.recommendations[1].title, feedback: 'liked', reason: 'Good choice, enjoyed it' },
      { title: recommendations.recommendations[2].title, feedback: 'neutral', reason: 'It was okay, not really my style' }
    ];

    feedbackScenarios.forEach(feedback => {
      console.log(`   👍 Feedback on "${feedback.title}": ${feedback.feedback} - ${feedback.reason}`);
    });

    console.log('   🧠 Learning applied: Will prioritize similar comedy content for stress relief scenarios');
  }

  // Context analysis helper methods
  inferEnergyLevel(mood, timeAvailable) {
    const lowEnergyMoods = ['tired', 'relaxed', 'calm', 'peaceful', 'stressed'];
    const highEnergyMoods = ['excited', 'energetic', 'pumped', 'motivated', 'cheerful'];
    
    if (lowEnergyMoods.includes(mood?.toLowerCase()) || timeAvailable > 180) {
      return 'low - perfect for relaxed viewing';
    } else if (highEnergyMoods.includes(mood?.toLowerCase()) || timeAvailable < 90) {
      return 'high - good for engaging content';
    }
    return 'medium - balanced entertainment';
  }

  inferComplexityPreference(situation, mood) {
    const lowComplexityIndicators = ['tired', 'stressed', 'background', 'casual', 'relaxed'];
    const highComplexityIndicators = ['engage', 'think', 'learn', 'challenge', 'focus'];
    
    const text = `${situation} ${mood}`.toLowerCase();
    
    if (lowComplexityIndicators.some(indicator => text.includes(indicator))) {
      return 'low - simple, easy to follow';
    } else if (highComplexityIndicators.some(indicator => text.includes(indicator))) {
      return 'high - thought-provoking content';
    }
    return 'medium - balanced complexity';
  }

  inferGenrePreferences(mood, companions) {
    const genreMap = {
      'stressed': ['comedy', 'romance', 'feel-good'],
      'sad': ['comedy', 'feel-good', 'romance'],
      'excited': ['action', 'adventure', 'thriller'],
      'thoughtful': ['drama', 'documentary', 'sci-fi'],
      'romantic': ['romance', 'drama'],
      'cheerful': ['comedy', 'animation', 'adventure'],
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

    return [...new Set(preferences)];
  }

  async runAllScenarios() {
    console.log('🎬 ENTERTAINMENT DISCOVERY REBELLION - DEMO SHOWCASE');
    console.log('='.repeat(60));
    console.log('Conversational AI Media Advisor - TasteRay Hackathon 2025');

    for (let i = 0; i < this.scenarios.length; i++) {
      await this.runDemo(i);
      if (i < this.scenarios.length - 1) {
        console.log('\n' + '🔄 NEXT SCENARIO'.padStart(30, '=').padEnd(60, '='));
      }
    }

    console.log('\n✨ DEMO COMPLETE - COMPETITIVE ADVANTAGES DEMONSTRATED:');
    console.log('   🗣️  Natural conversation vs form-based interfaces');
    console.log('   🧠 Context-aware AI intelligence vs simple algorithms');
    console.log('   📱 Real-time subscription awareness vs static recommendations');
    console.log('   🔄 Adaptive learning from user feedback');
    console.log('   ⚡ MCP architecture vs typical web applications');
  }
}

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const demo = new DemoScenario();
  
  const scenarioIndex = process.argv[2] ? parseInt(process.argv[2]) : null;
  
  if (scenarioIndex !== null) {
    demo.runDemo(scenarioIndex);
  } else {
    demo.runAllScenarios();
  }
}

export { DemoScenario };