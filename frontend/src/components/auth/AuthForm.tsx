"use client";

import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from "lucide-react";
import { showToast } from "@/utils/toast";
import { useForm, Controller } from "react-hook-form";
import useAuthServices from "@/lib/services/authServices";
import { setCookie } from "cookies-next";
import { useDispatch } from "react-redux";
import { setAuthStep } from "@/store/slices/authSlice";

interface AuthFormProps {
  mode: "login" | "signup";
}

interface FormData {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}
export function AuthForm({ mode }: AuthFormProps) {
  const { login } = useAuthServices();
  const {
    handleSubmit,
    control,
    formState: { errors },
    setError,
    getValues,
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation logic for react-hook-form
  const validateEmail = (email: string) => {
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Please enter a valid email address";
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return true;
  };

  const validateConfirmPassword = (
    confirmPassword: string | undefined,
    getValues: () => FormData
  ) => {
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== getValues().password)
      return "Passwords do not match";
    return true;
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      if (mode === "login") {
        const response = await login({
          email: data.email,
          password: data.password,
        });
        if (response.result == "success") {
          setCookie("otpUrl", response.verification_url);
          setCookie("otp", response.otp);
          setCookie("userId", response.userId);
          setCookie("resendOtpUrl", response.resend_otp_url);
          setCookie("expiresIn", response.expires_in);

          dispatch(setAuthStep({ step: 2 })); // Set auth step to OTP verification
          showToast.info("OTP sent to your email. Please verify to continue.");
        } else {
          if (response?.errors) {
            Object.entries(response.errors).forEach(([key, value]) => {
              setError(key as keyof FormData, {
                type: "manual",
                message: value as string,
              });
            });
          }
        }
      } else {
        // Simulate signup API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        showToast.authSuccess("Account created successfully!");
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Authentication error:", error);
      showToast.authError(
        mode === "login"
          ? "Invalid email or password. Please try again."
          : "Failed to create account. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Name Field (Signup only) */}
      {mode === "signup" && (
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-gray-900 mb-2"
          >
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <Controller
              name="name"
              control={control}
              rules={{
                required: mode === "signup" ? "Full name is required" : false,
              }}
              render={({ field }) => (
                <input
                  {...field}
                  id="name"
                  type="text"
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-accent-pink focus:border-transparent outline-none transition-all duration-200 ${
                    errors.name
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 hover:border-gray-400 focus:bg-white"
                  }`}
                  placeholder="Enter your full name"
                />
              )}
            />
            {errors.name && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            )}
          </div>
          {errors.name && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.name.message}
            </p>
          )}
        </div>
      )}

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-gray-900 mb-2"
        >
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <Controller
            name="email"
            control={control}
            rules={{
              required: "Email is required",
              validate: validateEmail,
            }}
            render={({ field }) => (
              <input
                {...field}
                id="email"
                type="email"
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-accent-pink focus:border-transparent outline-none transition-all duration-200 ${
                  errors.email
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 hover:border-gray-400 focus:bg-white"
                }`}
                placeholder="Enter your email address"
              />
            )}
          />
          {errors.email && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>
        {errors.email && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-gray-900 mb-2"
        >
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <Controller
            name="password"
            control={control}
            rules={{
              required: "Password is required",
              validate: validatePassword,
            }}
            render={({ field }) => (
              <input
                {...field}
                id="password"
                type={showPassword ? "text" : "password"}
                className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-accent-pink focus:border-transparent outline-none transition-all duration-200 ${
                  errors.password
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 hover:border-gray-400 focus:bg-white"
                }`}
                placeholder="Enter your password"
              />
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password Field (Signup only) */}
      {mode === "signup" && (
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-semibold text-gray-900 mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <Controller
              name="confirmPassword"
              control={control}
              rules={{
                required:
                  mode === "signup" ? "Please confirm your password" : false,
                validate: (value) => validateConfirmPassword(value, getValues),
              }}
              render={({ field }) => (
                <input
                  {...field}
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-accent-pink focus:border-transparent outline-none transition-all duration-200 ${
                    errors.confirmPassword
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 hover:border-gray-400 focus:bg-white"
                  }`}
                  placeholder="Confirm your password"
                />
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      )}

      {/* Forgot Password Link (Login only) */}
      {mode === "login" && (
        <div className="text-right">
          <button
            type="button"
            className="text-sm text-accent-pink hover:text-accent-pink/80 font-medium"
            onClick={() =>
              showToast.info("Password reset functionality coming soon!")
            }
          >
            Forgot your password?
          </button>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn-primary py-4 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>
              {mode === "login" ? "Signing in..." : "Creating account..."}
            </span>
          </>
        ) : (
          <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
        )}
      </button>
    </form>
  );
}
