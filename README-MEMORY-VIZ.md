# Memory Graph Visualizer Setup

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the memory visualization server:**
   ```bash
   npm start
   ```

3. **Open the visualizer:**
   Navigate to: `http://localhost:3001/memory-visualizer.html`

## Claude Code Integration

### Option 1: MCP Configuration (Recommended)

Create or update your Claude Code MCP configuration file:

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {}
    }
  }
}
```

### Option 2: HTTP Transport

If using HTTP transport:

```json
{
  "mcpServers": {
    "memory": {
      "url": "http://localhost:3000/sse"
    }
  }
}
```

## Features

### Interactive Memory Visualization
- **Node-link graph** showing Alex's memory entities and relationships
- **Alex-focused design** with special highlighting for Alex-related memories
- **Search and filter** by entity names, types, or observation content
- **Interactive exploration** - click nodes to see detailed information
- **Physics simulation** for natural graph layout

### Demonstration Capabilities
- **Real-time memory access** - connects to live memory server
- **Sophisticated relationship mapping** - shows how Alex's preferences evolved
- **Context awareness visualization** - see subscription complexity and viewing patterns
- **Adventure readiness tracking** - visual representation of Alex's growth

### Technical Architecture
- **Memory Bridge Server** (`memory-bridge.js`) - connects visualization to MCP memory server
- **Interactive Frontend** (`memory-visualizer.html`) - D3.js-powered graph visualization
- **RESTful API** - `/api/memory/graph` and `/api/memory/search` endpoints

## Files Structure

```
/entertainment-discovery-rebellion/
├── memory-bridge.js          # Bridge server connecting MCP to web interface
├── memory-visualizer.html    # Interactive D3.js memory graph visualization
├── package.json             # Node.js dependencies
├── ALEX_DEMO_INSTRUCTIONS.md # Guide for interacting with Alex
└── README-MEMORY-VIZ.md     # This file
```

## Demo Workflow

1. **Start memory server** with `npm start`
2. **Open visualization** at `http://localhost:3001/memory-visualizer.html`
3. **Load Alex's demo data** using memory search commands from instructions
4. **Explore interactive graph** showing Alex's entertainment evolution
5. **Demonstrate to judges** the sophisticated memory architecture

## Hackathon Demo Points

### Visual Impact
- **Beautiful, responsive graph** showing complex AI memory
- **Alex-centric design** with golden highlighting for user-related nodes
- **Real-time updates** as memory grows during demo conversations

### Technical Sophistication
- **Live MCP integration** - not static data
- **Complex relationship modeling** - subscription contexts, viewing patterns, adventure evolution
- **Searchable memory architecture** - find any aspect of Alex's profile instantly

### Competitive Advantage
- **Memory persistence** - shows how AI learns and grows with users
- **Context complexity** - visual proof of subscription-aware intelligence
- **Relationship dynamics** - demonstrates understanding of human entertainment consumption

Perfect for demonstrating why **Entertainment Discovery Rebellion** goes far beyond typical recommendation systems!
