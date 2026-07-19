/**
 * AppIcon — camada única de ícones do app, padronizada em Lucide.
 *
 * Os nomes seguem o vocabulário legado do Ionicons para facilitar a migração,
 * mas cada nome resolve para um componente Lucide (lucide-react-native).
 * Ícones de marca (Google, WhatsApp) não existem no Lucide e são desenhados
 * aqui como SVGs dedicados.
 */
import type { ComponentType } from "react";
import {
  AlarmClock,
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  BadgePercent,
  Balloon,
  Banknote,
  Barcode,
  Bell,
  BellOff,
  BookOpen,
  Building2,
  Calculator,
  Calendar,
  CalendarDays,
  Camera,
  Car,
  ChartColumn,
  ChartLine,
  ChartPie,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  CircleAlert,
  CircleArrowDown,
  CircleArrowUp,
  CircleCheck,
  CircleCheckBig,
  CircleDot,
  CircleEllipsis,
  CircleHelp,
  CirclePlay,
  CirclePlus,
  CircleQuestionMark,
  CircleUser,
  CircleX,
  Clipboard,
  Clock,
  CloudOff,
  CloudUpload,
  CreditCard,
  Delete,
  Download,
  Dumbbell,
  Ellipsis,
  EllipsisVertical,
  ExternalLink,
  Eye,
  EyeOff,
  FilePlus2,
  FileText,
  FlaskConical,
  Flame,
  Funnel,
  Gem,
  Gift,
  Globe,
  Heart,
  House,
  IceCreamCone,
  Image,
  Images,
  Inbox,
  Info,
  LayoutGrid,
  Leaf,
  Lightbulb,
  Link,
  List,
  LocateFixed,
  Lock,
  LockOpen,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  PackageCheck,
  Palette,
  Pencil,
  Phone,
  Pizza,
  Plus,
  QrCode,
  Receipt,
  RefreshCw,
  Repeat,
  Rocket,
  RotateCw,
  Salad,
  Save,
  Scale,
  ScanLine,
  Search,
  Settings,
  Share,
  Share2,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Square,
  SquareCheck,
  SquarePen,
  Star,
  Store,
  Sun,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Trophy,
  User,
  UserPlus,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
  Zap,
  type LucideIcon,
  type LucideProps,
} from "lucide-react-native";
import Svg, { Path } from "react-native-svg";

type BrandIconProps = Readonly<{
  size?: number;
  color?: string;
}>;

/** Logotipo do Google (marca — sem equivalente Lucide). */
export function GoogleIcon({ size = 24 }: BrandIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <Path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </Svg>
  );
}

/** Logotipo do WhatsApp (marca — sem equivalente Lucide). */
export function WhatsappIcon({ size = 24, color = "#FFFFFF" }: BrandIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"
      />
    </Svg>
  );
}

type AnyIconComponent = LucideIcon | ComponentType<BrandIconProps>;

/**
 * Mapeamento dos nomes legados (Ionicons) para os componentes Lucide.
 * O sufixo "-outline" do Ionicons desaparece: Lucide é outline por padrão.
 */
const APP_ICON_COMPONENTS = {
  add: Plus,
  "add-circle": CirclePlus,
  "add-circle-outline": CirclePlus,
  "add-outline": Plus,
  alarm: AlarmClock,
  "albums-outline": Images,
  "alert-circle": CircleAlert,
  "alert-circle-outline": CircleAlert,
  "analytics-outline": ChartLine,
  "apps-outline": LayoutGrid,
  "arrow-back": ArrowLeft,
  "arrow-down": ArrowDown,
  "arrow-down-circle-outline": CircleArrowDown,
  "arrow-forward": ArrowRight,
  "arrow-up": ArrowUp,
  "arrow-up-circle-outline": CircleArrowUp,
  "backspace-outline": Delete,
  "bag-check-outline": PackageCheck,
  "bag-handle-outline": ShoppingBag,
  "balloon-outline": Balloon,
  "bar-chart": ChartColumn,
  "bar-chart-outline": ChartColumn,
  "barbell-outline": Dumbbell,
  "barcode-outline": Barcode,
  "basket-outline": ShoppingBasket,
  "beaker-outline": FlaskConical,
  "bulb-outline": Lightbulb,
  business: Building2,
  "business-outline": Building2,
  "calculator-outline": Calculator,
  calendar: Calendar,
  "calendar-clear-outline": Calendar,
  "calendar-outline": Calendar,
  call: Phone,
  "call-outline": Phone,
  camera: Camera,
  "camera-outline": Camera,
  "car-outline": Car,
  card: CreditCard,
  "card-outline": CreditCard,
  "cart-outline": ShoppingCart,
  cash: Banknote,
  "cash-outline": Banknote,
  "chatbubble-ellipses-outline": MessageCircle,
  checkbox: SquareCheck,
  checkmark: Check,
  "checkmark-circle": CircleCheck,
  "checkmark-circle-outline": CircleCheck,
  "checkmark-done-circle": CircleCheckBig,
  "checkmark-done-outline": CheckCheck,
  "checkmark-outline": Check,
  "chevron-back": ChevronLeft,
  "chevron-down": ChevronDown,
  "chevron-forward": ChevronRight,
  "chevron-up": ChevronUp,
  "clipboard-outline": Clipboard,
  close: X,
  "close-circle": CircleX,
  "close-outline": X,
  "cloud-offline-outline": CloudOff,
  "cloud-upload-outline": CloudUpload,
  "color-palette-outline": Palette,
  create: SquarePen,
  "create-outline": SquarePen,
  "cube-outline": Package,
  diamond: Gem,
  "diamond-outline": Gem,
  "document-attach-outline": FilePlus2,
  "document-text-outline": FileText,
  "download-outline": Download,
  "ellipse-outline": Circle,
  "ellipsis-horizontal": Ellipsis,
  "ellipsis-horizontal-circle-outline": CircleEllipsis,
  "ellipsis-vertical": EllipsisVertical,
  "eye-off-outline": EyeOff,
  "eye-outline": Eye,
  "file-tray-outline": Inbox,
  "filter-outline": Funnel,
  "flame-outline": Flame,
  "flash-outline": Zap,
  "flask-outline": FlaskConical,
  funnel: Funnel,
  "funnel-outline": Funnel,
  "gift-outline": Gift,
  "globe-outline": Globe,
  "grid-outline": LayoutGrid,
  heart: Heart,
  "help-circle-outline": CircleQuestionMark,
  home: House,
  "home-outline": House,
  "ice-cream-outline": IceCreamCone,
  "image-outline": Image,
  "information-circle-outline": Info,
  "leaf-outline": Leaf,
  "link-outline": Link,
  list: List,
  "locate-outline": LocateFixed,
  "location-outline": MapPin,
  "lock-closed": Lock,
  "lock-closed-outline": Lock,
  "lock-open-outline": LockOpen,
  "log-out-outline": LogOut,
  "logo-google": GoogleIcon,
  "logo-whatsapp": WhatsappIcon,
  "mail-outline": Mail,
  "notifications-off-outline": BellOff,
  "notifications-outline": Bell,
  "nutrition-outline": Salad,
  "open-outline": ExternalLink,
  "options-outline": SlidersHorizontal,
  "people-outline": Users,
  "pencil-outline": Pencil,
  "person-add-outline": UserPlus,
  "person-circle-outline": CircleUser,
  "person-outline": User,
  "phone-portrait-outline": Smartphone,
  "pie-chart-outline": ChartPie,
  "pizza-outline": Pizza,
  "play-circle-outline": CirclePlay,
  "pricetag-outline": Tag,
  "qr-code-outline": QrCode,
  "radio-button-off": Circle,
  "radio-button-on": CircleDot,
  "reader-outline": BookOpen,
  "receipt-outline": Receipt,
  refresh: RefreshCw,
  remove: Minus,
  "repeat-outline": Repeat,
  "restaurant-outline": UtensilsCrossed,
  "rocket-outline": Rocket,
  "save-outline": Save,
  "scale-outline": Scale,
  "scan-outline": ScanLine,
  search: Search,
  "search-outline": Search,
  "settings-outline": Settings,
  "share-outline": Share,
  "share-social-outline": Share2,
  "shield-checkmark-outline": ShieldCheck,
  sparkles: Sparkles,
  "sparkles-outline": Sparkles,
  "square-outline": Square,
  star: Star,
  "stats-chart": ChartColumn,
  "storefront-outline": Store,
  "sunny-outline": Sun,
  "swap-horizontal-outline": ArrowLeftRight,
  "sync-circle-outline": RotateCw,
  "time-outline": Clock,
  "today-outline": CalendarDays,
  "trash-outline": Trash2,
  "trending-down-outline": TrendingDown,
  "trending-up": TrendingUp,
  "trending-up-outline": TrendingUp,
  "trophy-outline": Trophy,
  "wallet-outline": Wallet,
  warning: TriangleAlert,
  "warning-outline": TriangleAlert,
  "shirt-outline": Shirt,
  "pricetags-outline": Tag,
  "help-circle": CircleQuestionMark,
  "close-circle-outline": CircleX,
  "add-circle-sharp": CirclePlus,
  "checkmark-circle-sharp": CircleCheck,
  "information-circle": Info,
  "alert-circle-sharp": CircleAlert,
  "percent-outline": BadgePercent,
  "help-buoy-outline": CircleHelp,
  "cloud-done-outline": CloudUpload,
} as const satisfies Record<string, AnyIconComponent>;

export type AppIconName = keyof typeof APP_ICON_COMPONENTS;

export type AppIconProps = Readonly<
  Omit<LucideProps, "name"> & {
    name: AppIconName;
    size?: number;
    color?: string;
  }
>;

/**
 * Ícone padrão do app. Substitui `<Ionicons name=... />` mantendo as props
 * `name`/`size`/`color`, mas renderizando o equivalente Lucide.
 */
export function AppIcon({ name, size = 24, color = "#000000", ...rest }: AppIconProps) {
  const Component =
    (APP_ICON_COMPONENTS as Record<string, AnyIconComponent>)[name] ?? CircleAlert;
  return <Component size={size} color={color} {...rest} />;
}
