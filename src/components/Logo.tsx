import stabileeLogo from "@/assets/stabilee-logo-new.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const Logo = ({ size = "md", showText = true }: LogoProps) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className="flex items-center gap-2.5">
      <img 
        src={stabileeLogo} 
        alt="Stabilee Logo" 
        className={`${sizes[size]} object-contain`}
      />
      {showText && (
        <span className={`${textSizes[size]} font-outfit font-medium tracking-tight text-foreground`}>
          Stabilee
        </span>
      )}
    </div>
  );
};

export default Logo;