import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { CodeSubmission } from '@/models/CodeSubmission';
import { geminiModel } from '@/lib/gemini';

export async function GET() {
  const results: {
    mongodb: { status: string; error: any; details?: string };
    gemini: { status: string; error: any; details?: string };
  } = {
    mongodb: { status: 'testing', error: null },
    gemini: { status: 'testing', error: null }
  };

  // Test MongoDB
  try {
    await dbConnect();
    const count = await CodeSubmission.countDocuments();
    results.mongodb = { 
      status: '✅ Connected', 
      error: null,
      details: `Database has ${count} submissions`
    };
  } catch (error: any) {
    results.mongodb = { 
      status: '❌ Failed', 
      error: error.message 
    };
  }

  // Test Gemini API
  try {
    const chatSession = geminiModel.startChat({ history: [] });
    const result = await chatSession.sendMessage('Say "Hello" if you can read this');
    const response = result.response;
    const text = response.text();
    
    results.gemini = {
      status: '✅ Connected',
      error: null,
      details: `AI Response: "${text}"`
    };
  } catch (error: any) {
    results.gemini = {
      status: '❌ Failed',
      error: error.message
    };
  }

  return NextResponse.json(results);
}
