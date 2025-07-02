#!/usr/bin/env node

const fs = require('fs');

// Load memory data
const memoryData = JSON.parse(fs.readFileSync('memory-data.json', 'utf8'));

// Find all orphaned nodes
const entityNames = new Set(memoryData.entities.map(e => e.name));
const connectedEntities = new Set();

// Collect all entities that have connections
memoryData.relations.forEach(rel => {
    connectedEntities.add(rel.from);
    connectedEntities.add(rel.to);
});

// Find orphaned entities
const orphanedEntities = memoryData.entities.filter(e => !connectedEntities.has(e.name));

// Sort by entity type for better organization
orphanedEntities.sort((a, b) => {
    if (a.entityType !== b.entityType) {
        return a.entityType.localeCompare(b.entityType);
    }
    return a.name.localeCompare(b.name);
});

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║              ORPHANED MEMORY NODES ANALYSIS            ║');
console.log('╠════════════════════════════════════════════════════════╣');
console.log(`║ Total Orphaned Nodes: ${orphanedEntities.length.toString().padEnd(32)} ║`);
console.log('╚════════════════════════════════════════════════════════╝\n');

// Group by entity type
const groupedOrphans = {};
orphanedEntities.forEach(entity => {
    if (!groupedOrphans[entity.entityType]) {
        groupedOrphans[entity.entityType] = [];
    }
    groupedOrphans[entity.entityType].push(entity);
});

// Display grouped orphans
Object.keys(groupedOrphans).sort().forEach(type => {
    console.log(`\n📁 ${type.toUpperCase()} (${groupedOrphans[type].length} orphaned)`);
    console.log('─'.repeat(60));
    
    groupedOrphans[type].forEach((entity, index) => {
        console.log(`\n${index + 1}. 📌 ${entity.name}`);
        
        if (entity.observations && entity.observations.length > 0) {
            console.log('   📝 Observations:');
            entity.observations.forEach((obs, i) => {
                // Truncate long observations
                const displayObs = obs.length > 100 ? obs.substring(0, 100) + '...' : obs;
                console.log(`      ${i + 1}. ${displayObs}`);
            });
        } else {
            console.log('   📝 No observations');
        }
    });
});

// Create a detailed orphans report
const orphansReport = {
    summary: {
        totalOrphaned: orphanedEntities.length,
        totalEntities: memoryData.entities.length,
        percentageOrphaned: ((orphanedEntities.length / memoryData.entities.length) * 100).toFixed(2) + '%',
        byType: {}
    },
    orphanedNodes: orphanedEntities.map(e => ({
        name: e.name,
        type: e.entityType,
        observations: e.observations || [],
        suggestedConnections: []
    }))
};

// Count by type
Object.keys(groupedOrphans).forEach(type => {
    orphansReport.summary.byType[type] = groupedOrphans[type].length;
});

// Suggest potential connections based on name similarity and type
orphansReport.orphanedNodes.forEach(orphan => {
    const suggestions = [];
    
    // Find entities with similar names
    memoryData.entities.forEach(entity => {
        if (entity.name === orphan.name) return;
        
        // Check for name similarity
        const orphanWords = orphan.name.toLowerCase().split(/\s+/);
        const entityWords = entity.name.toLowerCase().split(/\s+/);
        const commonWords = orphanWords.filter(w => entityWords.includes(w) && w.length > 3);
        
        if (commonWords.length > 0) {
            suggestions.push({
                entity: entity.name,
                type: entity.entityType,
                reason: `Common words: ${commonWords.join(', ')}`,
                confidence: commonWords.length / Math.max(orphanWords.length, entityWords.length)
            });
        }
        
        // Check for type relationships
        if (orphan.type === 'Company' && entity.entityType === 'Person') {
            if (entity.name.includes('CEO') || entity.name.includes('Founder')) {
                suggestions.push({
                    entity: entity.name,
                    type: entity.entityType,
                    reason: 'Potential leadership connection',
                    confidence: 0.5
                });
            }
        }
    });
    
    // Sort by confidence and take top 3
    orphan.suggestedConnections = suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);
});

// Save detailed report
fs.writeFileSync('orphaned-nodes-report.json', JSON.stringify(orphansReport, null, 2));

console.log('\n\n📊 SUMMARY STATISTICS');
console.log('─'.repeat(60));
console.log(`Total Entities: ${memoryData.entities.length}`);
console.log(`Orphaned Entities: ${orphanedEntities.length} (${orphansReport.summary.percentageOrphaned})`);
console.log(`Connected Entities: ${memoryData.entities.length - orphanedEntities.length}`);

console.log('\n📈 ORPHANED NODES BY TYPE:');
Object.entries(orphansReport.summary.byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
    });

console.log('\n✅ Detailed report saved to: orphaned-nodes-report.json');

// Create a simple reconnection script template
const reconnectionScript = `// Suggested connections for orphaned nodes
// Copy and modify this script to create the connections you want

const connectionsToCreate = [
${orphansReport.orphanedNodes
    .filter(n => n.suggestedConnections.length > 0)
    .map(node => {
        const bestSuggestion = node.suggestedConnections[0];
        return `  {
    from: "${node.name}",
    to: "${bestSuggestion.entity}",
    relationType: "related_to", // Change this to appropriate relation type
    reason: "${bestSuggestion.reason}"
  }`;
    })
    .join(',\n')}
];

// Use this template to create relations in your MCP memory system
`;

fs.writeFileSync('suggested-reconnections.js', reconnectionScript);
console.log('💡 Suggested reconnections template saved to: suggested-reconnections.js\n');