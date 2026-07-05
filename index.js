const express = require('express');  
const fs = require('fs');  
const path = require('path');  
const cors = require('cors');  

const app = express();  
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(express.json());  
app.use(express.urlencoded({ extended: true }));
app.use(cors());  
app.use(express.static('public')); // Serve static files  

// ============================================================
// LOAD ALL APIS FROM /api FOLDER
// ============================================================
const commandsPath = path.join(__dirname, 'api');  
const commands = [];  

// Create api folder if it doesn't exist
if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
    console.log('📁 Created /api folder');
}

// Load all command files
fs.readdirSync(commandsPath).forEach(file => {  
    if (file.endsWith('.js')) {  
        try {  
            const command = require(`./api/${file}`);  

            if (!command.name || !command.handler) {  
                throw new Error(`Missing required properties (name, handler) in ${file}`);  
            }  

            const route = command.route || `/${command.name.toLowerCase().replace(/\s+/g, '-')}`;  
            const method = command.method?.toLowerCase() || 'get';  

            // Register the route with Express
            if (typeof app[method] === 'function') {
                app[method](route, command.handler);  
            } else {
                throw new Error(`Invalid method '${method}' in ${file}`);
            }

            // Store command metadata
            commands.push({  
                id: command.name.toLowerCase().replace(/\s+/g, '-'),
                name: command.name,  
                category: command.category || "uncategorized",  
                route: route,  
                method: method.toUpperCase(),  
                usage: command.usage || "No usage information provided.",
                description: command.description || "No description available."
            });  

            console.log(`✅ Loaded: ${command.name} → ${method.toUpperCase()} ${route}`);  
        } catch (error) {  
            console.error(`❌ Error loading ${file}: ${error.message}`);  
        }  
    }  
});  

// ============================================================
// ROOT ENDPOINTS
// ============================================================

// Serve index.html for root
app.get('/', (req, res) => {  
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.json({
            name: "PAGE-BOT-API",
            version: "1.0.0",
            status: "running on Render",
            endpoints: commands.map(c => ({
                name: c.name,
                route: c.route,
                method: c.method,
                usage: c.usage
            }))
        });
    }
});  

// API to get the list of all commands  
app.get('/api/list', (req, res) => {  
    res.json(commands);  
});  

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        commands: commands.length
    });
});

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `No endpoint found for ${req.method} ${req.path}`,
        availableEndpoints: commands.map(c => `${c.method} ${c.route}`)
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('🔥 Error:', err.message);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Loaded ${commands.length} API endpoints`);
    console.log(`🌐 Dashboard: http://localhost:${PORT}\n`);
});

module.exports = app;
