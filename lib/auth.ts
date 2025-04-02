import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phone?: string;
      name?: string;
      email?: string;
      isVerified: boolean;
    }
  }

  interface User {
    id: string;
    phone?: string;
    name?: string;
    email?: string;
    isVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    phone?: string;
    name?: string;
    email?: string;
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
        otp: { label: 'OTP', type: 'text' },
        name: { label: 'Name', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          return null;
        }

        try {
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

          await prisma.oTPVerification.update({
            where: { id: verification.id },
            data: { verified: true }
          });

          let user = await prisma.user.findUnique({
            where: { phone: credentials.phone }
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                phone: credentials.phone,
                name: credentials.name || undefined,
                isVerified: true
              }
            });
          } else if (credentials.name && !user.name) {
            // Update user's name if provided and not set
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                name: credentials.name,
                isVerified: true
              }
            });
          }

          return {
            id: user.id,
            phone: user.phone,
            name: user.name || undefined,
            email: user.email || undefined,
            isVerified: user.isVerified
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    }),
    CredentialsProvider({
      id: 'development',
      name: 'Development Login',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!process.env.DEV_USERNAME || !process.env.DEV_PASSWORD) {
          return null;
        }

        if (
          credentials?.username === process.env.DEV_USERNAME &&
          credentials?.password === process.env.DEV_PASSWORD
        ) {
          let user = await prisma.user.findFirst({
            where: { email: 'dev@example.com' }
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: 'dev@example.com',
                name: 'Development User',
                phone: '0000000000',
                isVerified: true
              }
            });
          }

          return {
            id: user.id,
            phone: user.phone || undefined,
            name: user.name || undefined,
            email: user.email || undefined,
            isVerified: user.isVerified
          };
        }

        return null;
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
    },
  },
  pages: {
    signIn: '/auth',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false
}