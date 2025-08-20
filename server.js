const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Explicit routes for static files
app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'styles.css'));
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'script.js'));
});

// Coze API configuration
const COZE_API_KEY = process.env.COZE_API_KEY;
const COZE_API_BASE_URL = process.env.COZE_API_BASE_URL || 'https://api.coze.com';

// Validate environment variables
if (!COZE_API_KEY) {
    console.error('Error: COZE_API_KEY is not set in environment variables');
    process.exit(1);
}

// Helper function to extract lab information from website
async function extractLabInfo(url) {
    try {
        console.log('Fetching lab website:', url);

        // First try to fetch the page directly
        let response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        let content = response.data;
        let extractedInfo = parseLabContent(content, url);

        // If we didn't find enough info, try searching for the lab
        if (!extractedInfo.emails || extractedInfo.emails.length === 0) {
            console.log('No emails found on main page, trying search...');
            extractedInfo = await searchLabInfo(url);
        }

        return extractedInfo;

    } catch (error) {
        console.log('Direct fetch failed, trying search approach:', error.message);
        return await searchLabInfo(url);
    }
}

// Parse lab content from HTML
function parseLabContent(html, url) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;

    // Extract emails
    const emails = [...new Set(html.match(emailRegex) || [])];

    // Extract phone numbers
    const phones = [...new Set(html.match(phoneRegex) || [])];

    // Try to extract lab name from title or headers
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);

    let labName = '';
    if (titleMatch) {
        labName = titleMatch[1].replace(/\s+/g, ' ').trim();
    } else if (h1Match) {
        labName = h1Match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    // Extract potential PI names (look for common patterns)
    const namePatterns = [
        /Dr\.?\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
        /Professor\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
        /([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(PhD|MD|Dr\.)/g
    ];

    let potentialNames = [];
    namePatterns.forEach(pattern => {
        const matches = [...html.matchAll(pattern)];
        matches.forEach(match => {
            if (match[1]) potentialNames.push(match[1]);
        });
    });

    return {
        url: url,
        labName: labName,
        emails: emails,
        phones: phones,
        potentialNames: [...new Set(potentialNames)],
        extractedAt: new Date().toISOString()
    };
}

// Search for lab information using external search
async function searchLabInfo(labUrl) {
    try {
        // Extract domain and lab name for search
        const domain = new URL(labUrl).hostname;
        const searchQuery = `site:${domain} email contact`;

        console.log('Searching with query:', searchQuery);

        // This is a simplified version - in a real implementation,
        // you might want to use a search API or web scraping service
        return {
            url: labUrl,
            labName: 'Lab information extraction in progress...',
            emails: [],
            phones: [],
            potentialNames: [],
            extractedAt: new Date().toISOString(),
            note: 'Please check the website manually for contact information'
        };

    } catch (error) {
        console.error('Search failed:', error);
        return {
            url: labUrl,
            labName: 'Unable to extract lab information',
            emails: [],
            phones: [],
            potentialNames: [],
            extractedAt: new Date().toISOString(),
            error: error.message
        };
    }
}

// API Routes

// Extract lab contact information from website
app.post('/api/extract-lab-info', async (req, res) => {
    try {
        const { labUrl } = req.body;

        if (!labUrl) {
            return res.status(400).json({ error: 'Lab URL is required' });
        }

        console.log('Extracting lab info from:', labUrl);

        // Try to fetch the lab website directly
        let labInfo = await extractLabInfo(labUrl);

        res.json({
            success: true,
            labInfo: labInfo
        });

    } catch (error) {
        console.error('Error extracting lab info:', error);
        res.status(500).json({
            error: 'Failed to extract lab information',
            details: error.message
        });
    }
});

// Generate email using Coze workflow
app.post('/api/generate-email', async (req, res) => {
    try {
        const {
            name,
            school,
            grade,
            major,
            academic_background,
            lab_website,
            research_experience,
            skill,
            interest_area
        } = req.body;

        // Validate required fields
        const requiredFields = ['name', 'school', 'grade', 'major', 'academic_background', 'lab_website'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Prepare data for Coze API
        const cozePayload = {
            Lab_website: lab_website,
            Name: name,
            School: school,
            Grade: grade,
            Academic_Background: academic_background,
            Major: major,
            Research_Experience: research_experience || '',
            Skill: skill || '',
            Interest_Area: interest_area || ''
        };

        console.log('Calling Coze API with payload:', cozePayload);

        // Temporary mock response for testing (remove when API is working)
        if (process.env.NODE_ENV === 'development' && !process.env.COZE_API_WORKING) {
            console.log('Using mock response for testing...');
            const mockEmail = `Subject: Research Assistant Application - ${cozePayload.Name}

Dear Professor,

I hope this email finds you well. My name is ${cozePayload.Name}, and I am a ${cozePayload.Grade} student majoring in ${cozePayload.Major} at ${cozePayload.School}.

I am writing to express my strong interest in joining your research team as a research assistant. After reviewing your lab's work on ${cozePayload.Lab_website}, I am particularly excited about the research directions and methodologies employed in your laboratory.

Academic Background:
${cozePayload.Academic_Background}

${cozePayload.Research_Experience ? `Research Experience:\n${cozePayload.Research_Experience}\n\n` : ''}${cozePayload.Skill ? `Relevant Skills:\n${cozePayload.Skill}\n\n` : ''}${cozePayload.Interest_Area ? `Research Interests:\n${cozePayload.Interest_Area}\n\n` : ''}I am eager to contribute to your research and learn from your expertise. I would be grateful for the opportunity to discuss how I can contribute to your lab's ongoing projects.

Thank you for considering my application. I look forward to hearing from you.

Best regards,
${cozePayload.Name}

---
This is a mock email generated for testing purposes. Configure your Coze API to generate real emails.`;

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockResponse = {
                data: {
                    output: mockEmail,
                    success: true
                }
            };

            console.log('Mock email generated successfully');
            const generatedEmail = mockResponse.data.output;

            res.json({
                success: true,
                email: generatedEmail,
                timestamp: new Date().toISOString(),
                mock: true
            });
            return;
        }

        // Call Coze workflow API
        const cozeResponse = await axios.post(
            `${COZE_API_BASE_URL}/v1/workflow/run`,
            {
                workflow_id: process.env.COZE_WORKFLOW_ID,
                parameters: cozePayload
            },
            {
                headers: {
                    'Authorization': `Bearer ${COZE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 60 seconds timeout for AI processing
            }
        );

        console.log('Coze API response:', cozeResponse.data);

        // Extract the generated email from the workflow response
        let generatedEmail = 'Email generated successfully';

        if (cozeResponse.data && cozeResponse.data.data) {
            try {
                // Parse the JSON string in the data field
                const parsedData = JSON.parse(cozeResponse.data.data);
                if (parsedData.output) {
                    generatedEmail = parsedData.output;
                }
            } catch (e) {
                console.log('Error parsing workflow data:', e);
                // Fallback to direct data access
                generatedEmail = cozeResponse.data.data || cozeResponse.data.output || cozeResponse.data.result || 'Email generated successfully';
            }
        } else if (cozeResponse.data && cozeResponse.data.output) {
            generatedEmail = cozeResponse.data.output;
        } else if (cozeResponse.data && cozeResponse.data.result) {
            generatedEmail = cozeResponse.data.result;
        }

        res.json({
            success: true,
            email: generatedEmail,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error generating email:', error);
        
        let errorMessage = 'Failed to generate email';
        let statusCode = 500;

        if (error.response) {
            // API responded with error status
            statusCode = error.response.status;
            errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
            console.error('API Error Response:', error.response.data);
        } else if (error.request) {
            // Request was made but no response received
            errorMessage = 'No response from Coze API. Please check your internet connection.';
            console.error('No response received:', error.request);
        } else {
            // Something else happened
            errorMessage = error.message;
            console.error('Request setup error:', error.message);
        }

        res.status(statusCode).json({
            success: false,
            error: errorMessage
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to view the application`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
