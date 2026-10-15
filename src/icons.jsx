/*! Icon shapes from Lucide (https://lucide.dev), ISC License, Copyright (c) Lucide Icons and Contributors */

// Inlined so the package does not need an icon library
function icon(children) {
  return function Icon({ className, ...props }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
        {...props}
      >
        {children}
      </svg>
    );
  };
}

export const ArrowRight = icon(<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>);

export const CalendarDays = icon(<><path d="M8 2v3" /><path d="M16 2v3" /><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M8 13h.01" /><path d="M12 13h.01" /><path d="M16 13h.01" /><path d="M8 17h.01" /><path d="M12 17h.01" /><path d="M16 17h.01" /></>);

export const Check = icon(<path d="M20 6 9 17l-5-5" />);

export const ChevronDown = icon(<path d="m6 9 6 6 6-6" />);

export const ChevronLeft = icon(<path d="m15 18-6-6 6-6" />);

export const ChevronRight = icon(<path d="m9 18 6-6-6-6" />);

export const ListFilter = icon(<><path d="M2 5h20" /><path d="M6 12h12" /><path d="M9 19h6" /></>);

export const Search = icon(<><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></>);

export const X = icon(<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>);
