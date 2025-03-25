import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      phone: string;
      isVerified: boolean;
    }
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    phone: string;
    isVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string | null;
    name?: string | null;
    phone: string;
    isVerified: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'WhatsApp',
      credentials: {
        phone: { label: 'Phone', type: 'tel' },
        otp: { label: 'OTP', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          return null;
        }

        try {
          // Find and verify OTP
          const verification = await prisma.oTPVerification.findFirst({
            where: {
              phone: credentials.phone,
              otp: credentials.otp,
              verified: false,
              expiresAt: {
                gt: new Date()
              }
            }
          });

          if (!verification) {
            return null;
          }

          // Mark OTP as verified
          await prisma.oTPVerification.update({
            where: { id: verification.id },
            data: { verified: true }
          });

          // Get or create user
          let user = await prisma.user.findUnique({
            where: { phone: credentials.phone }
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                phone: credentials.phone,
                isVerified: true
              }
            });
          } else {
            await prisma.user.update({
              where: { id: user.id },
              data: { isVerified: true }
            });
          }

          return {
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        return {
          ...token,
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified
        };
      }
      return token;
    },
    session: async ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          phone: token.phone,
          name: token.name,
          email: token.email,
          isVerified: token.isVerified
        }
      };
    }
  },
  pages: {
    signIn: '/auth',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}