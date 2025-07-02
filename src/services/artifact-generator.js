/**
 * Artifact Generator Service
 * Creates rich visual artifacts for Claude Desktop to display recommendations
 */

export class ArtifactGeneratorService {
  constructor() {
    this.templateCache = new Map();
  }

  /**
   * Generate visual recommendation artifact for Claude Desktop
   */
  generateRecommendationArtifact(recommendations, context, adventureAssessment) {
    const artifactId = `entertainment-recommendations-${Date.now()}`;
    
    const artifact = {
      type: 'application/vnd.artifact+html',
      identifier: artifactId,
      title: 'Entertainment Recommendations',
      content: this.buildRecommendationHTML(recommendations, context, adventureAssessment)
    };

    return artifact;
  }

  /**
   * Build the HTML content for recommendation cards
   */
  buildRecommendationHTML(recommendations, context, adventureAssessment) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Entertainment Recommendations</title>
    <style>
        ${this.getRecommendationCSS()}
    </style>
</head>
<body>
    <div class="recommendations-container">
        ${this.buildContextHeader(context, adventureAssessment)}
        ${this.buildRecommendationGrid(recommendations)}
        ${this.buildFooter()}
    </div>
    <script>
        ${this.getInteractionScript()}
    </script>
</body>
</html>`;

    return html;
  }

  /**
   * Build context header with adventure assessment
   */
  buildContextHeader(context, adventureAssessment) {
    const adventureEmoji = {
      'high': '🚀',
      'medium': '🎯', 
      'low': '🏠'
    };

    const adventureBadge = {
      'high': 'adventure-high',
      'medium': 'adventure-medium',
      'low': 'adventure-comfort'
    };

    return `
    <div class="context-header">
        <h1>Perfect Picks for You</h1>
        <div class="context-info">
            <div class="situation">
                <span class="icon">🎬</span>
                <span>${context.situation}</span>
            </div>
            <div class="mood">
                <span class="icon">😊</span>
                <span>Feeling ${context.mood}</span>
            </div>
            <div class="time">
                <span class="icon">⏱️</span>
                <span>${context.timeAvailable} minutes available</span>
            </div>
            <div class="companions">
                <span class="icon">👥</span>
                <span>${context.companions}</span>
            </div>
        </div>
        <div class="adventure-assessment">
            <span class="adventure-badge ${adventureBadge[adventureAssessment?.readiness_level || 'medium']}">
                ${adventureEmoji[adventureAssessment?.readiness_level || 'medium']} 
                ${this.formatAdventureLevel(adventureAssessment?.readiness_level || 'medium')}
            </span>
            <span class="assessment-text">${adventureAssessment?.reasoning || 'Balanced recommendations for you'}</span>
        </div>
    </div>`;
  }

  /**
   * Build the main recommendation grid
   */
  buildRecommendationGrid(recommendations) {
    const cards = recommendations.map((rec, index) => 
      this.buildRecommendationCard(rec, index)
    ).join('');

    return `
    <div class="recommendations-grid">
        ${cards}
    </div>`;
  }

  /**
   * Build individual recommendation card
   */
  buildRecommendationCard(recommendation, index) {
    const posterUrl = this.getPosterUrl(recommendation);
    const adventureLevel = this.determineAdventureLevel(recommendation, index);
    const streamingLinks = this.buildStreamingLinks(recommendation);
    const rating = recommendation.tmdb_data?.vote_average || recommendation.rating || 'N/A';
    
    return `
    <div class="recommendation-card" data-recommendation="${recommendation.title}">
        <div class="card-header">
            <div class="poster-container">
                <img src="${posterUrl}" 
                     alt="${recommendation.title} poster" 
                     class="poster-image"
                     onerror="this.src='https://via.placeholder.com/300x450/1a1a2e/eee?text=No+Image'"
                     loading="lazy">
                <div class="adventure-indicator ${adventureLevel.class}">
                    <span class="adventure-icon">${adventureLevel.icon}</span>
                    <span class="adventure-text">${adventureLevel.text}</span>
                </div>
            </div>
        </div>
        
        <div class="card-content">
            <div class="title-section">
                <h3 class="title">${recommendation.title}</h3>
                <div class="metadata">
                    <span class="year">${recommendation.year || 'Recent'}</span>
                    <span class="separator">•</span>
                    <span class="type">${this.formatContentType(recommendation.type)}</span>
                    <span class="separator">•</span>
                    <span class="rating">⭐ ${rating}</span>
                </div>
            </div>

            <div class="description">
                ${this.truncateText(recommendation.tmdb_data?.overview || recommendation.description || 'A great entertainment choice for your current mood and situation.', 120)}
            </div>

            <div class="reason">
                <strong>Why this fits:</strong> ${recommendation.recommendation_reason || 'Matches your preferences and context'}
            </div>

            <div class="genres">
                ${this.buildGenreTags(recommendation.genres || recommendation.genre_names || [])}
            </div>

            ${streamingLinks}

            <div class="actions">
                <button class="btn btn-primary btn-select" onclick="selectRecommendation('${recommendation.title}', 'selected')">
                    ✨ Watch This
                </button>
            </div>
        </div>
    </div>`;
  }

  /**
   * Build streaming platform links
   */
  buildStreamingLinks(recommendation) {
    const platforms = recommendation.streaming_links || {};
    
    if (Object.keys(platforms).length === 0) {
      return `<div class="streaming-info">
        <span class="no-streaming">🔍 Check availability on your platforms</span>
      </div>`;
    }

    const platformButtons = Object.entries(platforms).map(([key, platform]) => 
      `<a href="${platform.url}" 
          target="_blank" 
          class="platform-link" 
          title="Watch on ${platform.name}">
          <img src="${platform.logo}" alt="${platform.name}" class="platform-logo">
          <span class="platform-name">${platform.name}</span>
          ${platform.price ? `<span class="platform-price">${platform.price}</span>` : ''}
       </a>`
    ).join('');

    return `
    <div class="streaming-platforms">
        <div class="platforms-label">Available on:</div>
        <div class="platforms-list">
            ${platformButtons}
        </div>
    </div>`;
  }

  /**
   * Build genre tags
   */
  buildGenreTags(genres) {
    if (!genres || genres.length === 0) return '';
    
    const tags = genres.slice(0, 4).map(genre => 
      `<span class="genre-tag">${genre}</span>`
    ).join('');

    return `<div class="genres-container">${tags}</div>`;
  }

  /**
   * Determine adventure level for visual indicator
   */
  determineAdventureLevel(recommendation, index) {
    // First recommendation = comfort, second = adjacent, third = stretch
    const levels = [
      { class: 'comfort', icon: '🟢', text: 'Comfort Zone' },
      { class: 'adjacent', icon: '🔶', text: 'Gentle Stretch' },
      { class: 'challenge', icon: '🔴', text: 'New Territory' }
    ];

    return levels[index] || levels[0];
  }

  /**
   * Get poster URL with fallback
   */
  getPosterUrl(recommendation) {
    if (recommendation.tmdb_data?.visual_assets?.posters?.medium) {
      return recommendation.tmdb_data.visual_assets.posters.medium;
    }
    
    if (recommendation.tmdb_data?.poster_path) {
      return `https://image.tmdb.org/t/p/w342${recommendation.tmdb_data.poster_path}`;
    }

    return `https://via.placeholder.com/342x513/1a1a2e/eee?text=${encodeURIComponent(recommendation.title)}`;
  }

  /**
   * Format content type for display
   */
  formatContentType(type) {
    const typeMap = {
      'movie': 'Movie',
      'tv_series': 'TV Series',
      'tv': 'TV Series',
      'documentary': 'Documentary',
      'short': 'Short Film'
    };
    return typeMap[type] || 'Content';
  }

  /**
   * Format adventure level for display
   */
  formatAdventureLevel(level) {
    const levelMap = {
      'high': 'Adventure Mode',
      'medium': 'Balanced Discovery',
      'low': 'Comfort Focus'
    };
    return levelMap[level] || 'Balanced';
  }

  /**
   * Truncate text to specified length
   */
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * Build footer with additional info
   */
  buildFooter() {
    return `
    <div class="footer">
        <div class="footer-content">
            <p>💡 <strong>Tip:</strong> Your feedback helps improve future recommendations!</p>
            <div class="footer-links">
                <span onclick="refreshRecommendations()" class="footer-link">🔄 Get New Recommendations</span>
                <span onclick="showSubscriptionSettings()" class="footer-link">⚙️ Update Subscriptions</span>
            </div>
        </div>
    </div>`;
  }

  /**
   * CSS styles for the recommendation interface
   */
  getRecommendationCSS() {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .recommendations-container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }

        .context-header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #e0e7ff;
        }

        .context-header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 16px;
        }

        .context-info {
            display: flex;
            justify-content: center;
            gap: 24px;
            flex-wrap: wrap;
            margin-bottom: 16px;
        }

        .context-info > div {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #f8fafc;
            padding: 8px 16px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }

        .adventure-assessment {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-top: 16px;
        }

        .adventure-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9rem;
        }

        .adventure-high {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fbbf24;
        }

        .adventure-medium {
            background: #dbeafe;
            color: #1e40af;
            border: 1px solid #60a5fa;
        }

        .adventure-comfort {
            background: #dcfce7;
            color: #166534;
            border: 1px solid #4ade80;
        }

        .assessment-text {
            color: #64748b;
            font-style: italic;
        }

        .recommendations-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
        }

        .recommendation-card {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            border: 1px solid #e2e8f0;
        }

        .recommendation-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .poster-container {
            position: relative;
            width: 100%;
            height: 240px;
            overflow: hidden;
        }

        .poster-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .adventure-indicator {
            position: absolute;
            top: 12px;
            right: 12px;
            padding: 6px 10px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .adventure-indicator.comfort {
            background: rgba(34, 197, 94, 0.9);
            color: white;
        }

        .adventure-indicator.adjacent {
            background: rgba(251, 146, 60, 0.9);
            color: white;
        }

        .adventure-indicator.challenge {
            background: rgba(239, 68, 68, 0.9);
            color: white;
        }

        .card-content {
            padding: 20px;
        }

        .title-section {
            margin-bottom: 12px;
        }

        .title {
            font-size: 1.3rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 4px;
            line-height: 1.3;
        }

        .metadata {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #64748b;
            font-size: 0.9rem;
        }

        .separator {
            color: #cbd5e1;
        }

        .description {
            color: #4b5563;
            line-height: 1.5;
            margin-bottom: 12px;
            font-size: 0.95rem;
        }

        .reason {
            background: #f1f5f9;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 12px;
            font-size: 0.9rem;
            color: #475569;
            border-left: 3px solid #6366f1;
        }

        .genres-container {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-bottom: 16px;
        }

        .genre-tag {
            background: #e0e7ff;
            color: #3730a3;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 500;
        }

        .streaming-platforms {
            margin-bottom: 16px;
        }

        .platforms-label {
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
            font-size: 0.9rem;
        }

        .platforms-list {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .platform-link {
            display: flex;
            align-items: center;
            gap: 6px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 6px 10px;
            text-decoration: none;
            color: #374151;
            font-size: 0.8rem;
            transition: all 0.2s ease;
        }

        .platform-link:hover {
            background: #e2e8f0;
            transform: scale(1.02);
        }

        .platform-logo {
            width: 20px;
            height: 20px;
            object-fit: contain;
        }

        .platform-price {
            color: #059669;
            font-weight: 600;
        }

        .no-streaming {
            color: #9ca3af;
            font-style: italic;
            font-size: 0.9rem;
        }

        .actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            flex: 1;
            min-width: 0;
            justify-content: center;
        }

        .btn-primary {
            background: #6366f1;
            color: white;
        }

        .btn-primary:hover {
            background: #5b21b6;
            transform: translateY(-1px);
        }
        
        .btn-select {
            width: 100%;
            padding: 12px 20px;
            font-size: 1rem;
        }

        .btn-secondary {
            background: #e5e7eb;
            color: #374151;
        }

        .btn-secondary:hover {
            background: #d1d5db;
        }

        .btn-tertiary {
            background: transparent;
            color: #6366f1;
            border: 1px solid #6366f1;
        }

        .btn-tertiary:hover {
            background: #6366f1;
            color: white;
        }

        .footer {
            text-align: center;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
        }

        .footer-links {
            display: flex;
            justify-content: center;
            gap: 24px;
            margin-top: 12px;
        }

        .footer-link {
            cursor: pointer;
            color: #6366f1;
            text-decoration: underline;
            font-size: 0.9rem;
        }

        .footer-link:hover {
            color: #5b21b6;
        }

        @media (max-width: 768px) {
            .recommendations-grid {
                grid-template-columns: 1fr;
            }
            
            .context-info {
                flex-direction: column;
                align-items: center;
            }
            
            .actions {
                flex-direction: column;
            }
            
            .btn {
                flex: none;
            }
        }
    `;
  }

  /**
   * JavaScript for interaction handling
   */
  getInteractionScript() {
    return `
        function selectRecommendation(title, feedback) {
            console.log('Recommendation feedback:', { title, feedback });
            
            // In a real implementation, this would communicate back to the MCP server
            // For now, show user feedback
            const button = event.target;
            const originalText = button.textContent;
            
            if (feedback === 'interested') {
                button.textContent = '✅ Interest Noted';
                button.style.background = '#10b981';
            } else {
                button.textContent = '👍 Feedback Received';
                button.style.background = '#6b7280';
            }
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 2000);
        }

        function getMoreInfo(title) {
            console.log('More info requested for:', title);
            alert('More info feature would show detailed information about: ' + title);
        }

        function refreshRecommendations() {
            console.log('Refresh recommendations requested');
            alert('Would refresh recommendations with new options');
        }

        function showSubscriptionSettings() {
            console.log('Subscription settings requested');
            alert('Would open subscription management interface');
        }

        // Add smooth scrolling for better UX
        document.addEventListener('DOMContentLoaded', function() {
            const cards = document.querySelectorAll('.recommendation-card');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 200);
            });
        });
    `;
  }
}