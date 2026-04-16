import { Icon } from "@/components/ui/icon";
import { cn } from "@/utils/cn";
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

export type TrackerStepState = "completed" | "in-progress" | "incomplete";

export type TrackerStep = {
  id: string;
  label: string;
  state: TrackerStepState;
  icon: LucideIcon;
};

type StatusTrackerProps = {
  steps: ReadonlyArray<TrackerStep>;
  className?: string;
};

/**
 * Vertical status tracker that visualizes completed, in-progress, and incomplete order steps.
 */
const StatusTracker = ({ steps, className }: StatusTrackerProps) => {
  return (
    <View className={cn("gap-5", className)}>
      {steps.map((step) => {
        const isCompleted = step.state === "completed";
        const isInProgress = step.state === "in-progress";

        return (
          <View key={step.id} className="flex-row items-center gap-3">
            <View
              className={cn(
                "h-11 w-11 items-center justify-center rounded-full",
                isCompleted && "bg-green-600",
                isInProgress && "bg-primary",
                !isCompleted && !isInProgress && "bg-muted",
              )}
            >
              <Icon
                as={step.icon}
                size={20}
                className={cn(
                  isCompleted && "text-white",
                  isInProgress && "text-primary-foreground",
                  !isCompleted && !isInProgress && "text-muted-foreground",
                )}
              />
            </View>

            <Text
              className={cn(
                "text-lg font-semibold",
                isCompleted && "text-green-600",
                isInProgress && "text-primary",
                !isCompleted && !isInProgress && "text-muted-foreground",
              )}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export default StatusTracker;
