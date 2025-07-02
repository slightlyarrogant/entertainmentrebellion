#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🔍 Discovering MCP Memory Server Tools...\n');

const memoryServer = spawn('npx', ['-y', '@modelcontextprotocol/server-memory'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let responseBuffer = '';
let serverReady = false;

memoryServer.stdout.on('data', (data) => {
    const output = data.toString();
    responseBuffer += output;
    
    const lines = responseBuffer.split('\n');
    responseBuffer = lines.pop();
    
    lines.forEach(line => {
        if (line.trim()) {
            try {
                const response = JSON.parse(line);
                console.log('📥 Response:', JSON.stringify(response, null, 2));
                
                // If we get tools list, try calling them
                if (response.result && response.result.tools) {
                    console.log('\n🎯 Found tools! Testing each one...\n');
                    response.result.tools.forEach((tool, index) => {
                        setTimeout(() => {
                            console.log(`\n🔧 Testing tool: ${tool.name}`);
                            const toolCall = {
                                jsonrpc: "2.0",
                                id: 100 + index,
                                method: "tools/call",
                                params: {
                                    name: tool.name,
                                    arguments: {}
                                }
                            };
                            memoryServer.stdin.write(JSON.stringify(toolCall) + '\n');
                        }, index * 1000);
                    });
                }
            } catch (e) {
                console.log('📝 Raw:', line);
                if (line.includes('Knowledge Graph MCP Server')) {
                    serverReady = true;
                }
            }
        }
    });
});

memoryServer.stderr.on('data', (data) => {
    console.log('⚠️ Stderr:', data.toString());
});

setTimeout(() => {
    console.log('1️⃣ Initializing MCP connection...');
    const init = {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05",
            capabilities: {
                tools: {}
            },
            clientInfo: {
                name: "memory-discovery",
                version: "1.0.0"
            }
        }
    };
    memoryServer.stdin.write(JSON.stringify(init) + '\n');
}, 1000);

setTimeout(() => {
    console.log('\n2️⃣ Requesting tools list...');
    const toolsList = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {}
    };
    memoryServer.stdin.write(JSON.stringify(toolsList) + '\n');
}, 2000);

setTimeout(() => {
    console.log('\n✅ Discovery complete. Cleaning up...');
    memoryServer.kill();
    process.exit(0);
}, 10000);
