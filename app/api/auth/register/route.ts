import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword, generateToken } from '@/lib/auth';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    // Validate input (strings only, to block NoSQL operator injection)
    if (
      !body ||
      typeof body.email !== 'string' ||
      typeof body.password !== 'string' ||
      typeof body.name !== 'string' ||
      !body.email.trim() ||
      !body.password ||
      !body.name.trim()
    ) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    const email = body.email.trim().toLowerCase();
    const password: string = body.password;
    const name = body.name.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // The model's minlength applies to the bcrypt hash, so enforce it on the raw password here
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // bcrypt silently ignores bytes past 72
    if (Buffer.byteLength(password, 'utf8') > 72) {
      return NextResponse.json(
        { success: false, error: 'Password must be at most 72 bytes' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = { email, password: hashedPassword, name, role: 'user' };
    let user;
    try {
      user = await User.create(newUser);
    } catch (error: any) {
      // The users collection has a leftover unique index on "username" from an older version of the
      // app. Our schema has no such field, so every new user after the first collides on null.
      // Drop that one stale index and retry.
      if (error?.code === 11000 && error?.keyPattern?.username) {
        logger.warn('Dropping stale unique index users.username_1');
        await User.collection.dropIndex('username_1');
        user = await User.create(newUser);
      } else {
        throw error;
      }
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    logger.info(`New user registered: ${email}`);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });
  } catch (error: any) {
    // Two simultaneous signups can both pass the findOne check; the unique index catches the second
    if (error?.code === 11000 && error?.keyPattern?.email) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 400 }
      );
    }
    logger.error('Registration error:', error);
    // A duplicate on some other unique index (e.g. a leftover one in the database) is not the user's fault
    if (error?.code === 11000 && process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        {
          success: false,
          error: 'Database has a conflicting unique index',
          detail: error.keyPattern ?? error.message,
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
