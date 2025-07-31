const CONSTANTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: "auth/login/",
    REGISTER: "auth/register/",
    LOGOUT: "auth/logout/",
    REFRESH: "auth/refresh/",
    FORGOT_PASSWORD: "auth/forgot-password/",
    RESET_PASSWORD: "auth/reset-password/",
    VERIFY_EMAIL: "auth/verify-email/",
    ME: "auth/me/",
    PROFILE: "auth/profile/",
    CHANGE_PASSWORD: "auth/change-password/",
  },

  // Resume management endpoints
  RESUMES: {
    UPLOAD: {
      SINGLE: "resumes/upload/",
      MULTIPLE: "resumes/upload/multiple/",
      ZIP: "resumes/upload/zip/",
    },
    LISTING: "resumes/",
    DETAIL: (id) => `resumes/${id}/`,
    BY_JOB: (jobId) => `resumes/job/${jobId}/`,
    DELETE: (id) => `resumes/${id}/`,
    STATUS: (id) => `resumes/${id}/status/`,
    SCREEN: (jobId) => `resumes/screen/${jobId}/`,
    SCREENING_RESULTS: (jobId) => `resumes/screening-results/${jobId}/`,
    DOWNLOAD: (id) => `resumes/${id}/download/`,
    BULK_DELETE: "resumes/bulk-delete/",
  },

  // Job management endpoints
  JOBS: {
    LISTING: "jobs/",
    DETAIL: (id) => `jobs/${id}/`,
    CREATE: "jobs/",
    UPDATE: (id) => `jobs/${id}/`,
    DELETE: (id) => `jobs/${id}/`,
    STATUS: (id) => `jobs/${id}/status/`,
    STATISTICS: (id) => `jobs/${id}/statistics/`,
    IMPORT: "jobs/import/",
    PAGINATED: "jobs/paginated/",
    SEARCH: "jobs/search/",
    EXTERNAL: {
      LINKEDIN: "jobs/external/linkedin/",
      INDEED: "jobs/external/indeed/",
      GLASSDOOR: "jobs/external/glassdoor/",
    },
  },

  // Analytics endpoints
  ANALYTICS: {
    DASHBOARD: "analytics/dashboard/",
    SCREENING: "analytics/screening/",
    JOBS: "analytics/jobs/",
    JOB_DETAIL: (id) => `analytics/jobs/${id}/`,
    UPLOADS: "analytics/uploads/",
    ACCURACY: "analytics/accuracy/",
    USERS: "analytics/users/",
    SYSTEM: "analytics/system/",
    EXPORT: "analytics/export/",
    REALTIME: "analytics/realtime/",
    CUSTOM_REPORT: "analytics/custom-report/",
  },

  // LinkedIn integration endpoints
  LINKEDIN: {
    CONNECT: "linkedin/connect/",
    CALLBACK: "linkedin/callback/",
    PROFILE: "linkedin/profile/",
    JOBS: "linkedin/jobs/",
    IMPORT_JOB: "linkedin/import-job/",
    DISCONNECT: "linkedin/disconnect/",
  },

  // File management endpoints
  FILES: {
    UPLOAD: "files/upload/",
    DELETE: (id) => `files/${id}/`,
    DOWNLOAD: (id) => `files/${id}/download/`,
  },

  // Admin endpoints
  ADMIN: {
    USERS: "admin/users/",
    USER_DETAIL: (id) => `admin/users/${id}/`,
    SYSTEM_SETTINGS: "admin/settings/",
    LOGS: "admin/logs/",
    BACKUP: "admin/backup/",
  },
};

export default CONSTANTS;
