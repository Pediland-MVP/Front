import { FC } from "react";
import { useTranslations } from "next-intl";

type ProfileLayout = {
    children: React.ReactNode;
};

const ProfileLayout: FC<ProfileLayout> = ({ children }) => {
    const t = useTranslations("Profile");

    return (
        <div className="_profile-page">
            <div className="_profile-layout">
                {children}
            </div>
        </div>
    )
}

export default ProfileLayout
