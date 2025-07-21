export function getAuthSession() {
  // For now, we'll handle auth on the client side
  // This can be expanded when we integrate with the backend
  return null
}

// Client-side auth utilities
export const AUTH_PAGES = {
  SIGNIN: '/auth/signin',
  ERROR: '/auth/error',
  DASHBOARD: '/dashboard',
} as const

// Mock user data for development (since we're not integrating API yet)
export const MOCK_USER_DATA = {
  totalResumes: 24,
  activeJobs: 3,
  totalMatches: 18,
  pendingReviews: 7,
  recentActivity: [
    {
      id: 1,
      type: 'resume_uploaded' as const,
      message: 'New resume uploaded: John Doe - Software Engineer',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: 2,
      type: 'match_found' as const,
      message: 'High match found for Senior Developer position',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: 3,
      type: 'job_created' as const,
      message: 'New job posting created: Frontend Developer',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    },
  ],
}
