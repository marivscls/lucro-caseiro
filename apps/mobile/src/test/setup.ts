import { vi } from "vitest";

// Mock react-native — Flow types can't be parsed by Rollup/Vite
vi.mock("react-native", () => ({
  Platform: {
    select: (opts: Record<string, unknown>) => opts.default ?? opts.android ?? "",
  },
  Alert: { alert: vi.fn() },
  View: ({ children }: { children?: React.ReactNode }) => children,
  Text: ({ children }: { children?: React.ReactNode }) => children,
  ScrollView: ({ children }: { children?: React.ReactNode }) => children,
  FlatList: () => null,
  Modal: ({ children }: { children?: React.ReactNode }) => children,
  Pressable: ({
    children,
    onPress: _onPress,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
  }) => children,
  TouchableOpacity: ({ children }: { children?: React.ReactNode }) => children,
  Image: () => null,
  ActivityIndicator: () => null,
  Switch: () => null,
  StyleSheet: { create: (s: unknown) => s },
  Dimensions: { get: () => ({ width: 375, height: 812 }) },
  useColorScheme: () => "dark",
  TurboModuleRegistry: { getEnforcing: () => ({}), get: () => null },
  NativeModules: {},
  NativeEventEmitter: vi.fn().mockImplementation(() => ({
    addListener: vi.fn(),
    removeListeners: vi.fn(),
  })),
}));

vi.mock("react-native/Libraries/Animated/NativeAnimatedHelper");

// Mock expo-router
vi.mock("expo-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  }),
  router: {
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  },
  Stack: {
    Screen: () => null,
  },
  useLocalSearchParams: () => ({}),
}));

// Mock react-native-safe-area-context
vi.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock @expo/vector-icons
vi.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

// Mock expo-modules-core (uses Flow types and __DEV__)
vi.mock("expo-modules-core", () => ({
  requireNativeModule: () => ({}),
  requireOptionalNativeModule: () => null,
  NativeModule: class {},
  NativeModulesProxy: {},
  EventEmitter: vi.fn(),
  Platform: { OS: "android", select: (opts: Record<string, unknown>) => opts.android },
}));

// Mock expo-image-picker (native SDK — skip in tests)
vi.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: vi.fn(),
  requestCameraPermissionsAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
  launchCameraAsync: vi.fn(),
}));

// Mock expo-notifications
vi.mock("expo-notifications", () => ({
  setNotificationHandler: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  getPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
  getExpoPushTokenAsync: vi.fn().mockResolvedValue({ data: "test-token" }),
  addNotificationReceivedListener: vi.fn().mockReturnValue({ remove: vi.fn() }),
  addNotificationResponseReceivedListener: vi.fn().mockReturnValue({ remove: vi.fn() }),
  AndroidImportance: { MAX: 5 },
}));

// Mock react-native-google-mobile-ads (native SDK — skip)
vi.mock("react-native-google-mobile-ads", () => ({}));

// Mock react-native-purchases (native SDK — skip)
vi.mock("react-native-purchases", () => ({}));

// Mock @react-native-async-storage/async-storage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock @react-native-community/netinfo
vi.mock("@react-native-community/netinfo", () => ({
  default: {
    addEventListener: vi.fn().mockReturnValue(vi.fn()),
  },
}));

// Mock @lucro-caseiro/ui
vi.mock("@lucro-caseiro/ui", () => ({
  Button: ({ children }: { children?: React.ReactNode }) => children,
  Card: ({ children }: { children?: React.ReactNode }) => children,
  Input: () => null,
  Typography: ({ children }: { children?: React.ReactNode }) => children,
  Badge: () => null,
  EmptyState: () => null,
  ThemeProvider: ({ children }: { children?: React.ReactNode }) => children,
  useTheme: () => ({
    theme: {
      colors: {
        background: "#1E1814",
        surface: "#2C2420",
        surfaceElevated: "#3A322D",
        text: "#F5EDE8",
        textSecondary: "#B8A9A0",
        textOnPrimary: "#FFFFFF",
        primary: "#C4707E",
        primaryLight: "#D4919C",
        primaryDark: "#A85A67",
        success: "#6BBF96",
        successBg: "#1A2E23",
        alert: "#E07272",
        alertBg: "#2E1A1A",
        premium: "#D4A054",
        premiumBg: "#2E2518",
      },
    },
    mode: "dark",
    toggleTheme: vi.fn(),
  }),
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
    "4xl": 40,
    "5xl": 48,
  },
  radii: { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 },
}));

// Mock @supabase/supabase-js
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  }),
}));
