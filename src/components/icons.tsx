import type { SVGProps } from "react";
import Image from "next/image";

// The useSearchParams version of this component won't work in the sidebar
// because the layout doesn't have access to the search params.
// We'll just show the default logo for now.
export function ClubLogo(props: SVGProps<SVGSVGElement> & { className?: string }) {
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
