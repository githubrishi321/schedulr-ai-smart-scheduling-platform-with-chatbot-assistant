import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { name, username, email, password } = await request.json();

    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists (by email or username)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email, username')
      .or(`email.eq.${email},username.eq.${username}`);

    if (existingUser && existingUser.length > 0) {
      const isEmailTaken = existingUser.some((u) => u.email === email);
      return NextResponse.json(
        { error: isEmailTaken ? 'Email is already registered' : 'Username is already taken' },
        { status: 409 }
      );
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert new user
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password_hash,
      })
      .select('id, email, username')
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'User registered successfully', user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration' },
      { status: 500 }
    );
  }
}
