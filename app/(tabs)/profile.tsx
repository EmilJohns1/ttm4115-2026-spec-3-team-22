import { Icon } from "@/components/ui/icon";
import SmallCard from "@/components/ui/small-card";
import {
  Bell,
  CreditCard,
  Lock,
  LogOut,
  MapPin,
  User,
} from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfileTab = () => {
  return (
    <SafeAreaView edges={[]} className="flex-1">
      <View className="bg-primary rounded-xl pt-safe-offset-3 px-5 pb-8 gap-4">
        <View className="flex-row gap-4">
          <View className="bg-background p-4 rounded-full">
            <Icon as={User} size={34} className="text-primary" />
          </View>
          <View className="flex-col justify-center gap-1">
            <Text className="text-primary-foreground font-extrabold text-3xl">
              John Doe
            </Text>
            <Text className="text-primary-foreground text-md">
              john.doe@example.com
            </Text>
          </View>
        </View>
        <Pressable className="bg-background rounded-xl py-1.5">
          <Text className="text-center font-semibold">Edit Profile</Text>
        </Pressable>
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
            />
            <SmallCard
              title="Delivery Address"
              subtitle="Sunnlandsvegen 35, Trondheim"
              icon={MapPin}
              iconAccent="green"
              pressable
            />
            <SmallCard
              title="Payment methods"
              subtitle="•••• 4242"
              icon={CreditCard}
              iconAccent="purple"
              pressable
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
            <SmallCard
              title="Change Password"
              subtitle="Update your password"
              icon={Lock}
              iconAccent="red"
              pressable
            />
          </View>
        </View>
        <Pressable className="flex-row items-center gap-2 bg-background rounded-2xl px-2.5 py-3 border border-border">
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
