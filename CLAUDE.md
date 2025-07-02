# CLAUDE.md - Entertainment Discovery Rebellion Project Context

## Critical Context
**The 5 most important things any Claude session needs to know:**
- **Project**: Entertainment Discovery Rebellion - MCP server that solves entertainment choice paralysis through conversational AI media advisor
- **Hackathon**: TasteRay AI Creative Hackathon Open Challenge, June 16-29, 2025, competing against 833 participants  
- **Technical Approach**: MCP server with memory nodes for subscription-aware recommendations, not a web app (major competitive differentiator)
- **Problem Solving**: Addresses real user frustration - 40,000+ daily content choices, complex subscription contexts (shared Netflix, family HBO Max, etc.)
- **Current Status**: Planning complete, ready for implementation - Week 1 focus on API integration and basic content discovery tools

## Project Overview

Entertainment Discovery Rebellion is a conversational AI media advisor built as an MCP (Model Context Protocol) server that solves modern entertainment choice paralysis. Instead of overwhelming users with thousands of options, it provides 3 perfect recommendations through natural conversation with Claude, understanding complex subscription contexts and viewing situations.

**Key Innovation**: Memory-powered conversational interface vs traditional recommendation algorithms - users describe their situation naturally ("partner's traveling, I have 2 hours, feeling stressed") and receive context-intelligent recommendations with explanations.

## Technical Architecture

### Core Technology Stack
- **Foundation**: Existing open-source memory MCP server (leverages proven infrastructure)
- **APIs**: Watchmode (real-time streaming availability) + TMDB (rich metadata)
- **Intelligence Layer**: AI context analysis for mood, time, companions, platform access
- **Interface**: Conversational through Claude, not web forms or traditional UI

### MCP Tools Structure
```
discover_content_with_context() - Main recommendation engine
get_platform_availability() - Real-time streaming availability  
update_subscription_context() - Memory node management
learn_from_feedback() - Adaptive preference evolution
```

### Memory Node Patterns for Subscription Contexts
- **Personal platforms**: Individual subscriptions (Netflix, Prime)
- **Shared access**: Platform availability based on relationships (partner's Disney+)
- **Contextual access**: Situation-dependent availability (family HBO Max on weekends)
- **Geographic restrictions**: Location-aware filtering
- **Temporal patterns**: Usage history and preference evolution

## Implementation Strategy

### Week 1 Priorities (June 19-21)
1. **API Integration**: Watchmode + TMDB connectivity and testing
2. **Basic Content Discovery**: Core recommendation tool working
3. **Memory Integration**: Subscription context storage and retrieval
4. **Foundation Complete**: Milestone - basic system functional

### Week 2 Priorities (June 22-29)
1. **Context Intelligence**: Sophisticated situation analysis
2. **Conversation Flow**: Natural language interaction refinement
3. **Demo Preparation**: 10-minute showcase scenarios
4. **Competition Submission**: Final polish and documentation

### API Strategy
- **Primary**: Watchmode (1,000 requests/day) + TMDB (1,000 requests/day)
- **Backup**: Streaming Availability API, uNoGS, OMDb
- **Fallback**: Curated dataset of ~1,000 popular titles for demo reliability
- **Geographic Scope**: US market focus for hackathon MVP

## Competitive Advantages

### What Others Will Build (833 participants)
- Standard web applications with forms and filters
- Static recommendation algorithms without platform awareness
- Mock data or limited API integration
- Traditional UI patterns (grids, lists, search bars)

### What We Deliver
- **Conversational AI Interface**: Natural language vs forms
- **Live Streaming Data**: Real-time availability vs static datasets  
- **Context Intelligence**: Understanding viewing situations vs simple preferences
- **Memory-Powered Learning**: Persistent subscription contexts vs session-based
- **MCP Architecture**: Cutting-edge AI protocol vs standard web tech

## Demo Requirements

### Target Scenario (10-minute demonstration)
1. **Context Setup**: User describes complex viewing situation
2. **Subscription Intelligence**: System recognizes available platforms in current context
3. **Recommendation Generation**: 3 perfect suggestions with explanations
4. **Learning Demonstration**: Show adaptation based on feedback
5. **Competitive Differentiation**: Highlight conversational AI vs typical recommendation systems

### Success Metrics
- **Functional**: 3 relevant recommendations in under 10 seconds
- **Accuracy**: Matches user context and actual platform availability
- **Intelligence**: Clear demonstration of AI understanding vs algorithmic filtering
- **Impact**: Judges appreciate technical sophistication + practical value

## Development Guidelines

### Code Quality Standards
- Follow existing codebase patterns and conventions
- Prioritize working functionality over perfect architecture
- Focus on demo-ready features vs comprehensive coverage
- Implement error handling for API rate limits and failures

### Memory Management Best Practices
- Use memory nodes for persistent subscription contexts
- Store conversation history for learning patterns
- Cache popular content for demo performance
- Balance memory usage with context richness

### API Integration Approach
- Implement multi-API fallback strategy for reliability
- Cache responses to manage rate limits effectively
- Async requests for performance optimization
- Error handling with graceful degradation

## Project Documentation Structure

- `/docs/Project-Scope-Plan.md` - Overall objectives and timeline
- `/docs/Task-Tracking-Log.md` - Current progress and next steps
- `/docs/Module-Spec-Content-Discovery.md` - Technical implementation details
- `/docs/Decision-Registry.md` - Key architectural choices and rationale
- `/docs/Project-Constitution.md` - Collaboration principles and communication guidelines

## Current Task Priorities

### Immediate Next Steps (based on Task-Tracking-Log.md)
1. **TSK-011**: API key acquisition and testing (Watchmode, TMDB)
2. **TSK-006**: Memory integration strategy definition 
3. **TSK-007**: Basic content discovery tool implementation
4. **TSK-008**: Subscription context memory node setup

### Weekly Milestones
- **June 21**: Foundation Complete (memory + basic discovery working)
- **June 24**: Subscription Intelligence (complex context handling)
- **June 27**: Demo Ready (compelling 10-minute showcase)
- **June 29**: Submission Polish (final documentation and materials)

## Collaboration Framework

### Project Constitution Principles Applied
- **Needs vs Wants**: Focus on solving real entertainment choice paralysis vs perfect recommendation algorithms
- **Technical Expertise**: Leverage MCP architecture for competitive advantage vs following standard web patterns
- **Collaborative Direction**: Challenge conventional approaches, suggest sophisticated alternatives
- **Knowledge Utilization**: Draw from AI, streaming industry, and user experience expertise
- **Shared Success**: Prioritize hackathon victory through genuine innovation

### Communication Approach
- Direct, honest assessment of technical challenges and progress
- Focus on practical implementation over theoretical perfection
- Balance sophisticated demonstration with timeline constraints
- Regular progress evaluation against competition objectives

---

**Project Essence**: AI-powered conversational media advisor that actually understands your entertainment life, built with cutting-edge MCP architecture to win the TasteRay hackathon through technical sophistication and practical problem solving.