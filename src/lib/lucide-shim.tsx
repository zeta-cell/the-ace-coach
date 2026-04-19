/**
 * App-wide icon shim.
 *
 * The project historically imports from `lucide-react`. To enforce a single
 * consistent visual style (Phosphor "fill" weight glyphs), we alias the
 * `lucide-react` package to this file via vite.config.ts. Every existing
 * `import { Foo } from "lucide-react"` then resolves here and renders a
 * Phosphor filled icon under the same name.
 *
 * Each exported component:
 *   - accepts the standard `size`, `className`, `strokeWidth`, `color`, `style` props
 *   - ignores `strokeWidth` (Phosphor uses `weight` instead)
 *   - defaults to `weight="fill"` for the consistent glyph look
 *
 * Adding a new icon: add an entry below mapping the Lucide name → Phosphor component.
 * If a Lucide icon has no obvious Phosphor equivalent, pick the closest filled glyph.
 */
import * as React from "react";
import {
  AirplaneTilt,
  ArrowBendDownLeft,
  ArrowBendUpRight,
  ArrowLeft as PhArrowLeft,
  ArrowRight as PhArrowRight,
  ArrowDown as PhArrowDown,
  ArrowUp as PhArrowUp,
  ArrowSquareOut,
  Barbell as PhBarbell,
  Bell as PhBell,
  BellSlash,
  Briefcase as PhBriefcase,
  BookOpen as PhBookOpen,
  Brain as PhBrain,
  Buildings,
  Calendar as PhCalendar,
  CalendarBlank,
  CalendarDots,
  Camera as PhCamera,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  ChartBar,
  ChatCircle,
  ChatCircleDots,
  Check as PhCheck,
  CheckCircle as PhCheckCircle,
  Circle as PhCircle,
  ClipboardText,
  Confetti,
  Clock as PhClock,
  Cloud as PhCloud,
  CloudLightning as PhCloudLightning,
  CloudRain as PhCloudRain,
  CloudSnow as PhCloudSnow,
  Coin,
  Coins as PhCoins,
  Compass as PhCompass,
  Copy as PhCopy,
  CreditCard as PhCreditCard,
  Crown as PhCrown,
  CurrencyDollar,
  CurrencyEur,
  Database as PhDatabase,
  DownloadSimple,
  Drop,
  DotsThree,
  DotsSixVertical,
  Envelope,
  Eye as PhEye,
  EyeSlash,
  File,
  FileText as PhFileText,
  Fire as PhFire,
  Footprints as PhFootprints,
  Funnel,
  Gauge,
  Gear,
  IdentificationCard,
  Gift as PhGift,
  Globe as PhGlobe,
  Hash as PhHash,
  Heart as PhHeart,
  HeartBreak,
  House,
  Info as PhInfo,
  Key,
  Leaf as PhLeaf,
  LightbulbFilament,
  Lightning as PhLightning,
  Link as PhLink,
  LinkBreak,
  List as PhList,
  Lock as PhLock,
  MapPin as PhMapPin,
  Minus as PhMinus,
  Medal as PhMedal,
  Moon as PhMoon,
  PaperPlaneTilt,
  Pencil as PhPencil,
  PencilSimple,
  Phone as PhPhone,
  Play as PhPlay,
  Plug,
  Plus as PhPlus,
  Pulse,
  Rows,
  ShareNetwork,
  ShieldCheck,
  ShoppingBag as PhShoppingBag,
  SlidersHorizontal as PhSlidersHorizontal,
  SignOut,
  Smiley,
  SoccerBall,
  Sparkle,
  Square as PhSquare,
  SquaresFour,
  Stack,
  Star as PhStar,
  Sun as PhSun,
  Tag as PhTag,
  Target as PhTarget,
  Ticket as PhTicket,
  Trash as PhTrash,
  TrendDown,
  TrendUp,
  Trophy as PhTrophy,
  Upload as PhUpload,
  User as PhUser,
  UserCircleCheck,
  UserCirclePlus,
  UserCircleMinus,
  UsersThree,
  Video as PhVideo,
  Wallet as PhWallet,
  Warning,
  WarningCircle,
  WifiHigh,
  Wind as PhWind,
  X as PhX,
  XCircle,
} from "@phosphor-icons/react";

/** Common props compatible with both lucide-react and our shim. */
export interface IconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number; // ignored — Phosphor uses weight instead
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<SVGSVGElement>;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
}

type PhIcon = React.ComponentType<{
  size?: number | string;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}>;

/**
 * Wrap a Phosphor icon so it renders as a filled glyph by default and accepts
 * Lucide-style props. We omit `strokeWidth` because Phosphor doesn't use it.
 */
const wrap = (Ph: PhIcon, opts?: { weight?: "fill" | "regular" | "bold" }) => {
  const weight = opts?.weight ?? "fill";
  const Component = React.forwardRef<SVGSVGElement, IconProps>(
    ({ size = 20, strokeWidth: _ignored, ...rest }, _ref) => {
      // Phosphor doesn't forward refs to its SVG in older versions; we drop the
      // ref to keep TS happy. Component identity is what matters for callers.
      return <Ph size={size} weight={weight} {...rest} />;
    }
  );
  Component.displayName = `Icon(${(Ph as React.ComponentType<unknown>).displayName ?? "Phosphor"})`;
  return Component;
};

// ---------- Lucide name → Phosphor (filled) mapping ----------
// Some icons are intentionally left as `regular` weight where the filled
// version would be too heavy (chevrons, arrows, separators).

export const Activity = wrap(Pulse);
export const AlertCircle = wrap(WarningCircle);
export const AlertTriangle = wrap(Warning);
export const ArrowDownLeft = wrap(ArrowBendDownLeft, { weight: "bold" });
export const ArrowLeft = wrap(PhArrowLeft, { weight: "bold" });
export const ArrowRight = wrap(PhArrowRight, { weight: "bold" });
export const ArrowUpRight = wrap(ArrowBendUpRight, { weight: "bold" });
export const Award = wrap(PhMedal);
export const BarChart3 = wrap(ChartBar);
export const Battery = wrap(Gauge);
export const Bell = wrap(PhBell);
export const Blocks = wrap(Stack);
export const BookOpen = wrap(PhBookOpen);
export const Brain = wrap(PhBrain);
export const Building2 = wrap(Buildings);
export const Calendar = wrap(CalendarBlank);
export const CalendarDays = wrap(CalendarDots);
export const Camera = wrap(PhCamera);
export const Check = wrap(PhCheck, { weight: "bold" });
export const CheckCircle = wrap(PhCheckCircle);
export const CheckCircle2 = wrap(PhCheckCircle);
export const ChevronDown = wrap(CaretDown, { weight: "bold" });
export const ChevronLeft = wrap(CaretLeft, { weight: "bold" });
export const ChevronRight = wrap(CaretRight, { weight: "bold" });
export const ChevronUp = wrap(CaretUp, { weight: "bold" });
export const Circle = wrap(PhCircle);
export const ClipboardList = wrap(ClipboardText);
export const Clock = wrap(PhClock);
export const Cloud = wrap(PhCloud);
export const CloudDrizzle = wrap(PhCloudRain);
export const CloudLightning = wrap(PhCloudLightning);
export const CloudRain = wrap(PhCloudRain);
export const CloudSnow = wrap(PhCloudSnow);
export const Coins = wrap(PhCoins);
export const Compass = wrap(PhCompass);
export const Copy = wrap(PhCopy);
export const CreditCard = wrap(PhCreditCard);
export const Crown = wrap(PhCrown);
export const DollarSign = wrap(CurrencyDollar, { weight: "bold" });
export const Dot = wrap(PhCircle);
export const Droplets = wrap(Drop);
export const Dumbbell = wrap(PhBarbell);
export const Edit = wrap(PencilSimple);
export const Edit2 = wrap(PencilSimple);
export const Edit3 = wrap(PhPencil);
export const Euro = wrap(CurrencyEur, { weight: "bold" });
export const ExternalLink = wrap(ArrowSquareOut);
export const Eye = wrap(PhEye);
export const EyeOff = wrap(EyeSlash);
export const FileText = wrap(PhFileText);
export const Flame = wrap(PhFire);
export const Footprints = wrap(PhFootprints);
export const Gift = wrap(PhGift);
export const Globe = wrap(PhGlobe);
export const Grip = wrap(DotsSixVertical, { weight: "bold" });
export const GripVertical = wrap(DotsSixVertical, { weight: "bold" });
export const Hash = wrap(PhHash, { weight: "bold" });
export const Heart = wrap(PhHeart);
export const HeartOff = wrap(HeartBreak);
export const Home = wrap(House);
export const Info = wrap(PhInfo);
export const KeyRound = wrap(Key);
export const Layers = wrap(Stack);
export const LayoutGrid = wrap(SquaresFour);
export const Leaf = wrap(PhLeaf);
export const Link2 = wrap(PhLink);
export const List = wrap(PhList, { weight: "bold" });
export const Loader2 = wrap(Sparkle); // spinner — used with animate-spin in callers
export const Lock = wrap(PhLock);
export const Mail = wrap(Envelope);
export const MapPin = wrap(PhMapPin);
export const Medal = wrap(PhMedal);
export const MessageCircle = wrap(ChatCircle);
export const MessageSquare = wrap(ChatCircleDots);
export const Moon = wrap(PhMoon);
export const MoreHorizontal = wrap(DotsThree, { weight: "bold" });
export const PanelLeft = wrap(Rows);
export const Pencil = wrap(PencilSimple);
export const Phone = wrap(PhPhone);
export const Play = wrap(PhPlay);
export const Plus = wrap(PhPlus, { weight: "bold" });
export const RefreshCw = wrap(ArrowBendUpRight, { weight: "bold" });
export const Save = wrap(PhCheckCircle);
export const Search = wrap(Funnel);
export const Send = wrap(PaperPlaneTilt);
export const Share = wrap(ShareNetwork);
export const Share2 = wrap(ShareNetwork);
export const Shield = wrap(ShieldCheck);
export const ShoppingBag = wrap(PhShoppingBag);
export const Square = wrap(PhSquare);
export const Star = wrap(PhStar);
export const Sun = wrap(PhSun);
export const Tag = wrap(PhTag);
export const Target = wrap(PhTarget);
export const Ticket = wrap(PhTicket);
export const Trash2 = wrap(PhTrash);
export const TrendingDown = wrap(TrendDown, { weight: "bold" });
export const TrendingUp = wrap(TrendUp, { weight: "bold" });
export const Trophy = wrap(PhTrophy);
export const Unlink = wrap(LinkBreak);
export const Unplug = wrap(Plug);
export const Upload = wrap(PhUpload);
export const User = wrap(PhUser);
export const UserCheck = wrap(UserCircleCheck);
export const UserPlus = wrap(UserCirclePlus);
export const UserX = wrap(UserCircleMinus);
export const Users = wrap(UsersThree);
export const Video = wrap(PhVideo);
export const Wallet = wrap(PhWallet);
export const Wifi = wrap(WifiHigh, { weight: "bold" });
export const Wind = wrap(PhWind);
export const X = wrap(PhX, { weight: "bold" });
export const XCircleIcon = wrap(XCircle);
export const Zap = wrap(PhLightning);

// Re-export the X under the alias used by some files (`X as XIcon`).
export { X as XIcon };

// Default export kept for safety; lucide-react has no default but some bundlers complain.
export default {};
