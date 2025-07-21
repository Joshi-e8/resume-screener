"use client";

import { Provider } from "react-redux";
import { store } from "@/store/store";
import { ToastContainer } from "react-toastify";
import { LightModeEnforcer } from "@/components/LightModeEnforcer";
// import { ThemeProvider } from "@/contexts/ThemeContext"; // Commented out for light mode only
import "react-toastify/dist/ReactToastify.css";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <LightModeEnforcer />
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          background: "#ffffff",
          color: "#1a1a1a",
          borderRadius: "0.75rem",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        }}
      />
    </Provider>
  );
}
