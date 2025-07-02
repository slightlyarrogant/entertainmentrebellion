#!/usr/bin/env node

const express = require('express');
const { spawn } = require('child_process');

const app = express();
const PORT = 3001;

// Serve static files
app.use(express.static('.'));
app.use(express.json());

let memoryServer;
let mcpInitialized = false;
let responseHandlers = new Map();
let requestId = 1;

function startMemoryServer() {
    memoryServer = spawn('npx', ['-y', '@modelcontextprotocol/server-memory'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let responseBuffer = '';
    
    memoryServer.stdout.on('data', (data) => {
        const output = data.toString();
        responseBuffer += output;
        
        const lines = responseBuffer.split('\n');
        responseBuffer = lines.pop();
        
        lines.forEach(line => {
            if (line.trim()) {
                try {
                    const response = JSON.parse(line);
                    
                    if (response.id && responseHandlers.has(response.id)) {
                        const handler = responseHandlers.get(response.id);
                        responseHandlers.delete(response.id);
                        handler(response);
                    }
                } catch (e) {
                    // Ignore non-JSON lines
                }
            }
        });
    });
    
    memoryServer.stderr.on('data', (data) => {
        console.log(`Memory server ready: ${data.toString().trim()}`);
    });
    
    // Initialize MCP connection
    setTimeout(() => {
        const initRequest = {
            jsonrpc: "2.0",
            id: requestId++,
            method: "initialize",
            params: {
                protocolVersion: "2024-11-05",
                capabilities: { tools: {} },
                clientInfo: {
                    name: "memory-visualizer",
                    version: "1.0.0"
                }
            }
        };
        
        responseHandlers.set(initRequest.id, (response) => {
            if (response.result) {
                mcpInitialized = true;
                console.log('✅ MCP connection initialized');
            }
        });
        
        memoryServer.stdin.write(JSON.stringify(initRequest) + '\n');
    }, 1000);
}

function callMCPTool(toolName, arguments = {}) {
    return new Promise((resolve, reject) => {
        if (!mcpInitialized) {
            reject(new Error('MCP not initialized'));
            return;
        }
        
        const id = requestId++;
        const request = {
            jsonrpc: "2.0",
            id: id,
            method: "tools/call",
            params: {
                name: toolName,
                arguments: arguments
            }
        };
        
        const timeout = setTimeout(() => {
            responseHandlers.delete(id);
            reject(new Error('Request timeout'));
        }, 15000);
        
        responseHandlers.set(id, (response) => {
            clearTimeout(timeout);
            if (response.result) {
                resolve(response.result);
            } else if (response.error) {
                reject(new Error(response.error.message));
            } else {
                reject(new Error('Unknown response format'));
            }
        });
        
        memoryServer.stdin.write(JSON.stringify(request) + '\n');
    });
}

function parseMemoryContent(content) {
    // Try to parse as JSON first
    try {
        const parsed = JSON.parse(content);
        if (parsed.entities && parsed.relations) {
            console.log(`📊 Parsed JSON: ${parsed.entities.length} entities, ${parsed.relations.length} relations`);
            return parsed;
        }
    } catch (e) {
        // Continue with text parsing
    }
    
    // Parse the memory content from text format
    const entities = [];
    const relations = [];
    
    // Split content into blocks
    const blocks = content.split(/\n\s*\n/);
    
    for (const block of blocks) {
        const lines = block.trim().split('\n');
        
        if (block.includes('"type": "entity"')) {
            const entity = { observations: [] };
            let inObservations = false;
            
            for (const line of lines) {
                const trimmed = line.trim();
                
                if (trimmed.includes('"name":')) {
                    const match = trimmed.match(/"name":\s*"([^"]+)"/);
                    if (match) entity.name = match[1];
                }
                
                if (trimmed.includes('"entityType":')) {
                    const match = trimmed.match(/"entityType":\s*"([^"]+)"/);
                    if (match) entity.entityType = match[1];
                }
                
                if (trimmed.includes('"observations":')) {
                    inObservations = true;
                    continue;
                }
                
                if (inObservations && trimmed.startsWith('"') && trimmed.endsWith('"')) {
                    const observation = trimmed.slice(1, -1).replace(/\\"/g, '"');
                    entity.observations.push(observation);
                }
                
                if (inObservations && (trimmed === ']' || trimmed.includes(']'))) {
                    inObservations = false;
                }
            }
            
            if (entity.name && entity.entityType) {
                entities.push(entity);
            }
        }
        
        if (block.includes('"type": "relation"')) {
            const relation = {};
            
            for (const line of lines) {
                const trimmed = line.trim();
                
                if (trimmed.includes('"from":')) {
                    const match = trimmed.match(/"from":\s*"([^"]+)"/);
                    if (match) relation.from = match[1];
                }
                
                if (trimmed.includes('"to":')) {
                    const match = trimmed.match(/"to":\s*"([^"]+)"/);
                    if (match) relation.to = match[1];
                }
                
                if (trimmed.includes('"relationType":')) {
                    const match = trimmed.match(/"relationType":\s*"([^"]+)"/);
                    if (match) relation.relationType = match[1];
                }
            }
            
            if (relation.from && relation.to && relation.relationType) {
                relations.push(relation);
            }
        }
    }
    
    console.log(`📊 Parsed text: ${entities.length} entities, ${relations.length} relations`);
    return { entities, relations };
}

// API endpoint to get memory data
app.get('/api/memory/graph', async (req, res) => {
    try {
        console.log('📊 Reading memory graph...');
        const result = await callMCPTool('read_graph');
        
        if (result.content && Array.isArray(result.content)) {
            // Try to parse from the text content
            let allContent = '';
            result.content.forEach(item => {
                if (item.type === 'text') {
                    allContent += item.text + '\n';
                }
            });
            
            // Parse the structured data from content
            const graphData = parseMemoryContent(allContent);
            
            console.log(`✅ Retrieved ${graphData.entities.length} entities, ${graphData.relations.length} relations`);
            res.json(graphData);
        } else {
            // Return empty graph if no content
            res.json({ entities: [], relations: [] });
        }
    } catch (error) {
        console.error('❌ Memory graph error:', error.message);
        res.status(500).json({ 
            error: error.message,
            entities: [],
            relations: []
        });
    }
});

// Search endpoint
app.get('/api/memory/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        console.log(`🔍 Searching memory for: "${query}"`);
        
        const result = await callMCPTool('search_nodes', { query });
        
        // Format the response
        const searchData = {
            entities: result.entities || [],
            relations: result.relations || []
        };
        
        console.log(`✅ Found ${searchData.entities.length} matching entities`);
        res.json(searchData);
    } catch (error) {
        console.error('❌ Memory search error:', error.message);
        res.status(500).json({ 
            error: error.message,
            entities: [], 
            relations: [] 
        });
    }
});

// Get specific nodes
app.post('/api/memory/nodes', async (req, res) => {
    try {
        const { names } = req.body;
        console.log(`📋 Getting specific nodes: ${names.join(', ')}`);
        
        const result = await callMCPTool('open_nodes', { names });
        res.json(result);
    } catch (error) {
        console.error('❌ Get nodes error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        mcpInitialized,
        serverRunning: !!memoryServer,
        timestamp: new Date().toISOString()
    });
});

// Start the memory server
startMemoryServer();

app.listen(PORT, () => {
    console.log(`🚀 Memory visualization server running at http://localhost:${PORT}`);
    console.log(`📊 Open visualizer: http://localhost:${PORT}/memory-visualizer.html`);
});

// Cleanup on exit
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    if (memoryServer) {
        memoryServer.kill();
    }
    process.exit();
});
