import React from "react";

export interface VerifiedBadgeProps {
  icon?: string;
  color?: string;
  size?: number;
  className?: string;
  title?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  icon = "verified",
  color = "#00daf3",
  size = 24,
  className = "",
  title = "Verified",
}) => {
  const renderInnerIcon = () => {
    switch (icon) {
      case "crown":
        // Crisp King Crown SVG
        return (
          <path
            d="M5 15.5L3.5 8L8.5 11.5L12 4.5L15.5 11.5L20.5 8L19 15.5H5ZM5 17H19V19H5V17Z"
            fill="white"
          />
        );
      case "star":
        // Star SVG
        return (
          <path
            d="M12 4.5L14.47 9.5L20 10.3L16 14.2L16.94 19.7L12 17.1L7.06 19.7L8 14.2L4 10.3L9.53 9.5L12 4.5Z"
            fill="white"
          />
        );
      case "diamond":
        // Diamond Gem SVG
        return (
          <path
            d="M16 4.5H8L4.5 9.5L12 19.5L19.5 9.5L16 4.5ZM6.5 9L8.5 6H15.5L17.5 9H6.5ZM12 17L7.2 10.5H16.8L12 17Z"
            fill="white"
          />
        );
      case "bolt":
        // Lightning Bolt SVG
        return (
          <path
            d="M11 20.5H13L15 13H19L11 3.5V11.5H7L11 20.5Z"
            fill="white"
          />
        );
      case "shield":
        // Shield SVG
        return (
          <path
            d="M12 3L4.5 5.8V11.5C4.5 16.2 7.7 20.6 12 21.7C16.3 20.6 19.5 16.2 19.5 11.5V5.8L12 3ZM10.2 15.5L6.5 11.8L7.9 10.4L10.2 12.7L16.1 6.8L17.5 8.2L10.2 15.5Z"
            fill="white"
          />
        );
      case "local_fire_department":
      case "flame":
        // Flame SVG
        return (
          <path
            d="M12 3C12 3 10.5 5.5 10.5 7.5C10.5 8.5 11.2 9.5 12 9.5C12.8 9.5 13.5 8.5 13.5 7.5C13.5 5.5 12 3 12 3ZM16.8 9.8C15.8 7.8 14.3 6.8 14.3 6.8C14.3 6.8 13.8 8.8 12.3 10.3C11.3 11.3 10.3 12.3 10.3 14.3C10.3 17.3 12.3 19.8 15.3 19.8C18.3 19.8 20.3 17.3 20.3 14.3C20.3 12.8 19.3 11.3 16.8 9.8ZM12 21C7.8 21 4.5 17.7 4.5 13.5C4.5 10.2 6.8 7.5 7.8 6.5C7.5 7.8 7.8 9.8 8.8 10.8C9.8 11.8 10.8 11.8 10.8 11.8C10.8 11.8 10.3 13.3 10.8 14.8C11.3 16.3 12.8 17.3 14.3 17.3C14.8 17.3 15.8 16.8 16.3 15.8C16.3 18.8 14.5 21 12 21Z"
            fill="white"
          />
        );
      case "workspace_premium":
      case "ribbon":
        // Ribbon SVG
        return (
          <path
            d="M12 3C8.7 3 6 5.7 6 9C6 11.5 7.6 13.7 9.9 14.5L8.5 21L12 19L15.5 21L14.1 14.5C16.4 13.7 18 11.5 18 9C18 5.7 15.3 3 12 3ZM12 13C9.8 13 8 11.2 8 9C8 6.8 9.8 5 12 5C14.2 5 16 6.8 16 9C16 11.2 14.2 13 12 13Z"
            fill="white"
          />
        );
      case "verified":
      default:
        // Sharp checkmark SVG
        return (
          <path
            d="M9.86 16.14L6 12.28L7.42 10.86L9.86 13.3L16.58 6.58L18 8L9.86 16.14Z"
            fill="white"
          />
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 align-middle ${className}`}
      aria-label={title}
      style={{ minWidth: size, minHeight: size, width: size, height: size }}
    >
      <title>{title}</title>
      
      {/* Standard 10-scallop rosette verified badge shape centered at 12, 12 */}
      <path
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.15.33-1.41-.09-2.92-1.16-3.91-1.07-1-2.58-1.33-3.98-.88C14.35 2.8 13.06 2 11.5 2s-2.85.8-3.42 2.06c-1.4-.45-2.91-.12-3.98.88-1.07.99-1.49 2.5-1.16 3.91C1.63 9.33.75 10.57.75 12c0 1.43.88 2.67 2.19 3.15-.33 1.41.09 2.92 1.16 3.91 1.07 1 2.58 1.33 3.98.88.57 1.26 1.86 2.06 3.42 2.06s2.85-.8 3.42-2.06c1.4.45 2.91.12 3.98-.88 1.07-.99 1.49-2.5 1.16-3.91 1.31-.48 2.19-1.72 2.19-3.15z"
        transform="translate(0.5, 0)"
        fill={color}
      />

      {/* Scaled and centered white inner icon */}
      <g transform="translate(3, 3) scale(0.75)">
        {renderInnerIcon()}
      </g>
    </svg>
  );
};
export default VerifiedBadge;