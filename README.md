# Entertainment Discovery Rebellion

**AI-Powered Conversational Entertainment Advisor - MCP Server Implementation**

## 🎬 Overview

Entertainment Discovery Rebellion solves the modern entertainment choice paralysis problem through an intelligent MCP (Model Context Protocol) server that provides personalized, context-aware recommendations. Instead of overwhelming users with 40,000+ daily content choices across multiple streaming platforms, our system offers natural conversation with Claude to find the perfect entertainment for any situation.

## ✨ Key Features

- **🧠 Memory-Powered Intelligence**: Persistent learning and preference evolution
- **💬 Natural Conversation**: Talk to Claude like a friend, not a search engine
- **📱 Real-Time Platform Availability**: Live streaming data from Watchmode & TMDB APIs
- **🎯 Context-Aware Recommendations**: Understands mood, time, companions, and situations
- **🚀 Adventure Assessment**: Intelligently stretches comfort zones to prevent echo chambers
- **🎨 Visual Recommendations**: Rich HTML cards with posters and direct streaming links
- **🔄 Adaptive Learning**: Improves with every interaction through feedback

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Claude Desktop app (for MCP integration)
- API keys for Watchmode and TMDB (optional - works with mock data)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/entertainment-discovery-rebellion
cd entertainment-discovery-rebellion
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API keys (optional - will use mock data if not provided)
# WATCHMODE_API_KEY=your_watchmode_api_key_here
# TMDB_API_KEY=your_tmdb_api_key_here
```

4. **Test the installation**
```bash
# Run configuration test
node test-mcp.js

# Run demo scenarios
node demo/demo-scenario.js
```

### Configure Claude Desktop

Add the MCP server to your Claude Desktop configuration:

1. Open Claude Desktop settings
2. Navigate to Developer → Model Context Protocol
3. Add this configuration:

```json
{
  "entertainment-discovery": {
    "command": "node",
    "args": ["/path/to/entertainment-discovery-rebellion/src/index.js"]
  }
}
```

Or use the provided configuration helper:
```bash
cat claude-desktop-config.json
```

## 🎮 Usage

### Starting the MCP Server

```bash
# Production mode
npm start

# Development mode (if configured)
npm run dev
```

### Available MCP Tools

#### 1. `discover_content_with_context`
Find perfect entertainment based on your current situation.

```javascript
{
  "situation_description": "Just finished a stressful day, partner is traveling",
  "mood": "stressed",
  "time_available": 90,
  "viewing_companions": "solo"
}
```

#### 2. `get_platform_availability`
Check where specific content is available.

```javascript
{
  "title": "The Grand Budapest Hotel"
}
```

#### 3. `update_subscription_context`
Manage your streaming subscriptions and access patterns.

```javascript
{
  "context_type": "shared",
  "platform": "Disney+",
  "access_details": "Partner's account, only when they're home"
}
```

#### 4. `learn_from_feedback`
Help the system learn your preferences.

```javascript
{
  "recommendation_title": "Brooklyn Nine-Nine",
  "feedback_type": "loved",
  "feedback_reason": "Perfect for unwinding, exactly what I needed"
}
```

#### 5. `generate_visual_recommendations`
Create beautiful recommendation cards (automatically called after recommendations).

### Demo Scenarios

Run the interactive demo to see the system in action:

```bash
# Run all scenarios
node demo/demo-scenario.js

# Run specific scenario
node demo/demo-scenario.js 0  # Stressed after work
node demo/demo-scenario.js 1  # Date night planning
node demo/demo-scenario.js 2  # Family weekend
```

## 🏗️ Architecture

### Core Services

```
src/
├── index.js                    # MCP server entry point
├── services/
│   ├── content-discovery.js    # Main recommendation engine
│   ├── memory.js              # Memory persistence layer
│   ├── subscription-context.js # Platform availability management
│   ├── adventure-assessment.js # Content stretching intelligence
│   └── artifact-generator.js   # Visual recommendation cards
└── prompts/
    └── entertainment-prompts.js # Enhanced conversational prompts
```

### Memory System

The system uses a sophisticated memory node structure:
- **User Profile**: Entertainment personality and preferences
- **Adventure Profile**: Risk tolerance and expansion readiness
- **Subscription Contexts**: Complex platform access patterns
- **Viewing Contexts**: Situational preferences and patterns
- **Recommendation Outcomes**: Learning from feedback

### API Integration

- **Primary**: Watchmode (streaming availability) + TMDB (metadata)
- **Fallback**: Mock data ensures demo reliability
- **Caching**: Intelligent rate limit management

## 🔧 Development

### Running Tests

```bash
# Test MCP configuration
node test-mcp.js

# Test with full tool invocation
node test-mcp.js --full

# Test specific tools
node test-mcp-connection.js
```

### Memory Visualization

Analyze and visualize memory patterns:

```bash
# Fetch current memory state
node fetch-memory-data.js

# Analyze memory relationships
node analyze-orphaned-nodes.js

# Serve interactive visualization
npm run serve-viz
# Then open http://localhost:3000/memory-visualization.html
```

### Debugging

```bash
# Check for orphaned memory nodes
node suggested-reconnections.js

# Fix broken memory relationships
node fix-broken-relations.js
```

## 📊 Project Status

- **Phase**: Implementation Complete ✅
- **Modules**: All 8 modules implemented and functional
- **Features**: 100% core features + bonus features (adventure assessment, visual artifacts)
- **Documentation**: Comprehensive and up-to-date
- **Demo**: Three scenarios ready for presentation

## 🎯 Competitive Advantages

1. **MCP Architecture** vs traditional web apps
2. **Memory-Powered** vs stateless algorithms
3. **Conversational AI** vs form-based interfaces
4. **Real-Time Data** vs cached recommendations
5. **Context Intelligence** vs simple filtering
6. **Adventure Assessment** vs echo chambers
7. **Visual Artifacts** vs text lists

## 📚 Documentation

- [`CLAUDE.md`](CLAUDE.md) - Primary development context
- [`docs/Project-Scope-Plan.md`](docs/Project-Scope-Plan.md) - Project overview and status
- [`docs/Task-Tracking-Log.md`](docs/Task-Tracking-Log.md) - Development progress
- [`docs/Module-Spec-Content-Discovery.md`](docs/Module-Spec-Content-Discovery.md) - Technical details
- [`docs/Decision-Registry.md`](docs/Decision-Registry.md) - Architectural decisions

## 🤝 Contributing

This project follows the Project Constitution principles:
- Focus on solving real user problems
- Leverage existing infrastructure wisely
- Challenge conventional approaches
- Prioritize practical implementation

## 📝 License

Built for the TasteRay AI Creative Hackathon 2025 - Open Challenge

## 🙏 Acknowledgments

- TasteRay AI for organizing the hackathon
- Anthropic for the MCP protocol and Claude
- The open-source memory MCP server project
- Watchmode and TMDB for their excellent APIs

---

*"Because finding something to watch shouldn't be harder than watching it."*

**Built with ❤️ by the Entertainment Discovery Rebellion Team**