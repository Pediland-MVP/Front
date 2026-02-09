"use client";

import { useTranslations } from "next-intl";
import { HelpMeDialog } from "@/components/Global/HelpMeDialog";
import { MonitorPlayIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Dummy data for learning videos
const learnVideos = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    title: `Learning Module ${i + 1}: Mastering the Platform`,
    description: `In this session ${i + 1}, we explore advanced features and tips to get the most out of your experience.`,
    // Using a sample video URL for testing
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
}));

export default function LearnPage() {
    const t = useTranslations("Learn");

    return (
        <div className="_settings-page flex h-full flex-col rounded-t-3xl bg-linear-to-t from-white/85 to-white p-5 md:h-[calc(100vh-88px)] md:rounded-t-none md:p-8 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl flex flex-col gap-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">{t("title")}</h1>
                    <p className="text-gray-500 mt-1">{t("subtitle")}</p>
                </div>

                {learnVideos.map((video) => (
                    <HelpMeDialog
                        key={video.id}
                        title={video.title}
                        description={video.description}
                        videoSrc={video.videoUrl}
                        position="center"
                    >
                        <button
                            className={cn(
                                "group text-secondary flex min-h-14 w-full items-center gap-3 rounded-lg bg-blue-50 px-5 py-3 font-medium shadow shadow-blue-200/90 duration-300 hover:bg-blue-100/80 hover:translate-x-1 transition-all text-left",
                            )}
                        >
                            <MonitorPlayIcon
                                className="group-hover:text-blue-600 text-secondary/80 size-6 shrink-0 duration-300"
                                weight="duotone"
                            />
                            <div className="flex flex-col gap-0.5">
                                <span className="group-hover:text-blue-900 text-secondary text-sm md:text-base font-semibold duration-300">
                                    {video.title}
                                </span>
                                <span className="text-xs text-gray-500 group-hover:text-blue-800/70 font-normal line-clamp-1">
                                    {video.description}
                                </span>
                            </div>
                        </button>
                    </HelpMeDialog>
                ))}
            </div>
        </div>
    );
}