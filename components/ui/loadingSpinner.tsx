
import { IconWeight, CircleNotch } from "@phosphor-icons/react";
import { FC } from "react";



export interface LoadingSpinner {
    size?: 'sm' | 'md' | 'lg' | number;
    className?: string;
    weight?: IconWeight
}
const LoadingSpinner: FC<LoadingSpinner> = ({className, ...props}) => {
    return (
        <CircleNotch {...props} className={`animate-spin ${className}`} />
    )
}

export default LoadingSpinner
