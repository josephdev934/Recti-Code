import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { CodeSubmission } from '@/models/CodeSubmission';
import { getOptionalUser } from '@/middleware/withAuth';
import { ApiResponse, CodeSubmission as CodeSubmissionType } from '@/types';

const unauthorized = () =>
    NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Unauthorized: Please sign in'
    }, { status: 401 });

// A submission that doesn't exist and one that belongs to someone else look the same to the caller
const notFound = () =>
    NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Submission not found'
    }, { status: 404 });

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user } = getOptionalUser(request);
        if (!user) return unauthorized();

        await dbConnect();

        const { id } = await params;
        const submission = await CodeSubmission.findOne({ _id: id, userId: user.userId });

        if (!submission) return notFound();

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
        const { user } = getOptionalUser(request);
        if (!user) return unauthorized();

        await dbConnect();

        const { id } = await params;
        const deleted = await CodeSubmission.findOneAndDelete({ _id: id, userId: user.userId });

        if (!deleted) return notFound();

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
