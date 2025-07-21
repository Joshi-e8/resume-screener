import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DashboardStats {
  totalResumes: number;
  activeJobs: number;
  totalMatches: number;
  pendingReviews: number;
}

interface ActivityItem {
  id: number;
  type: 'resume_uploaded' | 'match_found' | 'job_created' | 'review_completed';
  message: string;
  timestamp: Date;
}

interface DashboardState {
  stats: DashboardStats;
  recentActivity: ActivityItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: {
    totalResumes: 0,
    activeJobs: 0,
    totalMatches: 0,
    pendingReviews: 0,
  },
  recentActivity: [],
  isLoading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setStats: (state, action: PayloadAction<DashboardStats>) => {
      state.stats = action.payload;
    },
    setRecentActivity: (state, action: PayloadAction<ActivityItem[]>) => {
      state.recentActivity = action.payload;
    },
    addActivity: (state, action: PayloadAction<ActivityItem>) => {
      state.recentActivity.unshift(action.payload);
      // Keep only the latest 10 activities
      if (state.recentActivity.length > 10) {
        state.recentActivity = state.recentActivity.slice(0, 10);
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setStats,
  setRecentActivity,
  addActivity,
  setError,
  clearError,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
