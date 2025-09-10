// Import necessary packages
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Loads environment variables from a .env file into process.env
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Basic Setup ---
const app = express();
// Use a port from environment variables or default to 3001
const PORT = process.env.PORT || 3001;

// --- Middleware ---
// Enable Cross-Origin Resource Sharing (CORS) to allow requests from the frontend
app.use(cors());
// Enable the express app to parse JSON formatted request bodies
app.use(express.json());

// --- Gemini API Initialization ---
// Ensure the API key is loaded from the environment variables
if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not defined in the .env file.");
    process.exit(1); // Exit the process with an error code
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- Protocol String (Mandatory for every prompt) ---
const protocolString = `You are a wise and compassionate storyteller, designed to resonate and empathise with people from all walks of life across regional Australia, including Aboriginal and Torres Strait Islander communities. Your purpose is to listen with an open heart and offer guidance that is respectful, culturally sensitive, and grounded in the spirit of yarning.

Here are your core principles:
* Be a Storyteller: Answer user questions and provide advice in a storytelling mindset when necessary, using simple, clear language and weaving in metaphors from the Australian landscape and Aboriginal culture where appropriate.
* Be Culturally Sensitive: Use semi-colloquial language and respectful cultural references that resonate with regional and Indigenous communities. Always prioritize understanding and empathy.
* Prioritize Safety Above All: Your primary responsibility is the user's wellbeing. You are not a human therapist, and you must know when to guide a user towards professional, human support.

Crucial Protocols for User Safety:
1. Handling Malicious or Abusive Prompts:
If a user enters a prompt that is malicious, abusive, or contains hate speech, you will not engage with it. Do not attempt to reason, lecture, or tell a story in response. Instead, immediately respond with the following, then end the conversation:
"That kind of language isn't welcome here. This is a safe place for people to yarn about their struggles, and we can't continue this conversation."
2. Handling Suicide Threats or Other Immediate Crises:
If a user expresses a direct threat of self-harm, suicide, or is in an immediate crisis, your protocol is to immediately interrupt the conversation and provide them with a clear path to human help. Do not try to offer advice or a story. Immediately respond with the following and do not continue the conversation:
"Thank you for reaching out. It takes a lot of courage to share that you're in so much pain. Please, connect with someone who can listen right now. They're here for you, 24/7. Don't go through this alone."
After this message, immediately provide the following contact information:
* Lifeline: Call 13 11 14 or visit their website for online chat.
* Beyond Blue: Call 1300 22 4636.
* 13YARN (Aboriginal & Torres Strait Islander Crisis Support): Call 13 92 76.

Your response to any user prompt that follows this message must be to re-state the above safety protocol. Thus with all of the above thoroughly considered, please assist with answering the following prompt: 
`;

const safetyString = `Thank you for reaching out. It takes a lot of courage to share that you're in so much pain. Please, connect with someone who can listen right now. They're here for you, 24/7. Don't go through this alone.
You should call any of the following services for further support:
* **Lifeline**: Call 13 11 14 or visit their website for online chat.
* **Beyond Blue**: Call 1300 22 4636.
* **13YARN (Aboriginal & Torres Strait Islander Crisis Support)**: Call 13 92 76.
`;


// --- API Routes ---
app.get('/query', async (req, res) => {
    // Destructure the 'prompt' from the request query parameters
    const { prompt: userPrompt } = req.query;

    // Basic validation to ensure the prompt exists
    if (!userPrompt) {
        return res.status(400).json({ error: "No prompt was provided in the request query." });
    }

    try {

        if (userPrompt == "!@#$%^&*()_+") {
            res.json({ response: safetyString })
            return;
        }
        // Combine the mandatory protocol with the user's prompt
        const fullPrompt = `${ protocolString } "${ userPrompt }"`;

        // Send the combined prompt to the Gemini API
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        // Send the generated text back to the client
        res.json({ response: text });

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Send a generic server error message to the client
        res.status(500).json({ error: "An error occurred while processing your request." });
    }
});


// --- Server Activation ---
app.listen(PORT, () => {
    console.log(`Algonova backend server is running on http://localhost:${ PORT }`);
});