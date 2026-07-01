import { create } from "zustand";

interface NetworkState {
  isOnline: boolean;
}

type NetInfoState = { isConnected: boolean | null };
type NetInfoModule = {
  addEventListener: (listener: (state: NetInfoState) => void) => () => void;
};

export const useNetwork = create<NetworkState>(() => ({
  isOnline: true,
}));

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy native load keeps stale dev builds from crashing on startup.
  const mod = require("@react-native-community/netinfo") as {
    default?: NetInfoModule;
    addEventListener?: unknown;
  };
  const NetInfo =
    mod.default ??
    (typeof mod.addEventListener === "function" ? (mod as NetInfoModule) : null);

  NetInfo?.addEventListener((state) => {
    useNetwork.setState({
      isOnline: state.isConnected !== false,
    });
  });
} catch {
  useNetwork.setState({ isOnline: true });
}
