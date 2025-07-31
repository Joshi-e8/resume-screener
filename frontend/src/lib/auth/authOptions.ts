// src/lib/auth/authOptions.ts
import type { User } from "next-auth";
import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not defined");
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

// Extended User interface for internal use
interface ExtendedUser extends User {
  accessToken: string;
  refreshToken: string;
  user_type?: string;
  role?: string;
}

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        enteredOtp: { label: "OTP", type: "text" },
        otpUrl: { label: "OTP URL", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials) return null;

          const { email, password, enteredOtp, otpUrl } = credentials as {
            email?: string;
            password?: string;
            enteredOtp?: string;
            otpUrl?: string;
          };

          // OTP flow
          if (enteredOtp && otpUrl) {
            const url = decodeURIComponent(otpUrl);
            console.debug("authorize: sending OTP verification request", {
              url,
              enteredOtp: "REDACTED",
            });
            const otpResponse = await axios.post(decodeURIComponent(url), {
              otp: enteredOtp,
            });
            if (otpResponse.data.result === "success") {
              const { user, access_token } = otpResponse.data.record;
              console.debug("authorize: OTP login success", {
                userId: user.id,
              });
              return {
                id: user.id,
                email: user.email,
                name: user.full_name,
                accessToken: access_token,
                refreshToken: "",
                user_type: user.is_superuser ? "superuser" : "user",
                role: user.is_superuser ? "superuser" : "user",
              };
            }
            return null;
          }

          // Email/password flow
          if (email && password) {
            console.debug("authorize: sending login request", {
              email: "REDACTED",
            });
            const loginResponse = await axios.post(
              `${API_BASE_URL}/auth/login/`,
              {
                email,
                password,
              }
            );

            if (loginResponse.data.result === "success") {
              const { user, access_token } = loginResponse.data.record;
              console.debug("authorize: login success", { userId: user.id });
              return {
                id: user.id,
                email: user.email,
                name: user.full_name,
                accessToken: access_token,
                refreshToken: "",
                user_type: user.is_superuser ? "superuser" : "user",
                role: user.is_superuser ? "superuser" : "user",
              };
            }
            return null;
          }

          return null;
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error(
              "NextAuth authorize error:",
              error.response?.data || error.message
            );
          } else {
            console.error("NextAuth authorize error:", error);
          }
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          google_id: parseInt(profile.sub),
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        } as User; // Removed authorization_code here as it’s not needed in profile
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        const u = user as ExtendedUser;
        token.sub = u.id;
        token.accessToken = u.accessToken;
        token.refreshToken = u.refreshToken;
        token.role = u.role;
        token.user_type = u.user_type;
      }
      // For Google OAuth, handle the backend integration
      if (account && account.provider === "google") {
        token.google_id = account.providerAccountId;
        token.authorization_code = account.access_token || account.id_token;
        console.debug("JWT callback: Google sign-in account", token, user, account);
        try {
          // Make the backend API call here instead of in the LoginForm component
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/social-login/google/`,
            {
              // authorization_code:
              //   account.access_token || account.id_token || "",
              email: token.email || "",
              google_id: account.providerAccountId,
              name: token.name || "",
              image: token.picture || "",
              token: account.access_token || account.id_token,
            }
          );


          console.debug("JWT callback: Google sign-in backend response", response);

          if (response.status === 200) {
            // Update token with backend response data
            token.accessToken = response.data.access_token;
            token.refreshToken = response.data.refresh_token;
            token.expires = response.data.expires_in;
            token.id = response.data.uid;
            token.role = response.data.role;
            token.profile_pic = response.data.profile_pic;
          }
        } catch (error) {
          console.error("Error calling backend for Google sign-in:", error);
          // Don't throw here, we still want the auth flow to complete
          // but without the backend token
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.sub ?? "",
          accessToken: token.accessToken as string | undefined,
          refreshToken: token.refreshToken as string | undefined,
          role: token.role as string | undefined,
        };
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export const { auth, signIn, signOut, handlers } = NextAuth(authOptions);
