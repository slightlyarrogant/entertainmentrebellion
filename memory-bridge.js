#!/usr/bin/env node

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3001;

// Serve static files
app.use(express.static('.'));

// Memory server process
let memoryServer;

// Start memory server
function startMemoryServer() {
    memoryServer = spawn('npx', ['-y', '@modelcontextprotocol/server-memory'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    memoryServer.stdout.on('data', (data) => {
        console.log(`Memory server: ${data}`);
    });
    
    memoryServer.stderr.on('data', (data) => {
        console.error(`Memory server error: ${data}`);
    });
}

// API endpoint to get memory data
app.get('/api/memory/graph', async (req, res) => {
    try {
        // Send JSON-RPC request to memory server
        const request = {
            jsonrpc: "2.0",
            id: 1,
            method: "memory/read_graph",
            params: {}
        };
        
        memoryServer.stdin.write(JSON.stringify(request) + '\n');
        
        // Listen for response
        memoryServer.stdout.once('data', (data) => {
            try {
                const response = JSON.parse(data.toString());
                res.json(response.result || { entities: [], relations: [] });
            } catch (error) {
                res.status(500).json({ error: 'Failed to parse memory response' });
            }
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search endpoint
app.get('/api/memory/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        
        const request = {
            jsonrpc: "2.0",
            id: 2,
            method: "memory/search_nodes",
            params: { query }
        };
        
        memoryServer.stdin.write(JSON.stringify(request) + '\n');
        
        memoryServer.stdout.once('data', (data) => {
            try {
                const response = JSON.parse(data.toString());
                res.json(response.result || { entities: [], relations: [] });
            } catch (error) {
                res.status(500).json({ error: 'Failed to parse search response' });
            }
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start servers
startMemoryServer();

app.listen(PORT, () => {
    console.log(`Memory visualization server running at http://localhost:${PORT}`);
    console.log(`Open the visualizer at http://localhost:${PORT}/ALEX_DEMO_INSTRUCTIONS.md`);
});

// Cleanup on exit
process.on('SIGINT', () => {
    if (memoryServer) {
        memoryServer.kill();
    }
    process.exit();
});
