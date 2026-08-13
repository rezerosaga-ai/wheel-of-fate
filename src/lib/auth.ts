import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return false;
      if (!user.email) return false;

      // Upsert user in DB
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(users).values({
          email:     user.email,
          name:      user.name ?? user.email.split('@')[0],
          googleId:  account.providerAccountId,
          avatarUrl: user.image ?? null,
        });
      } else {
        await db
          .update(users)
          .set({
            name: user.name ?? existing[0].name,
            avatarUrl: user.image ?? existing[0].avatarUrl,
          })
          .where(eq(users.email, user.email));
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);
        if (dbUser) {
          token['dbUserId'] = String(dbUser.id);
          token['wofPlayerId'] = dbUser.wofPlayerId ?? '';
        }
      }
      return token;
    },

    async session({ session, token }) {
      // Pass custom token fields to session user object
      if (token['dbUserId']) {
        (session.user as typeof session.user & { dbUserId?: string; wofPlayerId?: string }).dbUserId = token['dbUserId'] as string;
        (session.user as typeof session.user & { dbUserId?: string; wofPlayerId?: string }).wofPlayerId = token['wofPlayerId'] as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
});
