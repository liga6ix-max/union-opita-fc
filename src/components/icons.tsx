import type { SVGProps } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

export function ClubLogo(props: SVGProps<SVGSVGElement> & { className?: string }) {
    const searchParams = useSearchParams();
    const logoUrl = searchParams.get('logo');

    if (logoUrl) {
        return (
            <Image
                src={logoUrl}
                alt="Club Logo"
                width={32}
                height={32}
                className={props.className}
                unoptimized
            />
        )
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.4" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
            <circle cx="12" cy="12" r="3" fill="white" />
        </svg>
    )
}
