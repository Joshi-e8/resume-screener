import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import dashboardReducer from './slices/dashboardSlice';
import authStepReducer from './slices/authSlice';
import resumeUploadReducer from './slices/resumeUploadSlice';

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    authStep: authStepReducer,
    resumeUpload: resumeUploadReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        ignoredPaths: ['dashboard.recentActivity', 'resumeUpload.selectedFiles', 'resumeUpload.zipContents'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
