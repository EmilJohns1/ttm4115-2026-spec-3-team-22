import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const EditProfilePage = () => {
  return (
    <View className="flex-1 pb-safe">
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        className="flex-1 px-5"
        contentContainerClassName="pt-4"
      >
        <View className="my-1 mt-5">
          <Text className="mb-3 uppercase tracking-wide font-medium">
            Personal information
          </Text>
          <View className="border border-border rounded-2xl bg-background">
            <View className="border-b border-input px-5 py-3">
              <Text>First name</Text>
              <TextInput
                placeholder="Andreas"
                className="px-0 mx-0 font-medium"
              />
            </View>
            <View className="px-5 border-b border-input py-3">
              <Text>Last name</Text>
              <TextInput
                placeholder="Gjersøe"
                className="px-0 mx-0 font-medium"
              />
            </View>
            <View className="px-5 py-3">
              <Text>Email</Text>
              <TextInput
                placeholder="andreas.gjersoe@hotmail.no"
                className="px-0 mx-0 font-medium"
              />
            </View>
          </View>
        </View>
        <View className="py-3">
          <Text className="mb-3 uppercase tracking-wide font-medium">
            Delivery address
          </Text>
          <View className="border border-border rounded-2xl bg-background">
            <View className="border-b border-input px-5 py-3">
              <Text>Street address</Text>
              <TextInput
                placeholder="Sunnlandsvegen 35"
                className="px-0 mx-0 font-medium"
              />
            </View>
            <View className="flex-row">
              <View className="px-5 border-b border-input py-3 flex-1">
                <Text>City</Text>
                <TextInput
                  placeholder="Trondheim"
                  className="px-0 mx-0 font-medium"
                />
              </View>
              <View className="px-5 border-b border-input py-3 pr-10">
                <Text>Postal code</Text>
                <TextInput
                  placeholder="7032"
                  className="px-0 mx-0 font-medium"
                />
              </View>
            </View>
            <View className="px-5 py-3">
              <Text>Country</Text>
              <TextInput
                placeholder="Norway"
                placeholderClassName="font-bold"
                className="px-0 mx-0 font-medium"
              />
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <View className="gap-3 px-5 pb-4">
        <Pressable className="bg-blue-500 py-5 rounded-2xl">
          <Text className="text-center text-white font-semibold">
            Save changes
          </Text>
        </Pressable>
        <Pressable className="py-5 rounded-2xl border border-border bg-background">
          <Text className="text-center font-medium">Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default EditProfilePage;
