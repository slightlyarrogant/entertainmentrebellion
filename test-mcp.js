#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

class MCPTester {
  constructor() {
    this.serverProcess = null;
  }

  async testMCPServer() {
    console.log('🧪 Testing Entertainment Discovery Rebellion MCP Server');
    console.log('='.repeat(55));

    try {
      // Test 1: Server startup
      console.log('\n📋 TEST 1: Server Startup...');
      await this.testServerStartup();

      // Test 2: Resource listing
      console.log('\n📋 TEST 2: Resource Listing...');
      await this.testResourceListing();

      // Test 3: Tool listing
      console.log('\n📋 TEST 3: Tool Listing...');
      await this.testToolListing();

      // Test 4: Content discovery
      console.log('\n📋 TEST 4: Content Discovery...');
      await this.testContentDiscovery();

      // Test 5: Subscription context
      console.log('\n📋 TEST 5: Subscription Context...');
      await this.testSubscriptionContext();

      console.log('\n✅ All tests completed successfully!');

    } catch (error) {
      console.error('❌ Test failed:', error.message);
    } finally {
      if (this.serverProcess) {
        this.serverProcess.kill();
      }
    }
  }

  async testServerStartup() {
    return new Promise((resolve, reject) => {
      console.log('   🚀 Starting MCP server...');
      
      this.serverProcess = spawn('node', ['src/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      this.serverProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        if (errorOutput.includes('Entertainment Discovery Rebellion MCP server running')) {
          console.log('   ✅ Server started successfully');
          resolve();
        }
      });

      this.serverProcess.on('error', (error) => {
        console.log('   ❌ Server startup failed:', error.message);
        reject(error);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!errorOutput.includes('Entertainment Discovery Rebellion MCP server running')) {
          console.log('   ❌ Server startup timeout');
          reject(new Error('Server startup timeout'));
        }
      }, 5000);
    });
  }

  async testResourceListing() {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'resources/list'
    };

    const response = await this.sendMCPRequest(request);
    
    if (response.result && response.result.resources) {
      console.log('   ✅ Resource listing successful');
      console.log(`   📄 Found ${response.result.resources.length} resources`);
      response.result.resources.forEach(resource => {
        console.log(`      - ${resource.name}: ${resource.uri}`);
      });
    } else {
      throw new Error('Resource listing failed');
    }
  }

  async testToolListing() {
    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };

    const response = await this.sendMCPRequest(request);
    
    if (response.result && response.result.tools) {
      console.log('   ✅ Tool listing successful');
      console.log(`   🔧 Found ${response.result.tools.length} tools`);
      response.result.tools.forEach(tool => {
        console.log(`      - ${tool.name}: ${tool.description.substring(0, 50)}...`);
      });
    } else {
      throw new Error('Tool listing failed');
    }
  }

  async testContentDiscovery() {
    const request = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'discover_content_with_context',
        arguments: {
          situation_description: 'Stressed after work, need to unwind',
          mood: 'stressed',
          time_available: 90,
          viewing_companions: 'solo'
        }
      }
    };

    const response = await this.sendMCPRequest(request);
    
    if (response.result && response.result.content) {
      console.log('   ✅ Content discovery successful');
      const result = JSON.parse(response.result.content[0].text);
      console.log(`   🎬 Found ${result.recommendations?.length || 0} recommendations`);
      if (result.recommendations && result.recommendations.length > 0) {
        console.log(`      - Top recommendation: ${result.recommendations[0].title}`);
      }
    } else {
      throw new Error('Content discovery failed');
    }
  }

  async testSubscriptionContext() {
    const request = {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'update_subscription_context',
        arguments: {
          context_type: 'personal',
          platform: 'Netflix',
          access_details: 'Always available, my personal account'
        }
      }
    };

    const response = await this.sendMCPRequest(request);
    
    if (response.result && response.result.content) {
      console.log('   ✅ Subscription context update successful');
      const result = JSON.parse(response.result.content[0].text);
      console.log(`   📱 Platform: ${result.platform}`);
      console.log(`   🔧 Action: ${result.action}`);
    } else {
      throw new Error('Subscription context update failed');
    }
  }

  async sendMCPRequest(request) {
    return new Promise((resolve, reject) => {
      if (!this.serverProcess) {
        reject(new Error('Server not running'));
        return;
      }

      let responseData = '';
      
      const onData = (data) => {
        responseData += data.toString();
        try {
          const response = JSON.parse(responseData);
          this.serverProcess.stdout.off('data', onData);
          resolve(response);
        } catch (e) {
          // Not complete JSON yet, continue collecting
        }
      };

      this.serverProcess.stdout.on('data', onData);
      
      // Send request
      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');

      // Timeout after 10 seconds
      setTimeout(() => {
        this.serverProcess.stdout.off('data', onData);
        reject(new Error('Request timeout'));
      }, 10000);
    });
  }
}

// Test server status without starting it
async function testServerStatus() {
  console.log('🔍 Testing server configuration...');
  
  try {
    // Check if main files exist
    console.log('   📁 Checking project structure...');
    const fs = await import('fs');
    
    const requiredFiles = [
      'src/index.js',
      'src/services/content-discovery.js',
      'src/services/memory.js',
      'src/services/subscription-context.js',
      'package.json'
    ];

    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`   ✅ ${file} exists`);
      } else {
        console.log(`   ❌ ${file} missing`);
      }
    });

    // Check package.json
    console.log('\n   📦 Checking dependencies...');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['@modelcontextprotocol/sdk', 'axios', 'dotenv'];
    
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        console.log(`   ✅ ${dep} installed`);
      } else {
        console.log(`   ❌ ${dep} missing`);
      }
    });

    // Check environment setup
    console.log('\n   🔧 Environment configuration...');
    if (fs.existsSync('.env.example')) {
      console.log('   ✅ .env.example exists');
    } else {
      console.log('   ❌ .env.example missing');
    }

    console.log('\n✅ Configuration check complete!');
    console.log('\n💡 To test the full MCP server:');
    console.log('   1. Copy .env.example to .env and add API keys');
    console.log('   2. Run: node test-mcp.js --full');

  } catch (error) {
    console.error('❌ Configuration check failed:', error.message);
  }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const fullTest = process.argv.includes('--full');
  
  if (fullTest) {
    const tester = new MCPTester();
    tester.testMCPServer();
  } else {
    testServerStatus();
  }
}