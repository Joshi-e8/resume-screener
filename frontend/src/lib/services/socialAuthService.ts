/**
 * Social Authentication Service
 * Handles Google and LinkedIn OAuth flows
 */

export interface SocialLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    full_name: string;
    company_name?: string;
    is_active: boolean;
    is_superuser: boolean;
  };
}

export interface SocialLoginRequest {
  token: string;
  email: string;
  google_id?: string;
  name?: string;
  image?: string;
}

class SocialAuthService {
  private readonly apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
  }

  /**
   * Authenticate user with Google OAuth token
   */
  async authenticateWithGoogle(googleToken: string, userInfo: any): Promise<SocialLoginResponse> {
    const payload: SocialLoginRequest = {
      token: googleToken,
      email: userInfo.email,
      google_id: userInfo.sub,
      name: userInfo.name,
      image: userInfo.picture,
    };

    const response = await fetch(`${this.apiBaseUrl}/auth/social-login/google/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Google authentication failed");
    }

    return response.json();
  }

  /**
   * Authenticate user with LinkedIn authorization code
   */
  async authenticateWithLinkedIn(authCode: string): Promise<SocialLoginResponse> {
    const payload: SocialLoginRequest = {
      token: authCode,
      email: "", // Will be populated by backend after token exchange
      name: "", // Will be populated by backend after token exchange
    };

    const response = await fetch(`${this.apiBaseUrl}/auth/social-login/linkedin/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "LinkedIn authentication failed");
    }

    return response.json();
  }

  /**
   * Check if we're in a browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  /**
   * Store authentication data in local storage
   */
  storeAuthData(authData: SocialLoginResponse): void {
    if (!this.isBrowser()) return;
    
    localStorage.setItem("access_token", authData.access_token);
    localStorage.setItem("token_type", authData.token_type);
    localStorage.setItem("expires_in", authData.expires_in.toString());
    localStorage.setItem("user", JSON.stringify(authData.user));
  }

  /**
   * Get stored authentication data
   */
  getStoredAuthData(): { token: string; user: any } | null {
    if (!this.isBrowser()) return null;
    
    const token = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      return null;
    }

    try {
      const user = JSON.parse(userStr);
      return { token, user };
    } catch {
      return null;
    }
  }

  /**
   * Clear stored authentication data
   */
  clearAuthData(): void {
    if (!this.isBrowser()) return;
    
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("expires_in");
    localStorage.removeItem("user");
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.isBrowser()) return false;
    
    const authData = this.getStoredAuthData();
    return authData !== null;
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader(): { Authorization: string } | {} {
    const authData = this.getStoredAuthData();
    if (!authData) {
      return {};
    }

    return {
      Authorization: `Bearer ${authData.token}`,
    };
  }
}

export const socialAuthService = new SocialAuthService();