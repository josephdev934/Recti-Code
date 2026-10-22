import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { CodeSubmission } from '@/models/CodeSubmission';
import { pingGemini } from '@/lib/gemini';

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
    const text = await pingGemini();

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
