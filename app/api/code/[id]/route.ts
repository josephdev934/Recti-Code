import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { CodeSubmission } from '@/models/CodeSubmission';
import { ApiResponse, CodeSubmission as CodeSubmissionType } from '@/types';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const { id } = await params;
        const submission = await CodeSubmission.findById(id);

        if (!submission) {
            return NextResponse.json<ApiResponse<null>>({
                success: false,
                error: 'Submission not found'
            }, { status: 404 });
        }

        return NextResponse.json<ApiResponse<CodeSubmissionType>>({
            success: true,
            data: submission
        });

    } catch (error) {
        console.error('Error fetching submission:', error);
        return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: 'Failed to fetch submission'
        }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const { id } = await params;
        await CodeSubmission.findByIdAndDelete(id);

        return NextResponse.json<ApiResponse<null>>({
            success: true,
            message: 'Submission deleted'
        });

    } catch (error) {
        console.error('Error deleting submission:', error);
        return NextResponse.json<ApiResponse<null>>({
            success: false,
            error: 'Failed to delete submission'
        }, { status: 500 });
    }
}
