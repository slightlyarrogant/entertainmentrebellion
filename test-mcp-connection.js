#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('Testing MCP Memory Server Connection...\n');

// Start memory server
const memoryServer = spawn('npx', ['-y', '@modelcontextprotocol/server-memory'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let responseBuffer = '';

memoryServer.stdout.on('data', (data) => {
    const output = data.toString();
    responseBuffer += output;
    
    // Try to parse each line as JSON
    const lines = responseBuffer.split('\n');
    responseBuffer = lines.pop(); // Keep incomplete line
    
    lines.forEach(line => {
        if (line.trim()) {
            try {
                const response = JSON.parse(line);
                console.log('📥 Response:', JSON.stringify(response, null, 2));
            } catch (e) {
                console.log('📝 Raw output:', line);
            }
        }
    });
});

memoryServer.stderr.on('data', (data) => {
    console.log('⚠️ Error:', data.toString());
});

// Wait for server to start, then test methods
setTimeout(() => {
    console.log('\n🔍 Testing MCP protocol...\n');
    
    // Test 1: Initialize
    console.log('1️⃣ Sending initialize request...');
    const initRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: {
                name: "memory-test-client",
                version: "1.0.0"
            }
        }
    };
    memoryServer.stdin.write(JSON.stringify(initRequest) + '\n');
    
    // Test 2: List tools
    setTimeout(() => {
        console.log('\n2️⃣ Sending tools/list request...');
        const toolsRequest = {
            jsonrpc: "2.0",
            id: 2,
            method: "tools/list",
            params: {}
        };
        memoryServer.stdin.write(JSON.stringify(toolsRequest) + '\n');
    }, 1000);
    
    // Test 3: Try memory operations
    setTimeout(() => {
        console.log('\n3️⃣ Testing memory operations...');
        
        // Try different possible method names
        const testMethods = [
            'memory/read_graph',
            'memory/search_nodes', 
            'read_graph',
            'search_nodes',
            'get_graph',
            'list_entities'
        ];
        
        testMethods.forEach((method, index) => {
            setTimeout(() => {
                console.log(`\nTesting method: ${method}`);
                const testRequest = {
                    jsonrpc: "2.0",
                    id: 10 + index,
                    method: method,
                    params: {}
                };
                memoryServer.stdin.write(JSON.stringify(testRequest) + '\n');
            }, index * 500);
        });
    }, 2000);
    
    // Cleanup
    setTimeout(() => {
        console.log('\n✅ Test complete. Shutting down...');
        memoryServer.kill();
        process.exit(0);
    }, 6000);
    
}, 500);

memoryServer.on('close', (code) => {
    console.log(`\n🔚 Memory server exited with code ${code}`);
});
