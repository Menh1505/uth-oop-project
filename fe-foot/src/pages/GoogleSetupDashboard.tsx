import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import Button from "@/components/ui/Button";

interface SetupData {
  age: number;
  weight: number; // kg
  height: number; // cm
}

export default function GoogleSetupDashboard() {
  const navigate = useNavigate();
  const { profile, updateProfile, completeOnboarding } = useAppStore();

  const [formData, setFormData] = useState<SetupData>({
    age: 25,
    weight: 70,
    height: 170,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not logged in or already completed
  useEffect(() => {
    if (!profile) {
      navigate("/login");
    }
  }, [profile, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate
      if (formData.age < 13 || formData.age > 120) {
        setError("Age must be between 13 and 120");
        setLoading(false);
        return;
      }
      if (formData.weight < 30 || formData.weight > 300) {
        setError("Weight must be between 30 and 300 kg");
        setLoading(false);
        return;
      }
      if (formData.height < 100 || formData.height > 250) {
        setError("Height must be between 100 and 250 cm");
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

      // Update profile with body metrics
      const updatedResult = await updateProfile({
        age: formData.age,
        weight: formData.weight,
        height: formData.height,
        fitness_goal: "maintain", // Set default goal to mark setup complete
      });
      const updatedUser = (updatedResult as any)?.user;

      // Update local state to mark setup as complete
      completeOnboarding({
        ...profile,
        age: updatedUser?.age ?? formData.age,
        weight: updatedUser?.weight ?? formData.weight,
        height: updatedUser?.height ?? formData.height,
        bmi: updatedUser?.bmi ?? profile?.bmi,
        bmi_category: updatedUser?.bmi_category ?? profile?.bmi_category,
        needsSetup: false, // Mark setup complete!
      });

      // Redirect to journal
      navigate("/journal");
    } catch (err: any) {
      console.error("Setup error:", err);
      setError(err.message || "Failed to save setup");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  // Calculate BMI for reference
  const bmi = (formData.weight / (formData.height / 100) ** 2).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        {/* Avatar Display */}
        <div className="flex justify-center mb-6">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-blue-200">
              {profile.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {profile.name}!
          </h1>
          <p className="text-gray-600">Let's get your body metrics set up</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age (years) *
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="13"
              max="120"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Between 13 and 120</p>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg) *
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              min="30"
              max="300"
              step="0.5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Between 30 and 300 kg</p>
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (cm) *
            </label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              min="100"
              max="250"
              step="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Between 100 and 250 cm</p>
          </div>

          {/* BMI Display */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Your estimated BMI:{" "}
              <span className="font-bold text-blue-600">{bmi}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {parseFloat(bmi) < 18.5
                ? "Underweight"
                : parseFloat(bmi) < 25
                ? "Normal weight"
                : parseFloat(bmi) < 30
                ? "Overweight"
                : "Obese"}
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              variant="primary"
            >
              {loading ? "Saving..." : "Get Started"}
            </Button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          You can update these details later in settings
        </p>
      </div>
    </div>
  );
}
