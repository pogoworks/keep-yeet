import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
};

const createIcon = (pathD: string, displayName: string) => {
  const Icon = ({ size = 24, className, ...props }: IconProps) => (
    <svg
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <path d={pathD} fill="currentColor" />
    </svg>
  );
  Icon.displayName = displayName;
  return Icon;
};

// Triage icons
export const Check = createIcon(
  "M18 6h2v2h-2V6zm-2 4V8h2v2h-2zm-2 2v-2h2v2h-2zm-2 2h2v-2h-2v2zm-2 2h2v-2h-2v2zm-2 0v2h2v-2H8zm-2-2h2v2H6v-2zm0 0H4v-2h2v2z",
  "Check"
);

export const Undo = createIcon(
  "M8 4h2v2H8V4zm10 6V8H8V6H6v2H4v2h2v2h2v2h2v-2H8v-2h10zm0 8v-8h2v8h-2zm0 0v2h-6v-2h6z",
  "Undo"
);

export const Trash = createIcon(
  "M16 2v4h6v2h-2v14H4V8H2V6h6V2h8zm-2 2h-4v2h4V4zm0 4H6v12h12V8h-4zm-5 2h2v8H9v-8zm6 0h-2v8h2v-8z",
  "Trash"
);

// Navigation icons
export const ArrowLeft = createIcon(
  "M20 11v2H8v2H6v-2H4v-2h2V9h2v2h12zM10 7H8v2h2V7zm0 0h2V5h-2v2zm0 10H8v-2h2v2zm0 0h2v2h-2v-2z",
  "ArrowLeft"
);

export const ArrowRight = createIcon(
  "M4 11v2h12v2h2v-2h2v-2h-2V9h-2v2H4zm10-4h2v2h-2V7zm0 0h-2V5h2v2zm0 10h2v-2h-2v2zm0 0h-2v2h2v-2z",
  "ArrowRight"
);

export const ChevronRight = createIcon(
  "M10 6h2v2h-2V6zm2 2h2v2h-2V8zm2 2h2v2h-2v-2zm0 2v2h-2v-2h2zm-2 2v2h-2v-2h2z",
  "ChevronRight"
);

export const ArrowsHorizontal = createIcon(
  "M15 9V7h2v2h-2zm2 6v-2h-4v-2h4V9h2v2h2v2h-2v2h-2zm0 0v2h-2v-2h2zm-6-4v2H7v2H5v-2H3v-2h2V9h2v2h4zm-4 4h2v2H7v-2zm2-8v2H7V7h2z",
  "ArrowsHorizontal"
);

// Action icons
export const Play = createIcon(
  "M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z",
  "Play"
);

export const Zap = createIcon(
  "M12 1h2v8h8v4h-2v-2h-8V5h-2V3h2V1zM8 7V5h2v2H8zM6 9V7h2v2H6zm-2 2V9h2v2H4zm10 8v2h-2v2h-2v-8H2v-4h2v2h8v6h2zm2-2v2h-2v-2h2zm2-2v2h-2v-2h2zm0 0h2v-2h-2v2z",
  "Zap"
);

export const Plus = createIcon(
  "M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7V4z",
  "Plus"
);

export const Close = createIcon(
  "M5 5h2v2H5V5zm4 4H7V7h2v2zm2 2H9V9h2v2zm2 0h-2v2H9v2H7v2H5v2h2v-2h2v-2h2v-2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2v-2zm2-2v2h-2V9h2zm2-2v2h-2V7h2zm0 0V5h2v2h-2z",
  "Close"
);

export const Copy = createIcon(
  "M4 2h11v2H6v13H4V2zm4 4h12v16H8V6zm2 2v12h8V8h-8z",
  "Copy"
);

// Folder icons
export const Folder = createIcon(
  "M4 4h8v2h10v14H2V4h2zm16 4H10V6H4v12h16V8z",
  "Folder"
);

export const FolderPlus = createIcon(
  "M4 4h8v2h10v14H2V4h2zm16 4H10V6H4v12h16V8zm-6 2h2v2h2v2h-2v2h-2v-2h-2v-2h2v-2z",
  "FolderPlus"
);

// Media icons
export const Images = createIcon(
  "M24 2H4v16h20V2zM6 16V4h16v12H6zM2 4H0v18h20v-2H2V4zm12 2h2v2h-2V6zm-2 4V8h2v2h-2zm-2 2v-2h2v2h-2zm0 0v2H8v-2h2zm8-2h-2V8h2v2zm0 0h2v2h-2v-2zM8 6h2v2H8V6z",
  "Images"
);

// Status icons
export const CheckCircle = createIcon(
  "M5 3H3v2h2V3zm14 0H5v2h14V3zm0 0h2v2h-2V3zm0 16v2H5v-2h14zm0 0h2v-2h-2v2zm0-2V5h2v12h-2zM3 5v12h2V5H3zm2 12v2h2v-2H5zm10-6h2v2h-2V9zm-2 4v-2h2v2h-2zm-2 0v2h2v-2h-2zm0 0H9v-2h2v2zm-2-4h2v2H9V9z",
  "CheckCircle"
);

export const InfoBox = createIcon(
  "M3 3h2v18H3V3zm16 0H5v2h14v14H5v2h16V3h-2zm-8 6h2V7h-2v2zm2 8h-2v-6h2v6z",
  "InfoBox"
);

// Breadcrumb icons
export const Home = createIcon(
  "M14 2h-4v2H8v2H6v2H4v2H2v2h2v10h7v-6h2v6h7V12h2v-2h-2V8h-2V6h-2V4h-2V2zm0 2v2h2v2h2v2h2v2h-2v8h-3v-6H9v6H6v-8H4v-2h2V8h2V6h2V4h4z",
  "Home"
);

export const Briefcase = createIcon(
  "M8 4h8v2h6v14H2V6h6V4zm2 2h4V4h-4v2zM4 8v10h16V8H4z",
  "Briefcase"
);

export const User = createIcon(
  "M15 2H9v2H7v6h2v2H7v2H5v2H3v6h18v-6h-2v-2h-2v-2h-2v-2h2V4h-2V2zm0 2v6h-2v2h2v2h2v2h2v4H7v-4h2v-2h2v-2h2v-2H9V4h6z",
  "User"
);

export const Eye = createIcon(
  "M9 5H7v2H5v2H3v2H1v2h2v2h2v2h2v2h6v-2h2v-2h2v-2h2v-2h-2V9h-2V7h-2V5H9zm0 2h6v2h2v2h2v2h-2v2h-2v2H9v-2H7v-2H5v-2h2V9h2V7zm2 2h2v2h2v2h-2v2h-2v-2H9v-2h2V9z",
  "Eye"
);

export const Grid = createIcon(
  "M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z",
  "Grid"
);

export const Clock = createIcon(
  "M19 3H5v2H3v14h2v2h14v-2h2V5h-2V3zm0 2v14H5V5h14zm-8 2h2v6h4v2h-6V7z",
  "Clock"
);

export const Image = createIcon(
  "M4 3H2v18h20V3H4zm16 2v14H4V5h16zm-6 4h-2v2h-2v2H8v2H6v2h2v-2h2v-2h2v-2h2v2h2v2h2v-2h-2v-2h-2V9zM8 7H6v2h2V7z",
  "Image"
);

export const MoreHorizontal = createIcon(
  "M1 9h6v6H1V9zm2 2v2h2v-2H3zm6-2h6v6H9V9zm2 2v2h2v-2h-2zm6-2h6v6h-6V9zm2 2v2h2v-2h-2z",
  "MoreHorizontal"
);

export const PanelRight = createIcon(
  "M2 4h20v16H2V4zm2 2v12h10V6H4zm12 0v12h4V6h-4z",
  "PanelRight"
);
