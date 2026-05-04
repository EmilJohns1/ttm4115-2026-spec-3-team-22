import { Icon } from "@/components/ui/icon";
import SmallCard from "@/components/ui/small-card";
import { useAuth } from "@/context/auth-context";
import { useUserDetailsQuery } from "@/services/user-service";
import { Link, type Href } from "expo-router";
import { Bell, CreditCard, LogOut, MapPin, User } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Profile tab for account overview and account actions.
 */
const ProfileTab = () => {
  const { user, signOut } = useAuth();
  const userDetailsQuery = useUserDetailsQuery();

  const initials = useMemo(() => {
    const name = user?.name?.trim();
    if (!name) {
      return "U";
    }

    return name[0]?.toUpperCase() ?? "U";
  }, [user?.name]);

  const addressSubtitle = useMemo(() => {
    const d = userDetailsQuery.data;
    if (d?.street_address && d?.city) {
      return `${d.street_address}, ${d.city}`;
    }
    return "No address saved";
  }, [userDetailsQuery.data]);

  return (
    <SafeAreaView edges={[]} className="flex-1">
      <View className="bg-primary rounded-b-2xl pt-safe-offset-3 px-5 pb-8 gap-4">
        <View className="flex-row gap-4">
          <View className="bg-background size-16 rounded-full items-center justify-center">
            <Text className="text-2xl font-extrabold text-primary">
              {initials}
            </Text>
          </View>
          <View className="flex-col justify-center gap-1">
            <Text className="text-primary-foreground font-extrabold text-3xl">
              {user?.name ?? "Guest"}
            </Text>
            <Text className="text-primary-foreground text-md">
              {user?.email ?? "No email"}
            </Text>
          </View>
        </View>
        <Link href={"/editProfile"} asChild>
          <Pressable className="bg-background rounded-xl py-1.5">
            <Text className="text-center font-semibold">Edit Profile</Text>
          </Pressable>
        </Link>
      </View>
      <View className="flex-1 my-6 px-5 justify-between ">
        <View>
          <Text className="font-semibold text-xl">Account settings</Text>
          <View className="gap-3 my-3">
            <SmallCard
              title="Personal Information"
              subtitle="Update your name and email"
              icon={User}
              iconAccent="blue"
              pressable
              href={"/editPersonalInfo" as Href}
            />
            <SmallCard
              title="Delivery Address"
              subtitle={addressSubtitle}
              icon={MapPin}
              iconAccent="green"
              pressable
              href={"/editDeliveryAddress" as Href}
            />
            <SmallCard
              title="Payment methods"
              subtitle="Manage saved cards"
              icon={CreditCard}
              iconAccent="purple"
              pressable
              href={"/paymentMethods" as any}
            />
          </View>
          <Text className="font-semibold text-xl">Preferences</Text>
          <View className="my-3 gap-3">
            <SmallCard
              title="Notifications"
              subtitle="Push notifications enabled"
              icon={Bell}
              iconAccent="yellow"
              pressable
            />
          </View>
        </View>
        <Pressable
          onPress={() => {
            void signOut();
          }}
          className="flex-row items-center gap-2 bg-background rounded-2xl px-2.5 py-3 border border-border"
        >
          <View className="p-2 bg-red-50 rounded-full">
            <Icon as={LogOut} size={22} className="text-red-600" />
          </View>
          <Text className="text-red-600">Log Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default ProfileTab;
