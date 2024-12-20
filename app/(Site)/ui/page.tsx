import { useTranslations } from "next-intl"
import ExplainApp from "../components/explainApp"
import ExplainFeatures from "../components/explainFeatures";
import screenShot1 from "@/public/kommo-profile.png";
import Prices from "../components/prices";
import { UserComments } from "../components/userComments";
import screenShotExplain from "@/public/profile-ui-kommo.png";

const UiPage = () => {
    const t = useTranslations("General");

    return (
        <div className="_ui-page pt-28">
            <ExplainApp
                title={t("title")}
                text={t("p")}
                srcPic={screenShotExplain}
                picCoverSize="xl:pl-[3.5rem] xl:pt-[3.5rem] md:pl-[2rem] md:pt-[2rem] pt-[1rem] pl-[1rem] bg-yellow-100 "
            />

            <ExplainFeatures
                flex="sm:flex-row"
                bg="bg-purple-100"
                picCoverBg="bg-pink-400"
                picCoverSize="md:pl-[2rem] md:pt-[2rem] pt-[1rem] pl-[1rem]"
                srcPic={screenShot1}
                text={t("s")}
                title={t("xs")}
            />

            <UserComments />

            <Prices />
        </div>
    )
}

export default UiPage