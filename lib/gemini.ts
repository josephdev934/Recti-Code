import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@/config';

if (!GEMINI_API_KEY) {
  throw new Error('Please define the GEMINI_API_KEY environment variable');
}

// Use Gemini 2.5 Flash-Lite (stable, good free tier limits)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash-lite'
});

export async function analyzeCode(code: string, language: string) {
  const prompt = `
You are an expert code reviewer. Analyze the following ${language} code and provide detailed feedback.

CODE:
\`\`\`${language}
${code}
\`\`\`

Please analyze this code for:
1. **Bugs**: Any potential bugs or errors
2. **Performance Issues**: Performance optimizations that could be made
3. **Security Problems**: Security vulnerabilities or concerns
4. **Best Practices**: Violations of coding best practices
5. **Architecture Suggestions**: Improvements to code structure and design

For EACH issue you find, you MUST provide:
- A clear description of the problem
- **Corrected code example** showing the fix

Format your response as a JSON object with the following structure:
{
  "bugs": [
    {
      "issue": "Description of the bug",
      "fix": "Corrected code example"
    }
  ],
  "performanceIssues": [
    {
      "issue": "Description of performance issue",
      "fix": "Optimized code example"
    }
  ],
  "securityProblems": [
    {
      "issue": "Description of security problem",
      "fix": "Secure code example"
    }
  ],
  "bestPractices": [
    {
      "issue": "Description of best practice violation",
      "fix": "Improved code example"
    }
  ],
  "architectureSuggestions": [
    {
      "issue": "Description of architecture suggestion",
      "fix": "Refactored code example"
    }
  ],
  "overallScore": 0-10,
  "summary": "Brief summary of the code quality"
}

If a category has no issues, return an empty array [].
Respond ONLY with the JSON object, no additional text.
`;

  try {
    // Use startChat for better compatibility
    const chatSession = geminiModel.startChat({
      history: [],
    });
    
    const result = await chatSession.sendMessage(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Invalid response format from AI');
  } catch (error) {
    console.error('Error analyzing code:', error);
    throw error;
  }
}
