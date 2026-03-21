import React from "react";
import Image from "next/image";

interface UserAvatarProps {
  photoUrl?: string;
  firstName?: string;
  lastName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  photoUrl,
  firstName = "",
  lastName = "",
  size = "md",
  className = "",
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-10 h-10";
      case "md":
        return "w-20 h-20";
      case "lg":
        return "w-24 h-24";
      default:
        return "w-20 h-20";
    }
  };

  const sizeClass = getSizeClasses();

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-gray-200 flex-shrink-0 ${className}`}>
      {photoUrl ? (
        <div className="relative w-full h-full">
          <Image
            src={photoUrl}
            alt={`${firstName} ${lastName}`}
            fill
            className="object-cover"
            sizes={`(max-width: 768px) ${parseInt(sizeClass) * 2}px, ${parseInt(sizeClass) * 4}px`}
            priority
          />
        </div>
      ) : (
        <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-xl">
          {firstName?.charAt(0) || ""}
          {lastName?.charAt(0) || ""}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;