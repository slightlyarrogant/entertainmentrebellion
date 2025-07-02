# Movie & Streaming Data Sources - Developer Reference

## Critical Context
_Essential API options for Entertainment Discovery Rebellion implementation:_
- **Primary recommendation**: Watchmode + TMDB for best balance of features and free tier limits
- **Alternative options**: 8 additional APIs discovered with different strengths and pricing models  
- **Specialized sources**: Netflix-specific (uNoGS), comprehensive streaming (Streaming Availability API), metadata-rich (OMDb)
- **Implementation strategy**: Start with primary APIs, evaluate alternatives if rate limits or coverage insufficient

## Updated: 2025-06-18

## 1. Primary Recommended APIs

### Watchmode API ⭐ (Original Choice)
- **Purpose**: Cross-platform streaming availability  
- **Free Tier**: 1,000 requests/day
- **Coverage**: Netflix, Amazon Prime, Disney+, Hulu, HBO Max, Apple TV+, 200+ services
- **Strengths**: Real-time availability, geographic filtering, reliable updates
- **URL**: https://api.watchmode.com
- **Best for**: Live platform availability checking

### TMDB API ⭐ (Original Choice)  
- **Purpose**: Rich movie/TV metadata
- **Free Tier**: 1,000 requests/day
- **Coverage**: Movies, TV shows, cast, crew, ratings, images
- **Strengths**: High-quality data, extensive metadata, good documentation
- **URL**: https://developer.themoviedb.org
- **Best for**: Content metadata and enrichment

## 2. Additional Streaming Availability APIs

### Streaming Availability API (MovieOfTheNight) ⭐⭐
- **Purpose**: Comprehensive streaming availability across 60 countries
- **Pricing**: Free tier available via RapidAPI, paid plans for higher usage
- **Coverage**: Netflix, Disney+, Apple TV, Max, Hulu, 20+ services across 60 countries  
- **Strengths**: Deep links, Top 10 lists, extensive geographic coverage, well-documented
- **URL**: https://docs.movieofthenight.com/
- **GitHub**: https://github.com/movieofthenight/streaming-availability-api
- **Best for**: International availability, comprehensive platform coverage
- **Notes**: Very active development, excellent documentation, client libraries available

### JustWatch API ⭐
- **Purpose**: Streaming availability and metadata
- **Access**: Partner API (requires business relationship)
- **Coverage**: Major streaming platforms globally
- **Strengths**: Accurate availability data, pricing information
- **URL**: https://apis.justwatch.com/docs/api/
- **Best for**: Production applications with business partnership
- **Notes**: Not ideal for hackathon due to partnership requirements

### uNoGS API (Netflix-specific)
- **Purpose**: Unofficial Netflix catalog search  
- **Access**: Via RapidAPI platform
- **Coverage**: Netflix catalog across all global regions
- **Strengths**: Netflix-specific, global region support, search capabilities
- **URL**: https://rapidapi.com/unogs/api/unogs
- **Best for**: Netflix-focused applications
- **Notes**: Netflix-only, may have legal considerations for commercial use

## 3. Metadata & Movie Information APIs

### OMDb API ⭐
- **Purpose**: Movie and TV series metadata
- **Free Tier**: 1,000 requests/day, small donation removes limit
- **Coverage**: Movies, basic TV shows, ratings from multiple sources
- **Strengths**: Simple, reliable, includes IMDb data, affordable upgrade
- **URL**: https://www.omdbapi.com/
- **Best for**: Simple metadata needs, IMDb integration
- **Notes**: Limited TV show information compared to TMDB

### TVmaze API
- **Purpose**: TV show information and scheduling  
- **Free Tier**: Free with no stated limits
- **Coverage**: TV shows, episodes, schedules, cast information
- **Strengths**: TV-focused, episode-level data, scheduling information
- **URL**: https://www.tvmaze.com/api
- **Best for**: TV show-specific applications
- **Notes**: TV shows only, no movie coverage

### TV-API
- **Purpose**: Aggregated movie/TV data from multiple sources
- **Coverage**: IMDb, TMDb, Wikipedia, RottenTomatoes, Metacritic
- **Access**: Commercial service
- **URL**: https://tv-api.com/
- **Best for**: Aggregated metadata from multiple sources
- **Notes**: Commercial pricing, combines multiple data sources

## 4. Specialized APIs

### Trakt API
- **Purpose**: Movie and TV tracking, social features
- **Free Tier**: Available for non-commercial use
- **Coverage**: Movies, TV shows, user tracking, social features
- **Strengths**: User tracking, social features, watchlist management
- **Best for**: Social viewing applications, personal tracking
- **Notes**: Requires user authentication for most features

## 5. Implementation Recommendations

### For Hackathon Demo (Our Current Approach)
```
Primary: Watchmode (availability) + TMDB (metadata)
Backup: Streaming Availability API if rate limits exceeded
```

### For Production Scaling
```
Consider: Streaming Availability API for comprehensive coverage
Alternative: JustWatch API with business partnership
Metadata: TMDB + OMDb for richer data sources
```

### For Specialized Needs
```
Netflix-focused: uNoGS API
TV show-heavy: TVmaze API + TMDB
Social features: Trakt API integration
International: Streaming Availability API (60 countries)
```

## 6. API Selection Matrix

| API | Streaming Availability | Metadata Quality | Free Tier | Geographic Coverage | Documentation |
|-----|----------------------|------------------|-----------|-------------------|---------------|
| **Watchmode** | ⭐⭐⭐ | ⭐⭐ | 1,000/day | Good | ⭐⭐⭐ |
| **TMDB** | ⭐ | ⭐⭐⭐ | 1,000/day | Excellent | ⭐⭐⭐ |
| **Streaming Availability** | ⭐⭐⭐ | ⭐⭐ | Free tier | Excellent (60 countries) | ⭐⭐⭐ |
| **uNoGS** | ⭐⭐ (Netflix only) | ⭐⭐ | Via RapidAPI | Good | ⭐⭐ |
| **OMDb** | ❌ | ⭐⭐⭐ | 1,000/day | Good | ⭐⭐⭐ |
| **JustWatch** | ⭐⭐⭐ | ⭐⭐⭐ | Business only | Excellent | ⭐⭐ |

## 7. Implementation Notes for Developer

### Rate Limit Management
- Implement caching for popular content
- Use multiple APIs to distribute load
- Cache metadata separately from availability data
- Consider API rotation for higher throughput

### Data Quality Considerations
- TMDB has best metadata quality and coverage
- Watchmode most reliable for real-time availability
- Streaming Availability API best for international coverage
- Cross-reference availability data when possible

### Error Handling Strategy
```python
# Fallback hierarchy for availability data
try:
    availability = watchmode_api.get_availability(title)
except RateLimitError:
    availability = streaming_availability_api.get_platforms(title)
except:
    availability = ["Platform data unavailable"]
```

### Legal Considerations
- Respect rate limits and terms of service
- uNoGS is "unofficial" - consider legal implications
- Cache responsibly to reduce API load
- Attribute data sources appropriately

---

This comprehensive list provides multiple implementation options based on specific needs, rate limits, and feature requirements. The developer can choose the optimal combination for our Entertainment Discovery Rebellion project.
