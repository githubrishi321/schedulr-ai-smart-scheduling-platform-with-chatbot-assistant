/**
 * @fileoverview NextAuth.js v5 configuration
 * Supports Google OAuth (with Calendar scopes) and Credentials (email + bcrypt)
 */

import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from './supabase';

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },

  providers: [
    /**
     * Google OAuth provider — requests Calendar API access scopes
     * so users can sync Google Calendar after login.
     */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            'openid email profile https://www.googleapis.com/auth/calendar',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),

    /**
     * Credentials provider — validates email + bcrypt password
     * against the Supabase `users` table.
     */
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('authorize called with email:', credentials?.email);
        if (!credentials?.email || !credentials?.password) {
           console.log('Missing credentials');
           return null;
        }

        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', credentials.email.toLowerCase())
          .single();

        if (error) {
           console.error('Supabase fetch error in authorize:', error);
           return null;
        }
        if (!user || !user.password_hash) {
           console.log('User not found or no password hash');
           return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!passwordMatch) {
           console.log('Password mismatch');
           return null;
        }

        console.log('Login successful for user:', user.email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          image: user.avatar_url,
        };
      },
    }),
  ],

  callbacks: {
    /**
     * jwt callback — stores user id, username, and Google tokens in the JWT.
     * Called whenever a JWT is created or updated.
     */
    async jwt({ token, user, account }) {
      // On initial sign-in, `user` and `account` are available
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }

      if (account?.provider === 'google') {
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;

        // Upsert user into Supabase on Google sign-in
        try {
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id, username')
            .eq('email', token.email)
            .single();

          if (existingUser) {
            // Update tokens for existing user
            await supabaseAdmin
              .from('users')
              .update({
                google_access_token: account.access_token,
                google_refresh_token: account.refresh_token,
                name: token.name,
                avatar_url: token.picture,
              })
              .eq('id', existingUser.id);

            token.id = existingUser.id;
            token.username = existingUser.username;
          } else {
            // Create new user for first-time Google login
            const username = token.email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
            const { data: newUser } = await supabaseAdmin
              .from('users')
              .insert({
                name: token.name,
                email: token.email,
                avatar_url: token.picture,
                username,
                google_access_token: account.access_token,
                google_refresh_token: account.refresh_token,
              })
              .select()
              .single();

            if (newUser) {
              token.id = newUser.id;
              token.username = newUser.username;
            }
          }
        } catch (err) {
          console.error('Error upserting Google user:', err);
        }
      }

      return token;
    },

    /**
     * session callback — exposes key fields from JWT to the client session object.
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.googleAccessToken = token.googleAccessToken;
        session.user.googleRefreshToken = token.googleRefreshToken;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
});
