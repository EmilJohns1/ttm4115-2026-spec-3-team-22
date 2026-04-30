export type OrderStatus =
  | "pending"
  | "confirmed"
  | "dispatched"
  | "completed"
  | "cancelled"
  | "unknown";

type OrderStatusMeta = {
  label: string;
};

const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  pending: {
    label: "Pending Payment",
  },
  confirmed: {
    label: "Confirmed",
  },
  dispatched: {
    label: "Drone Dispatched",
  },
  completed: {
    label: "Delivered",
  },
  cancelled: {
    label: "Cancelled",
  },
  unknown: { label: "Unknown Status" },
};

/**
 * Returns a normalized order status value for known backend statuses.
 */
export function normalizeOrderStatus(status: string): OrderStatus {
  if (status in ORDER_STATUS_META) {
    return status as OrderStatus;
  }

  return "unknown";
}

/**
 * Returns shared UI metadata for order status labels and colors.
 */
export function getOrderStatusMeta(status: string): OrderStatusMeta {
  const normalizedStatus = normalizeOrderStatus(status);
  return ORDER_STATUS_META[normalizedStatus];
}
