# Module Specification: Content Discovery Engine (MCP-002)

## Critical Context
_The 3-5 most important technical insights:_
- **Hybrid API approach**: Watchmode (availability) + TMDB (metadata) provides comprehensive real-time data
- **AI enrichment layer**: Custom context scoring beyond raw metadata for intelligent recommendations  
- **Competitive advantage**: Live platform data vs static datasets used by most participants
- **Hackathon optimization**: Focus on ~1000 popular titles, US market, major platforms for demo scope

## Module ID: MCP-002
**Last Updated:** 2025-07-02  
**Status:** Implemented  
**Dependencies:** API keys (Watchmode, TMDB)

## 1. Technical Architecture

### Data Sources Strategy
**See comprehensive API reference: `Movie-Data-Sources-Reference.md`**

**Primary APIs (Recommended for Hackathon):**
- **Watchmode API**: Real-time streaming availability across platforms
  - Free tier: 1,000 requests/day
  - Coverage: Netflix, Amazon Prime, Disney+, Hulu, HBO Max, Apple TV+, 200+ services
  - Geographic filtering: US market focus for hackathon
  - Real-time updates when content appears/disappears

- **TMDB API**: Rich content metadata  
  - Free tier: 1,000 requests/day
  - Data: Cast, plot, ratings, genres, runtime, release dates
  - High-quality poster images and promotional materials
  - User ratings and review aggregation

**Alternative/Backup APIs:**
- **Streaming Availability API**: 60 countries, 20+ services, excellent documentation
- **uNoGS API**: Netflix-specific catalog search across global regions
- **OMDb API**: IMDb-sourced metadata, simple and reliable
- **TVmaze API**: TV show-focused with episode-level data

**Implementation Strategy**: Start with Watchmode + TMDB, evaluate alternatives if rate limits insufficient

### AI Enrichment Layer
**Beyond raw API data, custom intelligence:**
```python
def calculate_context_suitability(metadata):
    return {
        'time_commitment': categorize_runtime(metadata.runtime),
        'mood_mapping': analyze_genre_mood(metadata.genres), 
        'complexity_score': analyze_plot_complexity(metadata.overview),
        'social_context': determine_viewing_context(metadata),
        'energy_level': categorize_required_attention(metadata)
    }
```

### Implementation Approach
**Implemented features:**
1. **API Integration**: ✅ Watchmode + TMDB APIs fully integrated with fallback to mock data
2. **Context Intelligence**: ✅ Sophisticated context analysis including mood, time, companions, energy level
3. **Memory Integration**: ✅ Enhanced context with user preferences and viewing history
4. **Adventure Assessment**: ✅ Content recommendation stretching based on user readiness
5. **Visual Artifacts**: ✅ Rich HTML recommendation cards with posters and streaming links
6. **Platform Intelligence**: ✅ Complex subscription contexts (personal/shared/family/situational)
7. **Learning System**: ✅ Feedback processing updates memory for improved recommendations

## 2. MCP Tools Specification

### discover_content_with_context()
```python
@tool
def discover_content_with_context(
    situation_description: str,
    mood: str, 
    time_available: int,
    viewing_companions: str
):
    """Find perfect content based on complex real-world context"""
    
    # Parse user situation from natural language
    context = parse_viewing_situation(situation_description)
    
    # Query memory for user's available platforms in current context  
    available_platforms = query_accessible_platforms(context)
    
    # Get real-time content availability
    available_content = watchmode_api.get_content_by_platforms(available_platforms)
    
    # Enrich with TMDB metadata
    enriched_content = []
    for item in available_content:
        metadata = tmdb_api.get_details(item.id)
        context_score = calculate_context_suitability(metadata, context)
        enriched_content.append({
            'title': item,
            'metadata': metadata, 
            'context_fit': context_score,
            'availability': item.platforms
        })
    
    # AI-powered filtering and ranking
    recommendations = ai_rank_by_context(enriched_content, context)
    
    return top_3_with_explanations(recommendations)
```

### get_platform_availability()
```python
@tool  
def get_platform_availability(title: str):
    """Check where specific content is currently available"""
    watchmode_data = watchmode_api.search_title(title)
    return {
        'platforms': watchmode_data.sources,
        'last_updated': watchmode_data.updated_at,
        'geographic_restrictions': watchmode_data.regions
    }
```

## 3. Alternative Implementation Options

### Option A: Multiple API Approach
**If primary APIs hit rate limits:**
```python
class MultiAPIContentSource:
    def get_availability_with_fallback(self, title):
        try:
            return watchmode_api.get_availability(title)
        except RateLimitError:
            return streaming_availability_api.get_platforms(title)
        except:
            return self.scrape_as_last_resort(title)
            
    def get_enhanced_metadata(self, title):
        tmdb_data = tmdb_api.get_details(title)
        omdb_data = omdb_api.get_ratings(title)  # Add IMDb ratings
        return self.merge_metadata(tmdb_data, omdb_data)
```

### Option B: Bright Data Scraping Approach
**Fallback strategy using existing infrastructure:**
```python
class StreamingPlatformScraper:
    def scrape_netflix_catalog(self):
        # Direct platform scraping for real-time data
        # Handles geo-restrictions and dynamic catalogs
        pass
        
    def scrape_content_metadata(self, title):
        # Aggregate metadata from multiple sources
        # IMDb, Rotten Tomatoes, platform-specific data
        pass
```

**Multi-API Pros**: Higher rate limits, data source redundancy, better coverage  
**Scraping Pros**: No API rate limits, real-time platform data, comprehensive coverage  
**Scraping Cons**: Higher maintenance overhead, potential ToS considerations, implementation complexity

## 4. Competitive Advantages

### What Others Will Build
- Static datasets or mock data
- Simple recommendation algorithms without platform awareness
- Form-based preference collection
- No real-time availability checking

### What We Deliver  
- **Live streaming data** showing what's actually available NOW
- **Context-aware intelligence** understanding viewing situations
- **Natural conversation** for preference gathering
- **Platform-aware filtering** respecting user's actual subscriptions
- **AI explanations** for why recommendations fit current context

## 5. Implementation Timeline

**Week 1 (June 19-21):**
- API key acquisition and testing
- Basic content discovery tool working
- Integration with memory system for user context

**Week 2 (June 22-29):**
- Context intelligence refinement  
- Demo scenario optimization
- Performance optimization and caching

## 6. Success Metrics

- **Functional**: 3 relevant recommendations in under 10 seconds
- **Accuracy**: Recommendations match user context and platform availability  
- **Demo Impact**: Clear demonstration of AI intelligence vs static algorithms
- **Technical Sophistication**: Judges appreciate real-time data integration

## 7. Risk Mitigation

**API Rate Limits**: 
- Multiple API fallback strategy (Watchmode → Streaming Availability API → scraping)
- Cache popular content for demo scenarios
- Focus demo on pre-loaded dataset of ~1,000 titles

**API Unavailability**: 
- Primary: Streaming Availability API as backup to Watchmode
- Secondary: Bright Data scraping as last resort
- Local fallback: Pre-cached dataset for demo continuity

**Data Quality**: 
- Cross-reference availability data between APIs when possible
- Validate recommendations through demo testing
- Use multiple metadata sources (TMDB + OMDb) for richer data

**Performance**: 
- Optimize for demo scenarios vs comprehensive coverage
- Implement intelligent caching based on content popularity
- Use async requests for multiple API calls

---

This module specification provides the technical foundation for intelligent content discovery while balancing hackathon constraints with sophisticated AI demonstration.
