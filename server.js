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
app.use(express.static('public'));

// Coze API configuration
const COZE_API_KEY = process.env.COZE_API_KEY;
const COZE_API_BASE_URL = process.env.COZE_API_BASE_URL || 'https://api.coze.com';

// Validate environment variables
if (!COZE_API_KEY) {
    console.error('Error: COZE_API_KEY is not set in environment variables');
    process.exit(1);
}

// API Routes

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
