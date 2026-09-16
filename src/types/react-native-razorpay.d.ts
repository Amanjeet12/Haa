declare module 'react-native-razorpay' {
  type CheckoutOptions = {
    key: string;
    amount: number | string;
    currency: string;
    order_id: string;
    name: string;
    description?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color?: string };
  };
  type PaymentSuccess = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };
  type PaymentFailure = { code?: number | string; description?: string };
  const RazorpayCheckout: {
    open(options: CheckoutOptions): Promise<PaymentSuccess>;
  };
  export default RazorpayCheckout;
  export type { PaymentFailure, PaymentSuccess };
}
