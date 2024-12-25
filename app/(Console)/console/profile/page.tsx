// UI
import { ProfileForm } from "./components/profile.form";

export default function ProfilePage() {
    return (
        <div className="_profile-form flex w-full min-h-[calc(100vh-5.5rem)]">
            <div className="w-full md:w-1/2 min-h-full">
                <ProfileForm />
            </div>
        </div>
    )
}