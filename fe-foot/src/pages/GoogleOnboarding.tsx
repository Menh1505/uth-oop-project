import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import Button from "@/components/ui/Button";

interface GoogleOnboardingData {
  username: string;
  gender: "male" | "female" | "other";
}

export default function GoogleOnboarding() {
  const navigate = useNavigate();
  const { profile, signIn, completeOnboarding } = useAppStore();

  const [formData, setFormData] = useState<GoogleOnboardingData>({
    username: profile?.username || "",
    gender: "male",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.username.trim()) {
        setError("Username is required");
        setLoading(false);
        return;
      }

      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken");
      if (!token) {
        setError("Authentication token not found");
        setLoading(false);
        return;
      }

      // Send to backend to mark onboarding as complete
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          gender: formData.gender,
          fitness_goal: "maintain", // Default goal
          onboarding_completed: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to complete onboarding");
      }

      // Update local profile FIRST (set needsOnboarding=false)
      console.log("[GoogleOnboarding] Setting profile with needsSetup=true");
      completeOnboarding({
        username: formData.username,
        name: profile?.name || "", // Keep Google name
        goal: "maintain",
        diet: "balanced",
        avatar: profile?.avatar || "",
        budgetPerMeal: profile?.budgetPerMeal || 50000,
        timePerWorkout: profile?.timePerWorkout || 60,
        role: profile?.role || "user",
        needsOnboarding: false,
        needsSetup: true, // Redirect to setup dashboard next
      });

      console.log("[GoogleOnboarding] Calling signIn()");
      signIn(); // Set authed=true

      // Small delay to ensure state updates propagate
      setTimeout(() => {
        console.log("[GoogleOnboarding] Navigating to /google-setup");
        navigate("/google-setup");
      }, 100);
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err.message || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  // If not a Google user needing onboarding, redirect
  if (!profile || !profile.needsOnboarding) {
    navigate("/journal");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to FitFood!
          </h1>
          <p className="text-gray-600">
            Let's set up your profile to get started
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              variant="primary"
            >
              {loading ? "Setting up..." : "Continue"}
            </Button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          You'll set up your body metrics on the next step
        </p>
      </div>
    </div>
  );
}
