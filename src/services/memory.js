import axios from 'axios';

export class MemoryService {
  constructor() {
    this.memoryServerUrl = process.env.MEMORY_SERVER_URL || 'http://localhost:3001';
    this.userId = 'entertainment_user'; // In real implementation, this would be dynamic
  }

  async createMemoryNode(type, data, relationships = []) {
    try {
      const memoryNode = {
        id: this.generateNodeId(type),
        type: type,
        data: data,
        relationships: relationships,
        timestamp: new Date().toISOString(),
        userId: this.userId
      };

      // For now, store in local memory since memory server isn't running
      // This would be replaced with actual memory server API calls
      return this.storeLocalMemory(memoryNode);

    } catch (error) {
      console.error('Memory creation error:', error);
      return this.storeLocalMemory({
        id: this.generateNodeId(type),
        type: type,
        data: data,
        error: 'Memory server unavailable, using local storage'
      });
    }
  }

  async retrieveMemoryNodes(type, filters = {}) {
    try {
      // This would query the memory server
      // For now, return from local storage
      return this.retrieveLocalMemory(type, filters);

    } catch (error) {
      console.error('Memory retrieval error:', error);
      return [];
    }
  }

  async updateMemoryNode(nodeId, updates) {
    try {
      const existingNode = await this.getMemoryNode(nodeId);
      if (!existingNode) {
        throw new Error('Memory node not found');
      }

      const updatedNode = {
        ...existingNode,
        ...updates,
        updated_at: new Date().toISOString()
      };

      return this.storeLocalMemory(updatedNode);

    } catch (error) {
      console.error('Memory update error:', error);
      throw error;
    }
  }

  async getMemoryNode(nodeId) {
    try {
      const allNodes = this.retrieveLocalMemory();
      return allNodes.find(node => node.id === nodeId);
    } catch (error) {
      console.error('Memory retrieval error:', error);
      return null;
    }
  }

  async deleteMemoryNode(nodeId) {
    try {
      // This would call memory server deletion API
      // For now, handle locally
      return this.deleteLocalMemory(nodeId);
    } catch (error) {
      console.error('Memory deletion error:', error);
      throw error;
    }
  }

  generateNodeId(type) {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Local storage methods for development (would be replaced by memory server API)
  storeLocalMemory(node) {
    try {
      const storageKey = `entertainment_memory_${this.userId}`;
      const existing = JSON.parse(global.memoryStorage?.[storageKey] || '[]');
      
      // Update existing or add new
      const index = existing.findIndex(n => n.id === node.id);
      if (index >= 0) {
        existing[index] = node;
      } else {
        existing.push(node);
      }

      // Initialize global storage if needed
      if (!global.memoryStorage) {
        global.memoryStorage = {};
      }
      global.memoryStorage[storageKey] = JSON.stringify(existing);

      return {
        status: 'success',
        node: node,
        storage: 'local'
      };

    } catch (error) {
      console.error('Local storage error:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  retrieveLocalMemory(type = null, filters = {}) {
    try {
      const storageKey = `entertainment_memory_${this.userId}`;
      const allNodes = JSON.parse(global.memoryStorage?.[storageKey] || '[]');

      let filtered = allNodes;

      if (type) {
        filtered = filtered.filter(node => node.type === type);
      }

      // Apply additional filters
      if (filters.platform) {
        filtered = filtered.filter(node => 
          node.data?.platform?.toLowerCase() === filters.platform.toLowerCase()
        );
      }

      if (filters.contextType) {
        filtered = filtered.filter(node => 
          node.data?.contextType === filters.contextType
        );
      }

      return filtered;

    } catch (error) {
      console.error('Local retrieval error:', error);
      return [];
    }
  }

  deleteLocalMemory(nodeId) {
    try {
      const storageKey = `entertainment_memory_${this.userId}`;
      const existing = JSON.parse(global.memoryStorage?.[storageKey] || '[]');
      
      const filtered = existing.filter(n => n.id !== nodeId);
      
      if (!global.memoryStorage) {
        global.memoryStorage = {};
      }
      global.memoryStorage[storageKey] = JSON.stringify(filtered);

      return {
        status: 'success',
        deleted: nodeId
      };

    } catch (error) {
      console.error('Local deletion error:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  // Memory analysis methods
  async analyzeMemoryPatterns() {
    try {
      const allNodes = await this.retrieveMemoryNodes();
      
      const patterns = {
        subscription_contexts: this.analyzeSubscriptionPatterns(allNodes),
        preference_evolution: this.analyzePreferenceEvolution(allNodes),
        viewing_contexts: this.analyzeViewingContexts(allNodes),
        feedback_patterns: this.analyzeFeedbackPatterns(allNodes)
      };

      return patterns;

    } catch (error) {
      console.error('Pattern analysis error:', error);
      return {};
    }
  }

  analyzeSubscriptionPatterns(nodes) {
    const subscriptionNodes = nodes.filter(n => n.type === 'subscription_context');
    
    const patterns = {
      platforms: {},
      access_types: {},
      temporal_patterns: {}
    };

    subscriptionNodes.forEach(node => {
      const platform = node.data.platform;
      const contextType = node.data.contextType;
      
      patterns.platforms[platform] = (patterns.platforms[platform] || 0) + 1;
      patterns.access_types[contextType] = (patterns.access_types[contextType] || 0) + 1;
    });

    return patterns;
  }

  analyzePreferenceEvolution(nodes) {
    const feedbackNodes = nodes.filter(n => n.type === 'feedback').sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    const evolution = {
      genre_trends: {},
      rating_trends: [],
      recent_preferences: feedbackNodes.slice(-10)
    };

    feedbackNodes.forEach(node => {
      if (node.data.genres) {
        node.data.genres.forEach(genre => {
          if (!evolution.genre_trends[genre]) {
            evolution.genre_trends[genre] = [];
          }
          evolution.genre_trends[genre].push({
            rating: node.data.rating,
            timestamp: node.timestamp
          });
        });
      }
    });

    return evolution;
  }

  analyzeViewingContexts(nodes) {
    const contextNodes = nodes.filter(n => n.type === 'viewing_context');
    
    const contexts = {
      common_situations: {},
      time_patterns: {},
      companion_patterns: {}
    };

    contextNodes.forEach(node => {
      const situation = node.data.situation;
      const companions = node.data.companions;
      const timeSlot = this.categorizeTime(node.data.timeAvailable);

      contexts.common_situations[situation] = (contexts.common_situations[situation] || 0) + 1;
      contexts.companion_patterns[companions] = (contexts.companion_patterns[companions] || 0) + 1;
      contexts.time_patterns[timeSlot] = (contexts.time_patterns[timeSlot] || 0) + 1;
    });

    return contexts;
  }

  analyzeFeedbackPatterns(nodes) {
    const feedbackNodes = nodes.filter(n => n.type === 'feedback');
    
    const patterns = {
      overall_satisfaction: this.calculateSatisfactionScore(feedbackNodes),
      genre_performance: {},
      recommendation_accuracy: this.calculateAccuracy(feedbackNodes)
    };

    return patterns;
  }

  categorizeTime(minutes) {
    if (minutes < 60) return 'short';
    if (minutes < 120) return 'medium';
    if (minutes < 180) return 'long';
    return 'extended';
  }

  calculateSatisfactionScore(feedbackNodes) {
    if (feedbackNodes.length === 0) return 0;

    const scoreMap = {
      'hated': 1,
      'disliked': 2,
      'neutral': 3,
      'liked': 4,
      'loved': 5
    };

    const totalScore = feedbackNodes.reduce((sum, node) => {
      return sum + (scoreMap[node.data.rating] || 3);
    }, 0);

    return totalScore / feedbackNodes.length;
  }

  calculateAccuracy(feedbackNodes) {
    if (feedbackNodes.length === 0) return 0;

    const positiveRatings = feedbackNodes.filter(node => 
      ['liked', 'loved'].includes(node.data.rating)
    ).length;

    return positiveRatings / feedbackNodes.length;
  }
}