import { Href, Link } from "expo-router";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  Text,
  View,
} from "react-native";

type LargeCardProps = {
  title: string;
  subtitle: string;
  imageUrl?: string;
  href: Href;
};

/**
 * Product card with a fixed-height image region to keep card layouts consistent.
 */
const LargeCard = ({ title, subtitle, imageUrl, href }: LargeCardProps) => {
  const imageSource: ImageSourcePropType = imageUrl?.trim()
    ? { uri: imageUrl }
    : require("../../assets/images/partial-react-logo.png");

  return (
    <Link href={href} asChild>
      <Pressable className="flex-1 w-full overflow-hidden rounded-2xl border border-border bg-card">
        <View className="h-32 w-full">
          <Image
            source={imageSource}
            resizeMode="cover"
            className="h-full w-full"
          />
        </View>

        <View className="flex-1 gap-1 p-3">
          <Text className="text-lg font-semibold">{title}</Text>
          <Text className="text-primary font-medium">{subtitle}</Text>
        </View>
      </Pressable>
    </Link>
  );
};

export default LargeCard;
