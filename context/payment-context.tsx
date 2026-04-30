import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";

type PaymentContextValue = {
  publishableKey: string | null;
  setPublishableKey: (key: string | null) => void;
};

const PaymentContext = createContext<PaymentContextValue | undefined>(
  undefined,
);

/**
 * Payment provider for sharing Stripe publishable key configuration.
 */
export function PaymentProvider({ children }: PropsWithChildren) {
  const [publishableKey, setPublishableKey] = useState<string | null>(null);

  const value = useMemo<PaymentContextValue>(
    () => ({ publishableKey, setPublishableKey }),
    [publishableKey],
  );

  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  );
}

/**
 * Returns the payment configuration context.
 */
export function usePaymentConfig() {
  const context = useContext(PaymentContext);

  if (!context) {
    throw new Error("usePaymentConfig must be used inside PaymentProvider");
  }

  return context;
}
