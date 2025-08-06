"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { ArrowLeft, Save, Eye, Plus, X, Send } from "lucide-react";
import Link from "next/link";
import { jobDepartments, jobTypes, experienceLevels } from "@/data/mockJobs";
import { MultiPlatformJobPosting } from "@/components/jobs/MultiPlatformJobPosting";
import useJobServices, {
  JobCreateData,
  SalaryInfo,
} from "@/lib/services/jobServices";
import { showToast } from "@/utils/toast";

interface JobFormData {
  title: string;
  department: string;
  location: string;
  job_type: "full-time" | "part-time" | "contract" | "temporary" | "internship";
  experience_level: "entry" | "mid" | "senior" | "executive";
  salary: SalaryInfo;
  description: string;
  requirements: { value: string }[];
  responsibilities: { value: string }[];
  benefits: { value: string }[];
  skills: string[];
  closing_date: string;
  remote_allowed: boolean;
  urgent: boolean;
  status: "draft" | "active" | "paused" | "closed" | "expired";
}

const defaultValues: JobFormData = {
  title: "",
  department: "",
  location: "",
  job_type: "full-time",
  experience_level: "mid",
  salary: {
    min: 0,
    max: 0,
    currency: "USD",
    period: "yearly",
  },
  description: "",
  requirements: [{ value: "" }],
  responsibilities: [{ value: "" }],
  benefits: [{ value: "" }],
  skills: [],
  closing_date: "",
  remote_allowed: false,
  urgent: false,
  status: "draft",
};

export default function CreateJobPage() {
  const router = useRouter();
  const { createJob, publishJob } = useJobServices();
  const [currentSkill, setCurrentSkill] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [showMultiPlatform, setShowMultiPlatform] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm<JobFormData>({
    defaultValues,
    mode: "onChange",
  });

  const {
    fields: requirementFields,
    append: appendRequirement,
    remove: removeRequirement,
  } = useFieldArray({
    control,
    name: "requirements",
  });

  const {
    fields: responsibilityFields,
    append: appendResponsibility,
    remove: removeResponsibility,
  } = useFieldArray({
    control,
    name: "responsibilities",
  });

  const {
    fields: benefitFields,
    append: appendBenefit,
    remove: removeBenefit,
  } = useFieldArray({
    control,
    name: "benefits",
  });

  const watchedSkills = watch("skills");
  const watchedTitle = watch("title");
  const watchedLocation = watch("location");
  const watchedDescription = watch("description");

  const addSkill = () => {
    if (currentSkill.trim() && !watchedSkills.includes(currentSkill.trim())) {
      const currentSkills = getValues("skills");
      setValue("skills", [...currentSkills, currentSkill.trim()]);
      setCurrentSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = getValues("skills");
    setValue(
      "skills",
      currentSkills.filter((skill) => skill !== skillToRemove)
    );
  };

  const handlePlatformToggle = (platformId: string, enabled: boolean) => {
    if (enabled) {
      setSelectedPlatforms((prev) => [...prev, platformId]);
    } else {
      setSelectedPlatforms((prev) => prev.filter((id) => id !== platformId));
    }
  };

  const handlePostToAllPlatforms = (platforms: string[]) => {
    console.log("Posting to platforms:", platforms);
    setShowMultiPlatform(false);
    onSubmit(getValues(), "active");
  };

  const prepareJobData = (data: JobFormData, status: "draft" | "active"): JobCreateData => {
    // Filter out empty strings from arrays
    const cleanRequirements = data.requirements
      .map((req) => req.value.trim())
      .filter((req) => req !== "");

    const cleanResponsibilities = data.responsibilities
      .map((resp) => resp.value.trim())
      .filter((resp) => resp !== "");

    const cleanBenefits = data.benefits
      .map((benefit) => benefit.value.trim())
      .filter((benefit) => benefit !== "");

    return {
      title: data.title,
      description: data.description,
      department: data.department || undefined,
      location: data.location,
      job_type: data.job_type,
      experience_level: data.experience_level,
      requirements: cleanRequirements,
      responsibilities: cleanResponsibilities,
      benefits: cleanBenefits,
      skills: data.skills,
      salary: data.salary.min || data.salary.max ? data.salary : undefined,
      remote_allowed: data.remote_allowed,
      urgent: data.urgent,
      closing_date: data.closing_date || undefined,
      status: status,
    };
  };

  const onSubmit = async (
    data: JobFormData,
    status: "draft" | "active" = "draft"
  ) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const jobData = prepareJobData(data, status);

      // Create the job first
      const response = await createJob(jobData);

      if (response && response?.result == "success") {
        showToast.success(
          `${response.message || "Job has been created successfully!"}`
        );
        router.push("/dashboard/jobs");
      } else {
        showToast.error(
          response?.message || "Failed to create job. Please try again."
        );
      }
    } catch (error: any) {
      console.error("Error creating job:", error);
      setError(error?.message || "Failed to create job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = watchedTitle && watchedLocation && watchedDescription;

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/jobs"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Create New Job
          </h1>
          <p className="text-gray-600 mt-1">
            Fill in the details to create a new job posting
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit((data) => onSubmit(data, "draft"))}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2 inline" />
            {isSubmitting ? "Saving..." : "Save as Draft"}
          </button>

          <button
            onClick={() => setShowMultiPlatform(true)}
            disabled={!isFormValid || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 mr-2 inline" />
            Post to Multiple Platforms
          </button>

          <button
            onClick={handleSubmit((data) => onSubmit(data, "active"))}
            disabled={!isFormValid || isSubmitting}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="w-4 h-4 mr-2 inline" />
            {isSubmitting ? "Publishing..." : "Publish Job Only"}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit((data) => onSubmit(data, "draft"))}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <Controller
                    name="title"
                    control={control}
                    rules={{
                      required: "Job title is required",
                      minLength: {
                        value: 2,
                        message: "Job title must be at least 2 characters",
                      },
                    }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="e.g., Senior Frontend Developer"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent ${
                          errors.title ? "border-red-300" : "border-gray-300"
                        }`}
                      />
                    )}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <Controller
                    name="department"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                      >
                        <option value="">Select Department</option>
                        {jobDepartments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <Controller
                    name="location"
                    control={control}
                    rules={{
                      required: "Location is required",
                      minLength: {
                        value: 2,
                        message: "Location must be at least 2 characters",
                      },
                    }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="e.g., San Francisco, CA or Remote"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent ${
                          errors.location ? "border-red-300" : "border-gray-300"
                        }`}
                      />
                    )}
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.location.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Type
                  </label>
                  <Controller
                    name="job_type"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                      >
                        {jobTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <Controller
                    name="experience_level"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                      >
                        {experienceLevels.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closing Date
                  </label>
                  <Controller
                    name="closing_date"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Additional Options */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center">
                  <Controller
                    name="remote_allowed"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <input
                        type="checkbox"
                        id="remote_allowed"
                        checked={value}
                        onChange={onChange}
                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      />
                    )}
                  />
                  <label
                    htmlFor="remote_allowed"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Remote work allowed
                  </label>
                </div>

                <div className="flex items-center">
                  <Controller
                    name="urgent"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <input
                        type="checkbox"
                        id="urgent"
                        checked={value}
                        onChange={onChange}
                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      />
                    )}
                  />
                  <label
                    htmlFor="urgent"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Urgent hiring
                  </label>
                </div>
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Salary Range
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Salary
                  </label>
                  <Controller
                    name="salary.min"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        placeholder="50000"
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Salary
                  </label>
                  <Controller
                    name="salary.max"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        placeholder="80000"
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <Controller
                    name="salary.currency"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <Controller
                name="description"
                control={control}
                rules={{
                  required: "Job description is required",
                  minLength: {
                    value: 10,
                    message: "Job description must be at least 10 characters",
                  },
                }}
                render={({ field }) => (
                  <textarea
                    {...field}
                    placeholder="Describe the role, company culture, and what makes this position exciting..."
                    rows={6}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent ${
                      errors.description ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                )}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              <div className="space-y-3">
                {requirementFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Controller
                      name={`requirements.${index}.value`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="e.g., 3+ years of experience in React"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                        />
                      )}
                    />
                    {requirementFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendRequirement({ value: "" })}
                  className="flex items-center gap-2 px-3 py-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Requirement
                </button>
              </div>
            </div>

            {/* Responsibilities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsibilities
              </label>
              <div className="space-y-3">
                {responsibilityFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Controller
                      name={`responsibilities.${index}.value`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="e.g., Develop and maintain web applications"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                        />
                      )}
                    />
                    {responsibilityFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeResponsibility(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendResponsibility({ value: "" })}
                  className="flex items-center gap-2 px-3 py-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Responsibility
                </button>
              </div>
            </div>

            {/* Benefits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Benefits
              </label>
              <div className="space-y-3">
                {benefitFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Controller
                      name={`benefits.${index}.value`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="e.g., Health insurance and flexible work hours"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                        />
                      )}
                    />
                    {benefitFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBenefit(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendBenefit({ value: "" })}
                  className="flex items-center gap-2 px-3 py-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Benefit
                </button>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="e.g., React, TypeScript, Node.js"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
                  >
                    Add
                  </button>
                </div>

                {watchedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {watchedSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-yellow-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Multi-Platform Posting Modal */}
      {showMultiPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Post to Multiple Platforms
                </h2>
                <button
                  onClick={() => setShowMultiPlatform(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  ✕
                </button>
              </div>

              <MultiPlatformJobPosting
                jobData={{
                  title: watchedTitle,
                  department: getValues("department"),
                  location: watchedLocation,
                  type: getValues("job_type"),
                }}
                onPlatformToggle={handlePlatformToggle}
                onPostToAll={handlePostToAllPlatforms}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
