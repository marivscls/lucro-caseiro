declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    EXPO_PUBLIC_AUTH_REDIRECT_URL?: string;
    [key: string]: string | undefined;
  };
};

// Static image assets imported via `import x from "./x.png"` (Metro asset).
declare module "*.png" {
  const content: number;
  export default content;
}
