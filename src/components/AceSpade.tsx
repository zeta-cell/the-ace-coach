import aceSpade from "@/assets/ace-spade-icon.png";

interface AceSpadeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  opacity?: number;
}

const sizes = {
  sm: "w-6 md:w-8",
  md: "w-10 md:w-14",
  lg: "w-16 md:w-20",
};

const AceSpade = ({ size = "md", className = "", opacity = 0.15 }: AceSpadeProps) => (
  <img
    src={aceSpade}
    alt=""
    className={`inline-block select-none pointer-events-none ${sizes[size]} ${className}`}
    style={{ opacity }}
    aria-hidden="true"
    width={32}
    height={32}
    loading="lazy"
  />
);

export default AceSpade;
