export type RootStackParamList = {
  Onboarding: undefined;
  Location: undefined;
  Login: undefined;
  Pin: { phone: string };
  Home: undefined;
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
  SupportCreate:
    | { booking?: import('../api/bookings').CustomerBooking }
    | undefined;
  SupportDetail: { ticket: import('../api/support').SupportTicket };
};

export type MainTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Cart: undefined;
  Reports: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeLanding: undefined;
  Search: undefined;
  Labs: undefined;
  CitySearch: undefined;
  LabDetails: { lab: Lab };
  AddPatientTests: { beneficiaryId: string };
  ReviewBooking: undefined;
  BookingSuccess: { bookingNo: string };
  BookingFailed: { bookingNo: string; reason?: string };
};
import type { Lab } from '../components/labs';
