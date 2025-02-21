import { IconWeight } from "@phosphor-icons/react";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { FC } from "react";

export interface LoadingSpinner {
    size?: 'sm' | 'md' | 'lg' | number;
    className?: string;
    weight?: IconWeight;
}
const LoadingSpinner: FC<LoadingSpinner> = ({ className, ...props }) => {
    return (
        <div className={`w-full flex items-center justify-center ${className}`}>
            <CircleNotch {...props} className={`animate-spin text-primary ${className}`} size={28} />
        </div>
    )
}

export default LoadingSpinner
