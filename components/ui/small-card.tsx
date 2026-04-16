import { Href, Link } from "expo-router";
import { ChevronRight, LucideIcon } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { Icon } from "./icon";

type SmallCardAccent = "blue" | "green" | "purple" | "red" | "yellow";

type SmallCardProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  pressable: boolean;
  href?: Href;
  rightText?: string;
  iconAccent: SmallCardAccent;
};

const accentStyles: Record<SmallCardAccent, { bg: string; icon: string }> = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600" },
  green: { bg: "bg-green-50", icon: "text-green-600" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600" },
  red: { bg: "bg-red-50", icon: "text-red-600" },
  yellow: { bg: "bg-yellow-50", icon: "text-yellow-600" },
};

/**
 * Compact list card with optional navigation and accent color variants.
 */
const SmallCard = ({
  title,
  subtitle,
  icon,
  pressable,
  href,
  rightText,
  iconAccent,
}: SmallCardProps) => {
  const { bg, icon: iconClassName } =
    accentStyles[iconAccent] ?? accentStyles.blue;

  if (pressable && href) {
    return (
      <Link href={href} asChild>
        <Pressable className="w-full flex-row items-center gap-3 rounded-2xl bg-card px-2.5 py-3 border border-border">
          <View className={`${bg} rounded-full p-2`}>
            <Icon size={22} className={iconClassName} as={icon} />
          </View>

          <View className="flex-col gap-1.5 flex-1">
            <Text className="text-md font-medium">{title}</Text>
            <Text className="text-sm text-gray-500">{subtitle}</Text>
          </View>

          {rightText ? (
            <Text className="text-sm font-medium text-muted-foreground">
              {rightText}
            </Text>
          ) : (
            <Icon
              as={ChevronRight}
              className="text-muted-foreground"
              size={20}
            />
          )}
        </Pressable>
      </Link>
    );
  } else {
    return (
      <Pressable className="w-full flex-row items-center gap-3 rounded-2xl bg-card px-2.5 py-3 border border-border">
        <View className={`${bg} rounded-full p-2`}>
          <Icon size={22} className={iconClassName} as={icon} />
        </View>

        <View className="flex-col gap-1.5 flex-1">
          <Text className="text-md font-medium">{title}</Text>
          <Text className="text-sm text-gray-500">{subtitle}</Text>
        </View>
      </Pressable>
    );
  }
};

export default SmallCard;
