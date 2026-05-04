import { Icon } from "@/components/ui/icon";
import { cn } from "@/utils/cn";
import { Href, Link } from "expo-router";
import { type LucideIcon } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

type QuickActionProps = {
  title: string;
  icon: LucideIcon;
  className?: string;
  href: Href;
};

/**
 * Quick action card with a configurable icon, title, and container styles.
 */
const QuickAction = ({ title, icon, className, href }: QuickActionProps) => {
  return (
    <Link href={href} asChild>
      <Pressable
        className={cn(
          "min-h-24 flex-1 justify-between rounded-2xl bg-card p-4",
          className,
        )}
      >
        <View className="gap-4">
          <Icon as={icon} size={28} className="text-primary-foreground" />
          <Text className="mt-3 text-lg font-medium text-primary-foreground">
            {title}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
};

export default QuickAction;
