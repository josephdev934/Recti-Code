import { NextResponse } from 'next/server';
import { GEMINI_API_KEY } from '@/config';

// Lists the Gemini models available to the configured API key
export async function GET() {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Please define the GEMINI_API_KEY environment variable'
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );

    const data = await response.json();

    return NextResponse.json({
      success: true,
      models: data.models?.map((m: any) => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        inputTokenLimit: m.inputTokenLimit,
        outputTokenLimit: m.outputTokenLimit,
        supportedGenerationMethods: m.supportedGenerationMethods
      })) || []
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}
