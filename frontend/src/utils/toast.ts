import { toast, ToastOptions } from 'react-toastify';

const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, { ...defaultOptions, ...options });
  },
  
  error: (message: string, options?: ToastOptions) => {
    toast.error(message, { ...defaultOptions, ...options });
  },
  
  info: (message: string, options?: ToastOptions) => {
    toast.info(message, { ...defaultOptions, ...options });
  },
  
  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, { ...defaultOptions, ...options });
  },
  
  // Custom themed toasts
  authSuccess: (message: string = "Successfully signed in!") => {
    toast.success(message, {
      ...defaultOptions,
      style: {
        background: "linear-gradient(56.9deg, #ffc700 -12.68%, #ffd700 101.47%)",
        color: "white",
      },
    });
  },
  
  authError: (message: string = "Authentication failed. Please try again.") => {
    toast.error(message, {
      ...defaultOptions,
      style: {
        background: "#f9637d",
        color: "white",
      },
    });
  },
  
  uploadSuccess: (fileName: string) => {
    toast.success(`Successfully uploaded: ${fileName}`, {
      ...defaultOptions,
      autoClose: 4000,
    });
  },
  
  uploadError: (fileName: string) => {
    toast.error(`Failed to upload: ${fileName}`, {
      ...defaultOptions,
      autoClose: 5000,
    });
  },
};

// Toast promise helper for async operations
export const toastPromise = <T>(
  promise: Promise<T>,
  messages: {
    pending: string;
    success: string;
    error: string;
  },
  options?: ToastOptions
) => {
  return toast.promise(
    promise,
    messages,
    { ...defaultOptions, ...options }
  );
};
