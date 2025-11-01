import { connectToDatabase } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/password";
import { User, type UserRole } from "@/models/user";
import type { NextAuthOptions, Session, User as NextAuthUser } from "next-auth";
import { getServerSession } from "next-auth/next";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(128, { message: "Password is too long" }),
});

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET as string,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          throw new Error(parsed.error.issues[0]?.message ?? "Invalid credentials");
        }

        const { email, password } = parsed.data;

        const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        if (
          ADMIN_EMAIL &&
          ADMIN_PASSWORD &&
          email.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
          password === ADMIN_PASSWORD
        ) {
          await connectToDatabase();
          const adminEmail = ADMIN_EMAIL.toLowerCase();
          const desiredHash = await hashPassword(ADMIN_PASSWORD);
          const existingAdmin = await User.findOne({ email: adminEmail });

          if (!existingAdmin) {
            const createdAdmin = await User.create({
              name: "Admin",
              email: adminEmail,
              passwordHash: desiredHash,
              role: "hr",
              passkeyVerified: true,
            });

            return {
              id: createdAdmin._id.toString(),
              name: createdAdmin.name,
              email: createdAdmin.email,
              role: createdAdmin.role,
            };
          }

          existingAdmin.role = "hr";
          existingAdmin.passkeyVerified = true;
          existingAdmin.passwordHash = desiredHash;
          await existingAdmin.save();

          return {
            id: existingAdmin._id.toString(),
            name: existingAdmin.name,
            email: existingAdmin.email,
            role: existingAdmin.role,
          };
        }

        await connectToDatabase();

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        if (user.role === "employee") {
          if (!user.emailVerified) {
            throw new Error("Please verify your email before logging in");
          }
          if (!user.passkeyVerified) {
            throw new Error("Please complete passkey verification before logging in");
          }
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const { id, role } = user as NextAuthUser & {
          id?: string;
          role?: UserRole;
        };

        if (id) {
          (token as JWT).id = id;
        }

        if (role) {
          (token as JWT).role = role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const tokenId = (token as JWT).id;
        const tokenRole = (token as JWT).role;

        session.user.id = typeof tokenId === "string" ? tokenId : "";
        session.user.role = (typeof tokenRole === "string" ? (tokenRole as UserRole) : undefined) ?? "employee";
      }

      return session;
    },
  },
};

export function getServerAuthSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}
