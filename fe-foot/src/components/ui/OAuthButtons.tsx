import { useNavigate } from "react-router-dom";
import { GoogleLoginButton } from "../GoogleLoginButton";
import Button from "./Button";
import { useAppStore } from "@/store/useAppStore";

export default function OAuthButtons() {
  const navigate = useNavigate();
  const { signIn, completeOnboarding } = useAppStore();

  const handleGoogleLoginSuccess = (data: any) => {
    console.log("[OAuthButtons] Google login successful, redirecting...");
    console.log("[OAuthButtons] needsOnboarding:", data.needsOnboarding);

    // Set profile with onboarding status if available
    if (data.profile) {
      const profileData = data.profile;
      completeOnboarding({
        name: profileData.user?.name || data.email || "User",
        goal: "maintain",
        diet: "balanced",
        budgetPerMeal: 50000,
        timePerWorkout: 60,
        username: profileData.user?.username || data.email || "",
        avatar: profileData.user?.profile_picture_url || undefined,
        loginMethod: "google",
        role:
          (profileData.user?.role || "user").toString().toLowerCase() ===
          "admin"
            ? "admin"
            : "user",
        needsOnboarding: profileData.needsOnboarding === true,
      });
    } else {
      // Fallback: assume needs onboarding for new users
      signIn();
    }

    // Navigate based on onboarding status
    if (data.needsOnboarding === true) {
      navigate("/google-onboarding");
    } else {
      navigate("/journal");
    }
  };

  const handleGoogleLoginError = (error: any) => {
    console.error("[OAuthButtons] Google login error:", error);
  };

  return (
    <div className="mt-6 space-y-2">
      <GoogleLoginButton
        onSuccess={handleGoogleLoginSuccess}
        onError={handleGoogleLoginError}
        variant="outline"
      />
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() =>
          (window.location.href = "http://localhost:3001/auth/oauth/facebook")
        }
      >
        Đăng nhập với Facebook
      </Button>
    </div>
  );
}
