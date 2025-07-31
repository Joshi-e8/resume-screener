/**
 * Authentication Hook
 * Combines NextAuth session management with custom social auth service
 */

import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { socialAuthService } from "@/lib/services/socialAuthService";
import { showToast } from "@/utils/toast";

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  accessToken?: string;
  role?: string;
}

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is authenticated via NextAuth or custom auth
  const isAuthenticated = useCallback(() => {
    return status === "authenticated" || socialAuthService.isAuthenticated();
  }, [status]);

  // Get current user data
  const user: User | null = useCallback(() => {
    if (session?.user) {
      return {
        id: session.user.id || "",
        email: session.user.email || "",
        name: session.user.name || "",
        image: session.user.image || undefined,
        accessToken: session.user.accessToken,
        role: session.user.role,
      };
    }

    // Fallback to custom auth service
    const authData = socialAuthService.getStoredAuthData();
    if (authData) {
      return {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.full_name,
        accessToken: authData.token,
      };
    }

    return null;
  }, [session]);

  // Sign out function
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      // Sign out from NextAuth
      if (session) {
        await nextAuthSignOut({ redirect: false });
      }

      // Clear custom auth data
      socialAuthService.clearAuthData();

      showToast.success("Successfully signed out");
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
      showToast.error("Error signing out");
    } finally {
      setIsLoading(false);
    }
  }, [session, router]);

  // Redirect to dashboard if authenticated
  const redirectIfAuthenticated = useCallback(() => {
    if (isAuthenticated() && status !== "loading") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, status, router]);

  // Redirect to login if not authenticated
  const redirectIfNotAuthenticated = useCallback(() => {
    if (!isAuthenticated() && status !== "loading") {
      router.push("/");
    }
  }, [isAuthenticated, status, router]);

  // Get authorization headers for API requests
  const getAuthHeaders = useCallback(() => {
    if (session?.user?.accessToken) {
      return {
        Authorization: `Bearer ${session.user.accessToken}`,
      };
    }

    return socialAuthService.getAuthHeader();
  }, [session]);

  return {
    user: user(),
    isAuthenticated: isAuthenticated(),
    isLoading: status === "loading" || isLoading,
    signOut,
    redirectIfAuthenticated,
    redirectIfNotAuthenticated,
    getAuthHeaders,
  };
}