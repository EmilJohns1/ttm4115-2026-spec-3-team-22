import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const login = () => {
  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-background justify-between"
    ></SafeAreaView>
  );
};

export default login;
