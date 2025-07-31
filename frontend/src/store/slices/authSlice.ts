import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthStep {
    step: 1 | 2 | 3; // 1: Login, 2: OTP, 3: Signup
}

const initialState: AuthStep = {
    step: 1
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAuthStep(state, action: PayloadAction<AuthStep>) {
            state.step = action.payload.step;
        }
    }
});

export const { setAuthStep } = authSlice.actions;
export default authSlice.reducer;