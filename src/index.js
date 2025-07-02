#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
const envPath = path.resolve(__dirname, '..', '.env');
console.error('Looking for .env file at:', envPath);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.error('.env file loaded successfully');
  console.error('Environment variables loaded:', Object.keys(result.parsed || {}));
}

import { ContentDiscoveryService } from './services/content-discovery.js';
import { MemoryService } from './services/memory.js';
import { SubscriptionContextService } from './services/subscription-context.js';
import { AdventureAssessmentService } from './services/adventure-assessment.js';
import { ArtifactGeneratorService } from './services/artifact-generator.js';
import { ENTERTAINMENT_PROMPTS, PROMPT_ENHANCERS } from './prompts/entertainment-prompts.js';

class EntertainmentDiscoveryServer {
  constructor() {
    this.server = new Server(
      {
        name: 'entertainment-discovery-rebellion',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      }
    );

    this.memory = new MemoryService();
    this.adventureAssessment = new AdventureAssessmentService(this.memory);
    this.artifactGenerator = new ArtifactGeneratorService();
    this.contentDiscovery = new ContentDiscoveryService(this.memory, this.adventureAssessment);
    this.subscriptionContext = new SubscriptionContextService(this.memory);

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'entertainment://status',
          mimeType: 'application/json',
          name: 'Entertainment Discovery Server Status',
        },
      ],
    }));

    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
      resourceTemplates: []
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      if (uri === 'entertainment://status') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                server: 'Entertainment Discovery Rebellion',
                status: 'running',
                version: '1.0.0',
                capabilities: ['content_discovery', 'subscription_context', 'memory_integration'],
                apis: {
                  watchmode: !!process.env.WATCHMODE_API_KEY,
                  tmdb: !!process.env.TMDB_API_KEY,
                }
              }, null, 2),
            },
          ],
        };
      }

      throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
    });

    // Prompt handlers
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: Object.entries(ENTERTAINMENT_PROMPTS).map(([key, prompt]) => ({
        name: key,
        description: prompt.description,
        arguments: prompt.variables ? Object.entries(prompt.variables).map(([name, description]) => ({
          name,
          description,
          required: true
        })) : []
      }))
    }));

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const prompt = ENTERTAINMENT_PROMPTS[name];
      if (!prompt) {
        throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
      }

      // Get user memory for context enhancement
      const userMemory = await this.memory.retrieveLocalMemory();
      let enhancedTemplate = prompt.template;

      // Always enforce tool usage
      enhancedTemplate = PROMPT_ENHANCERS.enforceToolUsage(enhancedTemplate);

      // Enhance prompt with user context if available
      if (userMemory.length > 0) {
        enhancedTemplate = PROMPT_ENHANCERS.addUserContext(enhancedTemplate, userMemory);
        
        const recentOutcomes = userMemory.filter(entity => 
          entity.type === 'recommendation_outcome'
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        enhancedTemplate = PROMPT_ENHANCERS.addRecentContext(enhancedTemplate, recentOutcomes);

        const subscriptionContexts = userMemory.filter(entity => 
          entity.type === 'subscription_context'
        );
        enhancedTemplate = PROMPT_ENHANCERS.addPlatformContext(enhancedTemplate, subscriptionContexts);
      }

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: enhancedTemplate
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'discover_content_with_context',
          description: 'Find perfect entertainment content based on complex real-world context including mood, time, companions, and subscription availability',
          inputSchema: {
            type: 'object',
            properties: {
              situation_description: {
                type: 'string',
                description: 'Natural language description of current viewing situation (e.g., "partner is traveling, I have 2 hours, feeling stressed")',
              },
              mood: {
                type: 'string',
                description: 'Current mood or desired feeling (e.g., "relaxed", "excited", "thoughtful", "escapist")',
              },
              time_available: {
                type: 'number',
                description: 'Available viewing time in minutes',
              },
              viewing_companions: {
                type: 'string',
                description: 'Who will be watching (e.g., "solo", "with partner", "family with kids", "friends")',
              },
            },
            required: ['situation_description'],
          },
        },
        {
          name: 'get_platform_availability',
          description: 'Check where specific content is currently available for streaming',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Movie or TV show title to check availability for',
              },
            },
            required: ['title'],
          },
        },
        {
          name: 'update_subscription_context',
          description: 'Update or add subscription context information (personal subscriptions, shared access, situational availability)',
          inputSchema: {
            type: 'object',
            properties: {
              context_type: {
                type: 'string',
                enum: ['personal', 'shared', 'family', 'situational'],
                description: 'Type of subscription context',
              },
              platform: {
                type: 'string',
                description: 'Streaming platform name (e.g., "Netflix", "Disney+", "HBO Max")',
              },
              access_details: {
                type: 'string',
                description: 'Details about access (e.g., "always available", "only when partner is home", "weekends only")',
              },
            },
            required: ['context_type', 'platform', 'access_details'],
          },
        },
        {
          name: 'learn_from_feedback',
          description: 'Learn from user feedback on recommendations to improve future suggestions',
          inputSchema: {
            type: 'object',
            properties: {
              recommendation_title: {
                type: 'string',
                description: 'Title that was recommended',
              },
              feedback_type: {
                type: 'string',
                enum: ['loved', 'liked', 'neutral', 'disliked', 'hated'],
                description: 'User feedback on the recommendation',
              },
              feedback_reason: {
                type: 'string',
                description: 'Why the user felt this way about the recommendation',
              },
            },
            required: ['recommendation_title', 'feedback_type'],
          },
        },
        {
          name: 'generate_visual_recommendations',
          description: 'Generate rich visual artifact with recommendation cards, posters, and streaming links',
          inputSchema: {
            type: 'object',
            properties: {
              recommendations: {
                type: 'array',
                description: 'Array of recommendation objects with titles, genres, posters, etc.',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    type: { type: 'string' },
                    genres: { type: 'array', items: { type: 'string' } },
                    overview: { type: 'string' },
                    rating: { type: 'number' },
                    year: { type: 'number' },
                    adventure_level: { type: 'string' },
                    adventure_explanation: { type: 'string' },
                    tmdb_data: { type: 'object' },
                    streaming_sources: { type: 'array' }
                  }
                }
              },
              context: {
                type: 'object',
                description: 'Viewing context information',
                properties: {
                  situation: { type: 'string' },
                  mood: { type: 'string' },
                  timeAvailable: { type: 'number' },
                  companions: { type: 'string' }
                }
              },
              adventure_assessment: {
                type: 'object',
                description: 'Adventure readiness assessment',
                properties: {
                  readiness_level: { type: 'string' },
                  confidence: { type: 'number' },
                  reasoning: { type: 'string' }
                }
              }
            },
            required: ['recommendations', 'context'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;

        switch (name) {
          case 'discover_content_with_context':
            result = await this.contentDiscovery.discoverWithContext({
              situationDescription: args.situation_description,
              mood: args.mood,
              timeAvailable: args.time_available,
              viewingCompanions: args.viewing_companions,
            });
            break;

          case 'get_platform_availability':
            result = await this.contentDiscovery.getPlatformAvailability(args.title);
            break;

          case 'update_subscription_context':
            result = await this.subscriptionContext.updateContext({
              contextType: args.context_type,
              platform: args.platform,
              accessDetails: args.access_details,
            });
            break;

          case 'learn_from_feedback':
            result = await this.contentDiscovery.learnFromFeedback({
              recommendationTitle: args.recommendation_title,
              feedbackType: args.feedback_type,
              feedbackReason: args.feedback_reason,
            });
            break;

          case 'generate_visual_recommendations':
            result = await this.generateVisualArtifact({
              recommendations: args.recommendations,
              context: args.context,
              adventureAssessment: args.adventure_assessment
            });
            break;

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
      }
    });
  }

  /**
   * Generate visual artifact for recommendations
   */
  async generateVisualArtifact({ recommendations, context, adventureAssessment }) {
    try {
      console.error('Generating visual artifact for', recommendations.length, 'recommendations');
      
      const artifact = this.artifactGenerator.generateRecommendationArtifact(
        recommendations,
        context,
        adventureAssessment
      );

      return {
        type: 'artifact',
        artifact_type: 'application/vnd.artifact+html',
        identifier: artifact.identifier,
        title: artifact.title,
        content: artifact.content,
        status: 'success',
        message: 'Visual recommendations generated successfully'
      };

    } catch (error) {
      console.error('Failed to generate visual artifact:', error);
      return {
        type: 'error',
        status: 'failed',
        message: 'Failed to generate visual artifact',
        error: error.message,
        fallback: 'Use text-based recommendations instead'
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Entertainment Discovery Rebellion MCP server running on stdio');
  }
}

const server = new EntertainmentDiscoveryServer();
server.run().catch(console.error);