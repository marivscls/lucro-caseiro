import { Stack } from "expo-router";
import React from "react";

import FinanceTab from "./tabs/finance";

export default function FinanceScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <FinanceTab />
    </>
  );
}
