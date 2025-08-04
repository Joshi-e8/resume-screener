"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, Check, Eye, EyeOff } from "lucide-react";

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ValidatedInputProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  value: string;
  onChange: (value: string) => void;
  rules?: ValidationRule;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showValidation?: boolean;
  autoComplete?: string;
}

export function ValidatedInput({
  label,
  type = 'text',
  value,
  onChange,
  rules = {},
  placeholder,
  disabled = false,
  className = "",
  showValidation = true,
  autoComplete
}: ValidatedInputProps) {
  const [isTouched, setIsTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [] });

  const validateValue = useCallback((val: string): ValidationResult => {
    const errors: string[] = [];

    // Required validation
    if (rules.required && !val.trim()) {
      errors.push(`${label} is required`);
    }

    // Only validate other rules if value exists
    if (val.trim()) {
      // Min length validation
      if (rules.minLength && val.length < rules.minLength) {
        errors.push(`${label} must be at least ${rules.minLength} characters`);
      }

      // Max length validation
      if (rules.maxLength && val.length > rules.maxLength) {
        errors.push(`${label} must be no more than ${rules.maxLength} characters`);
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(val)) {
        switch (type) {
          case 'email':
            errors.push('Please enter a valid email address');
            break;
          case 'tel':
            errors.push('Please enter a valid phone number');
            break;
          case 'url':
            errors.push('Please enter a valid URL');
            break;
          default:
            errors.push(`${label} format is invalid`);
        }
      }

      // Custom validation
      if (rules.custom) {
        const customError = rules.custom(val);
        if (customError) {
          errors.push(customError);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [rules, label, type]);

  useEffect(() => {
    if (isTouched || value) {
      setValidation(validateValue(value));
    }
  }, [value, isTouched, validateValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setIsTouched(true);
  };

  const getInputType = () => {
    if (type === 'password') {
      return showPassword ? 'text' : 'password';
    }
    return type;
  };

  const getBorderColor = () => {
    if (!showValidation || !isTouched) return 'border-gray-300';
    return validation.isValid 
      ? 'border-green-300' 
      : 'border-red-300';
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {rules.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          type={getInputType()}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`
            w-full px-3 py-2 border rounded-lg transition-colors duration-200
            ${getBorderColor()}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${type === 'password' ? 'pr-10' : ''}
          `}
        />
        
        {/* Password toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        
        {/* Validation icon */}
        {showValidation && isTouched && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {validation.isValid ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      
      {/* Validation messages */}
      {showValidation && isTouched && validation.errors.length > 0 && (
        <div className="mt-2 space-y-1">
          {validation.errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {error}
            </p>
          ))}
        </div>
      )}
      
      {/* Success message */}
      {showValidation && isTouched && validation.isValid && value && (
        <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Looks good!
        </p>
      )}
    </div>
  );
}

// Password strength indicator
interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className = "" }: PasswordStrengthProps) {
  const getStrength = (pwd: string) => {
    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      lowercase: /[a-z]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
      numbers: /\d/.test(pwd),
      symbols: /[^A-Za-z0-9]/.test(pwd)
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    if (score < 2) return { level: 'weak', color: 'red', percentage: 20 };
    if (score < 4) return { level: 'fair', color: 'yellow', percentage: 50 };
    if (score < 5) return { level: 'good', color: 'blue', percentage: 75 };
    return { level: 'strong', color: 'green', percentage: 100 };
  };

  const strength = getStrength(password);

  if (!password) return null;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">Password strength</span>
        <span className={`text-sm font-medium capitalize text-${strength.color}-600`}>
          {strength.level}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 bg-${strength.color}-500`}
          style={{ width: `${strength.percentage}%` }}
        />
      </div>
      
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
          8+ characters
        </div>
        <div className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
          Uppercase
        </div>
        <div className={`flex items-center gap-1 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
          Lowercase
        </div>
        <div className={`flex items-center gap-1 ${/\d/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${/\d/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
          Numbers
        </div>
      </div>
    </div>
  );
}

// Form validation hook
export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  validationRules: Record<keyof T, ValidationRule>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string[]>>({} as Record<keyof T, string[]>);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

  const validateField = useCallback((field: keyof T, value: string): string[] => {
    const rules = validationRules[field];
    if (!rules) return [];

    const fieldErrors: string[] = [];

    if (rules.required && !value.trim()) {
      fieldErrors.push(`${String(field)} is required`);
    }

    if (value.trim()) {
      if (rules.minLength && value.length < rules.minLength) {
        fieldErrors.push(`${String(field)} must be at least ${rules.minLength} characters`);
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        fieldErrors.push(`${String(field)} must be no more than ${rules.maxLength} characters`);
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        fieldErrors.push(`${String(field)} format is invalid`);
      }

      if (rules.custom) {
        const customError = rules.custom(value);
        if (customError) {
          fieldErrors.push(customError);
        }
      }
    }

    return fieldErrors;
  }, [validationRules]);

  const setValue = useCallback((field: keyof T, value: unknown) => {
    setValues(prev => ({ ...prev, [field]: value }));

    setTouched(prev => {
      if (prev[field]) {
        const fieldErrors = validateField(field, String(value || ''));
        setErrors(prevErrors => ({ ...prevErrors, [field]: fieldErrors }));
      }
      return prev;
    });
  }, [validateField]);

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setValues(prevValues => {
      const fieldErrors = validateField(field, String(prevValues[field] || ''));
      setErrors(prevErrors => ({ ...prevErrors, [field]: fieldErrors }));
      return prevValues;
    });
  }, [validateField]);

  const validateAll = useCallback((): boolean => {
    let isValid = true;
    const allErrors: Record<keyof T, string[]> = {} as Record<keyof T, string[]>;
    const allTouched: Record<keyof T, boolean> = {} as Record<keyof T, boolean>;

    setValues(currentValues => {
      Object.keys(validationRules).forEach(field => {
        const fieldKey = field as keyof T;
        const fieldErrors = validateField(fieldKey, String(currentValues[fieldKey] || ''));
        allErrors[fieldKey] = fieldErrors;
        allTouched[fieldKey] = true;
        if (fieldErrors.length > 0) {
          isValid = false;
        }
      });

      setErrors(allErrors);
      setTouched(allTouched);
      return currentValues;
    });

    return isValid;
  }, [validationRules, validateField]);

  const reset = () => {
    setValues(initialValues);
    setErrors({} as Record<keyof T, string[]>);
    setTouched({} as Record<keyof T, boolean>);
  };

  const isFieldValid = (field: keyof T): boolean => {
    return !errors[field] || errors[field].length === 0;
  };

  const isFormValid = (): boolean => {
    return Object.values(errors).every(fieldErrors => fieldErrors.length === 0);
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateAll,
    reset,
    isFieldValid,
    isFormValid
  };
}
