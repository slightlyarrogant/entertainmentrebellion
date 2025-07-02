#!/usr/bin/env node

const fs = require('fs');

console.log('🔍 Checking for broken relations in memory data...\n');

// Load memory data
const memoryData = JSON.parse(fs.readFileSync('memory-data.json', 'utf8'));

// Create a set of all entity names for quick lookup
const entityNames = new Set(memoryData.entities.map(e => e.name));

// Find broken relations
const brokenRelations = [];
const validRelations = [];

memoryData.relations.forEach((relation, index) => {
    const fromExists = entityNames.has(relation.from);
    const toExists = entityNames.has(relation.to);
    
    if (!fromExists || !toExists) {
        brokenRelations.push({
            ...relation,
            index,
            missingFrom: !fromExists,
            missingTo: !toExists
        });
    } else {
        validRelations.push(relation);
    }
});

console.log('📊 Analysis Results:');
console.log(`Total relations: ${memoryData.relations.length}`);
console.log(`Valid relations: ${validRelations.length}`);
console.log(`Broken relations: ${brokenRelations.length}\n`);

if (brokenRelations.length > 0) {
    console.log('❌ Broken Relations Found:');
    console.log('─'.repeat(80));
    
    brokenRelations.forEach((rel, i) => {
        console.log(`\n${i + 1}. Relation #${rel.index}`);
        console.log(`   From: ${rel.from} ${rel.missingFrom ? '❌ (MISSING)' : '✓'}`);
        console.log(`   To: ${rel.to} ${rel.missingTo ? '❌ (MISSING)' : '✓'}`);
        console.log(`   Type: ${rel.relationType}`);
    });
    
    // Group by missing entities
    const missingEntities = new Map();
    brokenRelations.forEach(rel => {
        if (rel.missingFrom) {
            if (!missingEntities.has(rel.from)) {
                missingEntities.set(rel.from, []);
            }
            missingEntities.get(rel.from).push(rel);
        }
        if (rel.missingTo) {
            if (!missingEntities.has(rel.to)) {
                missingEntities.set(rel.to, []);
            }
            missingEntities.get(rel.to).push(rel);
        }
    });
    
    console.log('\n\n📋 Missing Entities Summary:');
    console.log('─'.repeat(80));
    
    Array.from(missingEntities.entries()).forEach(([entityName, relations]) => {
        console.log(`\n"${entityName}" (referenced in ${relations.length} relations):`);
        relations.forEach(rel => {
            if (rel.from === entityName) {
                console.log(`  - As source in: ${rel.from} → ${rel.to} (${rel.relationType})`);
            } else {
                console.log(`  - As target in: ${rel.from} → ${rel.to} (${rel.relationType})`);
            }
        });
    });
    
    // Create cleaned data
    const cleanedData = {
        ...memoryData,
        relations: validRelations,
        analysis: {
            ...memoryData.analysis,
            brokenRelationsRemoved: brokenRelations.length,
            missingEntities: Array.from(missingEntities.keys())
        }
    };
    
    // Backup original file
    fs.writeFileSync('memory-data-backup.json', JSON.stringify(memoryData, null, 2));
    console.log('\n💾 Original data backed up to: memory-data-backup.json');
    
    // Save cleaned data
    fs.writeFileSync('memory-data.json', JSON.stringify(cleanedData, null, 2));
    console.log('✅ Cleaned data saved to: memory-data.json');
    console.log(`🧹 Removed ${brokenRelations.length} broken relations\n`);
    
    // Create report
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalRelations: memoryData.relations.length,
            validRelations: validRelations.length,
            brokenRelations: brokenRelations.length,
            missingEntities: Array.from(missingEntities.keys())
        },
        brokenRelations: brokenRelations,
        missingEntityDetails: Object.fromEntries(missingEntities)
    };
    
    fs.writeFileSync('broken-relations-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Detailed report saved to: broken-relations-report.json');
    
} else {
    console.log('✅ No broken relations found! All relations point to existing entities.');
}

console.log('\n🎉 Done! The visualization should now work properly.');