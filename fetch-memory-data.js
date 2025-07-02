#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Fetching memory data from MCP server...\n');

// Start memory server
const memoryServer = spawn('npx', ['-y', '@modelcontextprotocol/server-memory'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let responseBuffer = '';
let isInitialized = false;
let requestId = 1;

// Parse responses
memoryServer.stdout.on('data', (data) => {
    const output = data.toString();
    responseBuffer += output;
    
    const lines = responseBuffer.split('\n');
    responseBuffer = lines.pop(); // Keep incomplete line
    
    lines.forEach(line => {
        if (line.trim()) {
            try {
                const response = JSON.parse(line);
                console.log('📥 Response:', JSON.stringify(response, null, 2).substring(0, 200) + '...');
                
                // Handle initialization response
                if (response.id === 1 && response.result) {
                    isInitialized = true;
                    console.log('\n✅ MCP initialized successfully');
                    console.log('Available tools:', response.result.tools?.map(t => t.name).join(', '));
                    
                    // Now fetch the memory graph
                    setTimeout(fetchMemoryGraph, 500);
                }
                
                // Handle graph data response
                if (response.id === 2 && response.result) {
                    console.log('\n📊 Received memory graph data');
                    processMemoryData(response.result);
                }
            } catch (e) {
                // Ignore non-JSON output
            }
        }
    });
});

memoryServer.stderr.on('data', (data) => {
    console.log('ℹ️ Server info:', data.toString().trim());
});

// Initialize MCP connection
setTimeout(() => {
    console.log('📤 Sending initialize request...');
    const initRequest = {
        jsonrpc: "2.0",
        id: requestId++,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: {
                name: "memory-data-fetcher",
                version: "1.0.0"
            }
        }
    };
    memoryServer.stdin.write(JSON.stringify(initRequest) + '\n');
}, 500);

// Fetch memory graph
function fetchMemoryGraph() {
    console.log('\n📤 Fetching memory graph...');
    const graphRequest = {
        jsonrpc: "2.0",
        id: requestId++,
        method: "tools/call",
        params: {
            name: "read_graph",
            arguments: {}
        }
    };
    memoryServer.stdin.write(JSON.stringify(graphRequest) + '\n');
}

// Process and save memory data
function processMemoryData(result) {
    try {
        const entities = [];
        const relations = [];
        
        // Extract content from the result
        if (result.content && Array.isArray(result.content)) {
            let textContent = '';
            result.content.forEach(item => {
                if (item.type === 'text') {
                    textContent += item.text + '\n';
                }
            });
            
            console.log('\n📝 Raw content length:', textContent.length);
            
            // Try to parse as JSON first
            try {
                const jsonData = JSON.parse(textContent);
                if (jsonData.entities && jsonData.relations) {
                    console.log('✅ Parsed as JSON directly');
                    saveMemoryData(jsonData);
                    return;
                }
            } catch (e) {
                // Not JSON, parse as text
            }
            
            // Parse text format
            const lines = textContent.split('\n');
            let currentEntity = null;
            let currentRelation = null;
            let inObservations = false;
            
            for (const line of lines) {
                const trimmed = line.trim();
                
                // Entity parsing
                if (trimmed.includes('"type": "entity"')) {
                    if (currentEntity && currentEntity.name) {
                        entities.push(currentEntity);
                    }
                    currentEntity = { observations: [] };
                    currentRelation = null;
                    inObservations = false;
                }
                
                // Relation parsing
                if (trimmed.includes('"type": "relation"')) {
                    if (currentRelation && currentRelation.from && currentRelation.to) {
                        relations.push(currentRelation);
                    }
                    currentRelation = {};
                    currentEntity = null;
                    inObservations = false;
                }
                
                // Parse entity fields
                if (currentEntity) {
                    if (trimmed.includes('"name":')) {
                        const match = trimmed.match(/"name":\s*"([^"]+)"/);
                        if (match) currentEntity.name = match[1];
                    }
                    
                    if (trimmed.includes('"entityType":')) {
                        const match = trimmed.match(/"entityType":\s*"([^"]+)"/);
                        if (match) currentEntity.entityType = match[1];
                    }
                    
                    if (trimmed.includes('"observations":')) {
                        inObservations = true;
                    }
                    
                    if (inObservations && trimmed.startsWith('"') && trimmed.endsWith(',')) {
                        const observation = trimmed.slice(1, -2).replace(/\\"/g, '"');
                        currentEntity.observations.push(observation);
                    }
                    
                    if (inObservations && trimmed.startsWith('"') && trimmed.endsWith('"')) {
                        const observation = trimmed.slice(1, -1).replace(/\\"/g, '"');
                        currentEntity.observations.push(observation);
                    }
                }
                
                // Parse relation fields
                if (currentRelation) {
                    if (trimmed.includes('"from":')) {
                        const match = trimmed.match(/"from":\s*"([^"]+)"/);
                        if (match) currentRelation.from = match[1];
                    }
                    
                    if (trimmed.includes('"to":')) {
                        const match = trimmed.match(/"to":\s*"([^"]+)"/);
                        if (match) currentRelation.to = match[1];
                    }
                    
                    if (trimmed.includes('"relationType":')) {
                        const match = trimmed.match(/"relationType":\s*"([^"]+)"/);
                        if (match) currentRelation.relationType = match[1];
                    }
                }
            }
            
            // Add last entity/relation
            if (currentEntity && currentEntity.name) {
                entities.push(currentEntity);
            }
            if (currentRelation && currentRelation.from && currentRelation.to) {
                relations.push(currentRelation);
            }
            
            const memoryData = { entities, relations };
            saveMemoryData(memoryData);
        }
    } catch (error) {
        console.error('❌ Error processing memory data:', error);
    } finally {
        // Exit after processing
        setTimeout(() => {
            console.log('\n🛑 Shutting down...');
            memoryServer.kill();
            process.exit(0);
        }, 1000);
    }
}

// Save memory data to file
function saveMemoryData(data) {
    const filename = 'memory-data.json';
    const filepath = path.join(__dirname, filename);
    
    // Find orphaned nodes (entities without any relations)
    const entityNames = new Set(data.entities.map(e => e.name));
    const connectedEntities = new Set();
    
    data.relations.forEach(rel => {
        connectedEntities.add(rel.from);
        connectedEntities.add(rel.to);
    });
    
    const orphanedEntities = data.entities.filter(e => !connectedEntities.has(e.name));
    
    // Add analysis to the data
    data.analysis = {
        totalEntities: data.entities.length,
        totalRelations: data.relations.length,
        orphanedEntities: orphanedEntities.length,
        orphanedEntityNames: orphanedEntities.map(e => ({ name: e.name, type: e.entityType })),
        entityTypes: [...new Set(data.entities.map(e => e.entityType))],
        relationTypes: [...new Set(data.relations.map(r => r.relationType))]
    };
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    console.log('\n✅ Memory data saved to:', filename);
    console.log('\n📊 Summary:');
    console.log(`  - Total entities: ${data.entities.length}`);
    console.log(`  - Total relations: ${data.relations.length}`);
    console.log(`  - Orphaned entities: ${orphanedEntities.length}`);
    console.log(`  - Entity types: ${data.analysis.entityTypes.join(', ')}`);
    console.log(`  - Relation types: ${data.analysis.relationTypes.join(', ')}`);
    
    if (orphanedEntities.length > 0) {
        console.log('\n⚠️ Orphaned entities found:');
        orphanedEntities.slice(0, 5).forEach(e => {
            console.log(`  - ${e.name} (${e.entityType})`);
        });
        if (orphanedEntities.length > 5) {
            console.log(`  ... and ${orphanedEntities.length - 5} more`);
        }
    }
}

// Handle timeout
setTimeout(() => {
    console.log('\n⏱️ Timeout reached, shutting down...');
    memoryServer.kill();
    process.exit(1);
}, 30000);

// Clean exit on Ctrl+C
process.on('SIGINT', () => {
    console.log('\n🛑 Interrupted, shutting down...');
    if (memoryServer) {
        memoryServer.kill();
    }
    process.exit(0);
});