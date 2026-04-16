import { Link, type Href } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/utils/cn";

type DeliveryItemProps = {
  title: string;
  status: string;
  imageUrl?: string;
  subtitle?: string;
  footerLeft?: string;
  footerRight?: string;
  href?: Href;
  showChevron?: boolean;
  statusDotClassName?: string;
  statusTextClassName?: string;
  className?: string;
};

/**
 * Delivery list card with product image, title, and status.
 */
const MediumCard = ({
  title,
  status,
  imageUrl,
  subtitle,
  footerLeft,
  footerRight,
  href = "/auth/login",
  showChevron = true,
  statusDotClassName,
  statusTextClassName,
  className,
}: DeliveryItemProps) => {
  const imageSource: ImageSourcePropType = imageUrl?.trim()
    ? { uri: imageUrl }
    : require("../../assets/images/react-logo.png");
  const shouldShowChevron = Boolean(href) && showChevron;

  const cardContent = (
    <>
      <Image
        source={imageSource}
        className="h-20 w-20 rounded-2xl"
        resizeMode="contain"
      />

      <View className="ml-4 flex-1">
        <Text className="text-xl font-medium text-foreground">{title}</Text>

        {subtitle ? (
          <Text className="mt-1 text-sm text-muted-foreground">{subtitle}</Text>
        ) : null}

        <View className="mt-2 flex-row items-center">
          <View
            className={cn(
              "h-2.5 w-2.5 rounded-full bg-green-500",
              statusDotClassName,
            )}
          />
          <Text
            className={cn(
              "ml-2 text-md font-medium text-green-500",
              statusTextClassName,
            )}
          >
            {status}
          </Text>
        </View>

        {footerLeft || footerRight ? (
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">{footerLeft}</Text>
            <Text className="text-sm font-semibold text-foreground">
              {footerRight}
            </Text>
          </View>
        ) : null}
      </View>

      {shouldShowChevron ? (
        <Icon as={ChevronRight} className="text-muted-foreground" size={24} />
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        <Pressable
          className={cn(
            "w-full flex-row items-center rounded-3xl border border-border bg-card px-4 py-4",
            className,
          )}
        >
          {cardContent}
        </Pressable>
      </Link>
    );
  }

  return (
    <View
      className={cn(
        "w-full flex-row items-center rounded-3xl border border-border bg-card px-4 py-4",
        className,
      )}
    >
      {cardContent}
    </View>
  );
};

export default MediumCard;
