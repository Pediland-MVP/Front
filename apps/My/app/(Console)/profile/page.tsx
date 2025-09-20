// UI
import { ProfileForm } from "./components/profile.form";

export default function ProfilePage() {
  return (
    <div className="_profile-form flex min-h-[calc(100vh-5.5rem)] w-full">
      <div className="min-h-full w-full md:w-1/2">
        <ProfileForm />
      </div>
    </div>
  );
}
