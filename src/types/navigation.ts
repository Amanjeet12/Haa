import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: undefined;
  Location: undefined;
  Login: undefined;
  Pin: { phone: string };
  Home: NavigatorScreenParams<MainTabParamList> | undefined;
  OrderStatus: { success: boolean; orderNumber?: string; reason?: string };
  OrderTracking: { order: import('../api/orders').CustomerOrder };
  OrderProductDetails: { item: import('../api/orders').CustomerOrderItem; vendorName?: string };
  Settings: undefined;
  BookingDetails: { booking: import('../api/bookings').CustomerBooking };
  AppearancePreferences: undefined;
  FamilyMemberForm:
    | { member?: import('../api/familyMembers').FamilyMember }
    | undefined;
  Addresses: undefined;
  AddressForm:
    | { address?: import('../api/addresses').CustomerAddress }
    | undefined;
  Support: undefined;
  SupportRequests: undefined;
  SupportCreate:
    | { booking?: import('../api/bookings').CustomerBooking }
    | undefined;
  SupportDetail: { ticket: import('../api/support').SupportTicket };
};

export type MainTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeLanding: undefined;
  Search: undefined;
  Labs: undefined;
  QuickCommerce: undefined;
  FrequentlyBought: { category?: string } | undefined;
  FirstAid: undefined;
  ProductDetails: {
    product: {
      id: string;
      name: string;
      detail: string;
      price: number;
      oldPrice?: number;
      discount?: string;
      seller: string;
      vendorName?: string;
      image: number | string;
      description?: string;
      source?: 'ecommerce' | 'global';
      apiProduct?: boolean;
      estimatedDelivery?: string;
      sku?: string;
      unit?: string;
      weight?: string | null;
      weightUnit?: string | null;
      attributes?: import('../api/products').Product['attributes'];
      isInStock?: boolean;
    };
  };
  GlobalStore: undefined;
  CategoryProducts: { category: import('../api/productCategories').ProductCategory; mode?: 'quick'; subCategoryId?: number };
  WomensHealth: undefined;
  CitySearch: undefined;
  LabDetails: {
    lab: Lab;
    highlightTest?: {
      testId?: number;
      labTestId?: number;
      testName: string;
      testType?: 'individual_test' | 'health_package';
    };
  };
  AddPatientTests: { beneficiaryId: string };
  ReviewBooking: undefined;
  BookingSuccess: { bookingNo: string };
  BookingFailed: { bookingNo: string; reason?: string };
};
import type { Lab } from '../components/labs';
