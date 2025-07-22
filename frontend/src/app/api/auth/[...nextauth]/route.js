import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Call your backend login API
          const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
            email: credentials.email,
            password: credentials.password,
          });

          if (response.data && response.data.result === "success") {
            const user = response.data.record;
            return {
              id: user.id,
              email: user.email,
              name: user.name || user.first_name + " " + user.last_name,
              accessToken: user.access_token,
              refreshToken: user.refresh_token,
              user_type: user.user_type || "admin",
            };
          }
          return null;
        } catch (error) {
          console.error("Authentication error:", error.response?.data || error.message);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Persist the OAuth access_token to the token right after signin
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.user_type = user.user_type;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.user.accessToken = token.accessToken;
      session.user.refreshToken = token.refreshToken;
      session.user.user_type = token.user_type;
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
