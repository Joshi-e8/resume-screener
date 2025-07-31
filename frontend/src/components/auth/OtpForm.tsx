"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { showToast } from "@/utils/toast";
import axios from "axios";
import { getCookies } from "cookies-next/client";
import { signIn } from "next-auth/react";

interface OtpFormData {
  otp: string[];
}

const RESEND_DELAY = 60; // seconds

const OtpForm = () => {
  const {
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<OtpFormData>({
    defaultValues: {
      otp: ["", "", "", "", "", ""],
    },
  });

  const cookies = getCookies() as Record<string, string>;
  const { otpUrl, expiresIn, resendOtpUrl } = cookies;
  const [isLoading, setIsLoading] = useState(false);
  const initialTimer = parseInt(expiresIn ?? `${RESEND_DELAY}`, 10);
  const [resendTimer, setResendTimer] = useState(initialTimer);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const onSubmit = async (data: OtpFormData) => {
    const enteredOtp = data.otp.join("");
    if (enteredOtp.length < 6) {
      setError("otp", { message: "Please enter all 6 digits" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await signIn("credentials", {
        redirect: false,
        // email: "",
        // password: "",
        enteredOtp,
        otpUrl,
      });

      if (response?.ok) {
        showToast.success("OTP verified successfully!");
        console.log(response, "response");
        // window.location.href = "/dashboard"; // or any other post-login route
      } else {
        setError("otp", {
          message: "Invalid OTP. Please try again.",
        });
      }
    } catch {
      setError("otp", { message: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      const response = await axios.post(
        resendOtpUrl || "/api/v1/auth/resend-otp"
      );
      if (response.data.result === "success") {
        showToast.success("OTP resent successfully!");

        const newExpire = response.data.expires_in ?? RESEND_DELAY;
        setResendTimer(newExpire);

        // Optionally update cookie
        document.cookie = `expiresIn=${newExpire}; path=/; max-age=${newExpire}`;
      } else {
        showToast.error(response.data.message || "Failed to resend OTP");
      }
    } catch {
      showToast.error("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleChange = (
    index: number,
    value: string,
    onChange: (val: string[]) => void,
    otp: string[]
  ) => {
    if (!/^\d?$/.test(value)) return;
    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    onChange(updatedOtp);

    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    otp: string[],
    onChange: (val: string[]) => void
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const updatedOtp = [...otp];
      updatedOtp[index - 1] = "";
      onChange(updatedOtp);
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 min-h-[300px] flex flex-col items-center justify-evenly"
    >
      <Controller
        name="otp"
        control={control}
        rules={{
          validate: (otp) => otp.every((d) => d) || "Please enter all 6 digits",
        }}
        render={({ field: { value, onChange } }) => (
          <div className="flex gap-2 justify-center">
            {value.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) =>
                  handleChange(index, e.target.value, onChange, value)
                }
                onKeyDown={(e) => handleKeyDown(index, e, value, onChange)}
                autoFocus={index === 0}
                className={`w-12 h-12 text-center text-xl border rounded-md ${
                  errors.otp ? "border-red-500 bg-red-50" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-dark-500 focus:border-transparent`}
              />
            ))}
          </div>
        )}
      />
      {errors.otp && (
        <p className="text-sm text-red-600 mt-2 text-center">
          {errors.otp.message}
        </p>
      )}

      <div className="text-sm text-gray-500 text-center">
        {resendTimer > 0 ? (
          <>
            Resend OTP in{" "}
            <span className="font-semibold">
              {Math.floor(resendTimer / 60)
                .toString()
                .padStart(2, "0")}
              :{(resendTimer % 60).toString().padStart(2, "0")}
            </span>
          </>
        ) : (
          <button
            type="button"
            disabled={resending}
            onClick={handleResendOtp}
            className="text-accent-pink font-semibold hover:underline disabled:opacity-50"
          >
            {resending ? "Resending..." : "Resend OTP"}
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn-primary mt-5 py-4 text-base font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Verifying...</span>
          </>
        ) : (
          <span>Verify OTP</span>
        )}
      </button>
    </form>
  );
};

export default OtpForm;
