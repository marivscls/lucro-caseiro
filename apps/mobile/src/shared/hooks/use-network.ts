import NetInfo from "@react-native-community/netinfo";
import { create } from "zustand";

interface NetworkState {
  isOnline: boolean;
}

export const useNetwork = create<NetworkState>(() => ({
  isOnline: true,
}));

NetInfo.addEventListener((state) => {
  useNetwork.setState({
    isOnline: state.isConnected !== false,
  });
});
