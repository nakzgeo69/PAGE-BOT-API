// api/gpt4.js
// Free GPT-4 API - Compatible with Render.com
// No API key required - Uses free public APIs

module.exports = {
    name: "GPT-4 Free",
    category: "ai",
    description: "Free GPT-4 API - No API key needed (Render compatible)",
    route: "/gpt4api",
    method: "GET",
    usage: "/gpt4api?prompt=Hello&model=chatgpt4",
    handler: async (req, res) => {
        const { prompt, model } = req.query;
        const startTime = Date.now();

        // ============================================================
        // 1. VALIDATION
        // ============================================================

        if (!prompt || prompt.trim() === "") {
            return res.status(400).json({
                operator: "Ry",
                timestamp: new Date().toISOString(),
                responseTime: `${Date.now() - startTime}ms`,
                error: "Missing prompt parameter",
                message: "Please provide a prompt",
                example: "/gpt4api?prompt=Hello&model=chatgpt4"
            });
        }

        // ============================================================
        // 2. MODEL SELECTION (Optional)
        // ============================================================
        const modelName = model || "chatgpt4";
        const allowedModels = ["chatgpt4", "chatgpt4-turbo", "gpt-4", "gpt-4-turbo"];
        
        if (model && !allowedModels.includes(model.toLowerCase())) {
            return res.status(400).json({
                operator: "Ry",
                timestamp: new Date().toISOString(),
                responseTime: `${Date.now() - startTime}ms`,
                error: "Invalid model",
                message: `Model '${model}' not available`,
                availableModels: allowedModels
            });
        }

        // ============================================================
        // 3. TRY FREE API FIRST (with timeout para sa Render)
        // ============================================================
        try {
            // Try to use free API with timeout (para hindi mag-hang sa Render)
            const axios = require('axios');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
            
            const response = await axios.get(
                `https://api.ryzendesu.vip/api/ai/chatgptv2?q=${encodeURIComponent(prompt)}`,
                { 
                    signal: controller.signal,
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }
            );
            
            clearTimeout(timeoutId);
            
            // Extract answer from response
            const answer = response.data.result || 
                          response.data.answer || 
                          response.data.response || 
                          response.data.message ||
                          response.data.data?.result ||
                          "No response from API";
            
            return res.json({
                operator: "Ry",
                timestamp: new Date().toISOString(),
                responseTime: `${Date.now() - startTime}ms`,
                answer: answer,
                model: modelName,
                source: "api.ryzendesu.vip"
            });

        } catch (error) {
            // ============================================================
            // 4. FALLBACK: Smart Mock Response (kung offline ang free API)
            // ============================================================
            console.log(`[GPT-4] Free API failed: ${error.message}. Using fallback.`);
            
            // Generate smart fallback responses
            let answer = await generateFallbackResponse(prompt);
            
            return res.json({
                operator: "Ry",
                timestamp: new Date().toISOString(),
                responseTime: `${Date.now() - startTime}ms`,
                answer: answer,
                model: modelName,
                source: "fallback-mock",
                note: "Using fallback response (free API temporarily unavailable)"
            });
        }
    }
};

// ============================================================
// FALLBACK RESPONSE GENERATOR
// ============================================================
async function generateFallbackResponse(prompt) {
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    const lowerPrompt = prompt.toLowerCase();
    
    // Smart responses based on prompt content
    if (lowerPrompt.includes("hello") || lowerPrompt.includes("hi") || lowerPrompt.includes("hey")) {
        return "Hello! How can I assist you today? 😊";
    }
    
    if (lowerPrompt.includes("how are you") || lowerPrompt.includes("how's it going")) {
        return "I'm doing great! Thanks for asking. How can I help you? 🚀";
    }
    
    if (lowerPrompt.includes("what is") || lowerPrompt.includes("explain")) {
        const topic = prompt.replace(/what is|explain|define/gi, "").trim();
        if (topic) {
            return `That's a great question about "${topic}"! Here's what I know:\n\n` +
                   `[GPT-4] ${topic} is a fascinating topic. In simple terms, it refers to... ` +
                   `(This is a fallback response. The free API is temporarily unavailable.)`;
        }
        return `[GPT-4] That's an interesting question! Let me think about "${prompt}"... ` +
               `(This is a fallback response. The free API is temporarily unavailable.)`;
    }
    
    if (lowerPrompt.includes("help") || lowerPrompt.includes("support")) {
        return "I'm here to help! Feel free to ask me anything. I can assist with questions, explanations, coding, and more! 💡";
    }
    
    if (lowerPrompt.includes("code") || lowerPrompt.includes("programming") || lowerPrompt.includes("javascript")) {
        return "[GPT-4] Here's a sample code snippet for your query:\n\n```javascript\n" +
               "// Example code\nfunction solution() {\n  console.log('Hello from GPT-4!');\n  return 'Success!';\n}\n```\n\n" +
               "This is a fallback response. The free API is temporarily unavailable.";
    }
    
    // Default response
    return `[GPT-4] I understand you're asking about "${prompt}". ` +
           `This is a fallback response because the free API is temporarily unavailable. ` +
           `Please try again in a few moments. 🙏`;
}
