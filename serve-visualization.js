#!/usr/bin/env node

import express from 'express';
import path from 'path';

const app = express();
const PORT = 3000;

// Serve static files from current directory
app.use(express.static('.'));

// Root route redirects to visualization
app.get('/', (req, res) => {
    res.redirect('/memory-visualization.html');
});

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║      Memory Graph Visualization Server                 ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  🚀 Server running at: http://localhost:${PORT}           ║
║  📊 Visualization at: http://localhost:${PORT}/memory-visualization.html
║                                                        ║
║  📌 Features:                                          ║
║     • Interactive force-directed graph                 ║
║     • Orphaned nodes highlighted with dashed border   ║
║     • Project-related nodes in gold                   ║
║     • Search and filter capabilities                   ║
║     • Click nodes to see details and relations        ║
║     • Drag nodes to reposition                        ║
║     • Zoom and pan with mouse                         ║
║                                                        ║
║  Press Ctrl+C to stop the server                      ║
╚════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down visualization server...');
    process.exit();
});