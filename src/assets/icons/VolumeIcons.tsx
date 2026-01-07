type IconProps = React.SVGProps<SVGSVGElement>;

const baseClass = "w-8 h-8";

export function VolumeMutedIcon({ className = "", ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={`${baseClass} ${className}`}
      {...rest}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75v-13.5l-5.25 4.5H3v4.5h3.75L12 18.75Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.5 9 4.5 6m0-6-4.5 6"
      />
    </svg>
  );
}

export function VolumeLowIcon({ className = "", ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={`${baseClass} ${className}`}
      {...rest}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75v-13.5l-5.25 4.5H3v4.5h3.75L12 18.75Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9.75a3 3 0 0 1 0 4.5"
      />
    </svg>
  );
}

export function VolumeMediumIcon({ className = "", ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={`${baseClass} ${className}`}
      {...rest}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75v-13.5l-5.25 4.5H3v4.5h3.75L12 18.75Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9.75a3 3 0 0 1 0 4.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.25 8.25a4.5 4.5 0 0 1 0 7.5"
      />
    </svg>
  );
}

export function VolumeHighIcon({ className = "", ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={`${baseClass} ${className}`}
      {...rest}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75v-13.5l-5.25 4.5H3v4.5h3.75L12 18.75Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9.75a3 3 0 0 1 0 4.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.25 8.25a4.5 4.5 0 0 1 0 7.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.75 6.75a6 6 0 0 1 0 10.5"
      />
    </svg>
  );
}

