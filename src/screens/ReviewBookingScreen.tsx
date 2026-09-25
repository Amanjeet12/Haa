import { formatINR } from '../utils/currency';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import FlaskConical from 'lucide-react-native/icons/flask-conical';
import MapPin from 'lucide-react-native/icons/map-pin';
import Plus from 'lucide-react-native/icons/plus';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Star from 'lucide-react-native/icons/star';
import Trash from 'lucide-react-native/icons/trash';
import WandSparkles from 'lucide-react-native/icons/wand-sparkles';
import UserRound from 'lucide-react-native/icons/user-round';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout, { PaymentFailure } from 'react-native-razorpay';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AppText } from '../components';
import {
  addressLine,
  addressTitle,
  CustomerAddress,
  getCustomerAddresses,
} from '../api/addresses';
import { getLabSlots, LabSlot } from '../api/labSlots';
import { createBooking } from '../api/bookings';
import { getRecommendedLabs, RecommendedLab } from '../api/recommendedLabs';
import {
  getFamilyMembers,
  FamilyMember,
  normalizeProfilePhoto,
} from '../api/familyMembers';
import { FamilyMembersSheet } from '../components/booking/FamilyMembersSheet';
import { AddressesSheet } from '../components/booking/AddressesSheet';
import { useAppDispatch, useAppSelector } from '../store';
import {
  assignTestBeneficiaries,
  CartBeneficiary,
  CartTest,
  clearCart,
  initializeCartFamilyMember,
  removeCartBeneficiary,
  removeTestFromCart,
  removeTestForBeneficiary,
  setCartBeneficiaryTarget,
  switchCartLab,
  upsertCartBeneficiary,
} from '../store/cartSlice';
import { requestBookingLogin } from '../store/authSlice';
import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';
import { HomeStackParamList, RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'ReviewBooking'>;

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatSlotTime(value: string) {
  const [hourText, minute = '00'] = value.split(':');
  const hour = Number(hourText);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${String(hour % 12 || 12).padStart(2, '0')}:${minute} ${suffix}`;
}

function slotLabel(slot: LabSlot) {
  return `${formatSlotTime(slot.start_time)}–${formatSlotTime(slot.end_time)}`;
}

function slotStartHasPassed(slot: LabSlot, now = new Date()) {
  const [year, month, day] = slot.booking_date.split('-').map(Number);
  const [hour, minute, second] = slot.start_time.split(':').map(Number);
  const start = new Date(year, month - 1, day, hour, minute, second || 0);
  return start.getTime() <= now.getTime();
}

function isSlotBookable(slot: LabSlot) {
  return slot.is_available && !slotStartHasPassed(slot);
}

export function ReviewBookingScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const cart = useAppSelector(state => state.cart);
  const customer = useAppSelector(state => state.auth.session?.customer);
  const authToken = useAppSelector(state => state.auth.session?.token);
  const zone = useAppSelector(state => state.zones.selected);
  const [selectedMembers] = useState<FamilyMember[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [membersOpen, setMembersOpen] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [returnToMembers, setReturnToMembers] = useState(false);
  const patientId = customer ? String(customer.customer_id) : 'guest-primary';
  const patientName = customer?.name ?? 'Primary patient';
  const [selectedDay, setSelectedDay] = useState(0);
  const [slots, setSlots] = useState<LabSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [addressesOpen, setAddressesOpen] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [returnToAddresses, setReturnToAddresses] = useState(false);
  const [recommendation, setRecommendation] = useState<RecommendedLab | null>(
    null,
  );
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const total = cart.items.reduce(
    (sum, item) =>
      sum +
      Number(item.labTest.offer_price) *
        Math.max(item.beneficiaryIds.length, 1),
    0,
  );
  const bookingPatients = cart.familyInitialized ? cart.beneficiaries : [];
  const selectedMemberIds = useMemo(
    () =>
      new Set(
        cart.beneficiaries
          .filter(beneficiary => beneficiary.id.startsWith('member-'))
          .map(beneficiary => Number(beneficiary.id.replace('member-', ''))),
      ),
    [cart.beneficiaries],
  );
  const unavailableMemberIds = useMemo(
    () => [...selectedMemberIds],
    [selectedMemberIds],
  );
  const dates = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index);
        return date;
      }),
    [],
  );
  const selectedBookingDate = toLocalDateKey(dates[selectedDay]);
  const selectedTestIds = useMemo(
    () => [...new Set(cart.items.map(item => item.labTest.test_id))],
    [cart.items],
  );
  const selectedTestIdsKey = selectedTestIds.join(',');
  const currentSelectionPrice = cart.items.reduce(
    (sum, item) => sum + Number(item.labTest.offer_price),
    0,
  );

  useEffect(() => {
    if (!zone?.zone_id || !cart.labId || !selectedTestIdsKey) {
      setRecommendation(null);
      return;
    }
    let active = true;
    setRecommendation(null);
    getRecommendedLabs(
      zone.zone_id,
      cart.labId,
      selectedTestIdsKey.split(',').map(Number),
    )
      .then(labs => {
        if (!active) return;
        const alternatives = labs.filter(
          lab =>
            lab.lab_id !== cart.labId &&
            lab.total_test_final_amount < currentSelectionPrice,
        );
        const best = alternatives.sort(
          (a, b) => a.total_test_final_amount - b.total_test_final_amount,
        )[0];
        setRecommendation(best ?? null);
      })
      .catch(() => {
        if (active) setRecommendation(null);
      });
    return () => {
      active = false;
    };
  }, [cart.labId, currentSelectionPrice, selectedTestIdsKey, zone?.zone_id]);

  useEffect(() => {
    if (!cart.labId) {
      setSlots([]);
      setSelectedSlotId(null);
      return;
    }
    let active = true;
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlotId(null);
    getLabSlots(cart.labId, selectedBookingDate)
      .then(fetchedSlots => {
        if (!active) return;
        const activeSlots = fetchedSlots.filter(slot => slot.isActive);
        setSlots(activeSlots);
        setSelectedSlotId(activeSlots.find(isSlotBookable)?.slot_id ?? null);
      })
      .catch(error => {
        if (!active) return;
        setSlots([]);
        setSlotsError(
          error instanceof Error ? error.message : 'Unable to load slots.',
        );
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [cart.labId, selectedBookingDate]);

  const loadAddresses = useCallback(async () => {
    if (!authToken) {
      setAddresses([]);
      setSelectedAddressId(null);
      return;
    }
    setAddressesLoading(true);
    try {
      const fetchedAddresses = (await getCustomerAddresses(authToken)).filter(item => Boolean(item.billing_address));
      setAddresses(fetchedAddresses);
      setSelectedAddressId(currentId => {
        if (fetchedAddresses.some(item => item.address_id === currentId)) {
          return currentId;
        }
        const preferred =
          fetchedAddresses.find(item => item.billing_address?.isDefault) ??
          fetchedAddresses[0];
        return preferred?.address_id ?? null;
      });
    } catch {
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const selectedAddress =
    addresses.find(item => item.address_id === selectedAddressId) ?? null;

  const goToLogin = () => {
    dispatch(requestBookingLogin());
    navigation
      .getParent()
      ?.getParent<NativeStackNavigationProp<RootStackParamList>>()
      ?.navigate('Login');
  };

  const runAuthenticatedAction = (action: () => void) => {
    if (!authToken) {
      goToLogin();
      return;
    }
    action();
  };

  const proceedToPayment = async () => {
    if (!authToken || !customer) {
      goToLogin();
      return;
    }
    if (!selectedSlotId) {
      setBookingError('Select an available collection slot.');
      return;
    }
    if (!selectedAddress?.billing_address) {
      setBookingError('Select a collection address.');
      return;
    }

    const items = cart.items.flatMap(item =>
      item.beneficiaryIds.map(beneficiaryId => ({
        lab_test_id: item.labTest.lab_test_id,
        slot_id: selectedSlotId,
        family_member_id: beneficiaryId.startsWith('member-')
          ? Number(beneficiaryId.slice('member-'.length))
          : Number.NaN,
      })),
    );
    if (!items.length || items.some(item => !item.family_member_id)) {
      setBookingError('Select a saved patient for every test.');
      return;
    }

    const details = selectedAddress.billing_address;
    const location = details.location;
    const lat = location?.latitude ?? location?.lat;
    const lng = location?.longitude ?? location?.lng;
    if (lat === undefined || lng === undefined) {
      setBookingError('The selected address is missing map coordinates.');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    try {
      const payment = await createBooking(authToken, {
        booking_date: selectedBookingDate,
        collection_address: {
          lat,
          lng,
          city: location?.city ?? details.city ?? '',
          name: customer.name,
          type:
            location?.type ??
            details.addressType ??
            details.address_type ??
            'Home',
          phone: customer.phone,
          address: addressLine(selectedAddress),
        },
        items,
      });

      try {
        await RazorpayCheckout.open({
          key: payment.key_id,
          amount: payment.razorpay_order.amount,
          currency: payment.razorpay_order.currency,
          order_id: payment.razorpay_order.id,
          name: 'Haa Health',
          description: `Booking ${payment.booking_order.booking_no}`,
          prefill: {
            name: customer.name,
            email: customer.email ?? undefined,
            contact: customer.phone,
          },
          theme: { color: theme.colors.primary },
        });
        dispatch(clearCart());
        navigation.replace('BookingSuccess', {
          bookingNo: payment.booking_order.booking_no,
        });
      } catch (error) {
        const failure = error as PaymentFailure;
        navigation.replace('BookingFailed', {
          bookingNo: payment.booking_order.booking_no,
          reason: failure.description ?? 'Payment was cancelled or failed.',
        });
      }
    } catch (error) {
      setBookingError(
        error instanceof Error ? error.message : 'Unable to create booking.',
      );
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    const primaryBeneficiary = {
      id: patientId,
      name: patientName,
      detail: customer?.phone
        ? `${customer.phone}  |  Self`
        : 'Guest booking · Self',
      profilePhoto: normalizeProfilePhoto(customer?.profilePhoto ?? null),
    };
    if (!authToken) {
      dispatch(upsertCartBeneficiary(primaryBeneficiary));
    }
    dispatch(setCartBeneficiaryTarget(patientId));
  }, [
    authToken,
    customer?.phone,
    customer?.profilePhoto,
    dispatch,
    patientId,
    patientName,
  ]);

  useEffect(() => {
    cart.items.forEach(item => {
      if (!item.beneficiaryIds.length)
        dispatch(
          assignTestBeneficiaries({
            labTestId: item.labTest.lab_test_id,
            beneficiaryIds: [patientId],
          }),
        );
    });
  }, [cart.items, dispatch, patientId]);

  useEffect(() => {
    if (!authToken) return;
    let active = true;
    getFamilyMembers(authToken)
      .then(fetchedMembers => {
        if (!active) return;
        setMembers(fetchedMembers);
        const selfMember = fetchedMembers.find(
          member => member.relation.trim().toLowerCase() === 'self',
        );
        const primaryBeneficiary: CartBeneficiary = selfMember
          ? {
              id: `member-${selfMember.member_id}`,
              name: selfMember.name,
              detail: `${selfMember.age} yrs  ·  ${selfMember.gender}  ·  Self`,
              profilePhoto: selfMember.profilePhoto,
            }
          : {
              id: patientId,
              name: patientName,
              detail: customer?.phone ? `${customer.phone}  ·  Self` : 'Self',
              profilePhoto: normalizeProfilePhoto(
                customer?.profilePhoto ?? null,
              ),
            };
        dispatch(
          initializeCartFamilyMember({
            legacyIds: ['guest-primary', patientId],
            beneficiary: primaryBeneficiary,
          }),
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [
    authToken,
    customer?.phone,
    customer?.profilePhoto,
    dispatch,
    patientId,
    patientName,
  ]);

  const loadFamilyMembers = useCallback(async () => {
    setMembersOpen(true);
    if (!authToken) {
      setMembersError('Sign in to select a saved family member.');
      return;
    }
    setMembersLoading(true);
    setMembersError(null);
    try {
      const fetchedMembers = await getFamilyMembers(authToken);
      const selfMember =
        fetchedMembers.find(
          member => member.relation.trim().toLowerCase() === 'self',
        ) ?? fetchedMembers.find(member => member.isDefault);
      // Opening the picker must never mutate cart membership. The primary
      // profile is derived from `members` above after this fetch completes.
      const updateCartFromPicker = false;
      if (selfMember && updateCartFromPicker) {
        const duplicateSelfId = `member-${selfMember.member_id}`;
        cart.items.forEach(item => {
          if (item.beneficiaryIds.includes(duplicateSelfId)) {
            dispatch(
              assignTestBeneficiaries({
                labTestId: item.labTest.lab_test_id,
                beneficiaryIds: [
                  ...item.beneficiaryIds.filter(id => id !== duplicateSelfId),
                  patientId,
                ],
              }),
            );
          }
        });
        dispatch(removeCartBeneficiary(duplicateSelfId));
        dispatch(
          upsertCartBeneficiary({
            id: patientId,
            name: patientName,
            detail: `${customer?.phone ?? selfMember.phone ?? ''}  ·  ${
              selfMember.age
            } yrs  ·  ${selfMember.gender}  ·  Self`,
            profilePhoto: selfMember.profilePhoto ?? customer?.profilePhoto,
          }),
        );
      }
      setMembers(fetchedMembers);
    } catch (error) {
      setMembersError(
        error instanceof Error
          ? error.message
          : 'Unable to load family members.',
      );
    } finally {
      setMembersLoading(false);
    }
  }, [
    authToken,
    cart.items,
    customer?.phone,
    customer?.profilePhoto,
    dispatch,
    patientId,
    patientName,
  ]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!returnToMembers) return;
      setReturnToMembers(false);
      loadFamilyMembers();
    });
    return unsubscribe;
  }, [loadFamilyMembers, navigation, returnToMembers]);

  const createFamilyMember = () => {
    setMembersOpen(false);
    setReturnToMembers(true);
    navigation
      .getParent()
      ?.getParent<NativeStackNavigationProp<RootStackParamList>>()
      ?.navigate('FamilyMemberForm');
  };

  const openAddresses = useCallback(() => {
    setAddressesOpen(true);
    loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!returnToAddresses) return;
      setReturnToAddresses(false);
      openAddresses();
    });
    return unsubscribe;
  }, [navigation, openAddresses, returnToAddresses]);

  const createAddress = () => {
    if (!authToken) {
      goToLogin();
      return;
    }
    setAddressesOpen(false);
    setReturnToAddresses(true);
    navigation
      .getParent()
      ?.getParent<NativeStackNavigationProp<RootStackParamList>>()
      ?.navigate('AddressForm');
  };

  return (
    <LinearGradient
      colors={screenGradientColors(theme)}
      locations={screenGradientLocations}
      style={styles.flex}
    >
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View
          style={[styles.header, { borderBottomColor: theme.colors.border }]}
        >
          <Pressable
            onPress={navigation.goBack}
            style={[styles.back, { backgroundColor: theme.colors.surface }]}
          >
            <ChevronLeft color={theme.colors.text} size={20} />
          </Pressable>
          <AppText style={styles.headerTitle} weight="800">
            Review booking
          </AppText>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 92, 120) },
          ]}
        >
          <View style={styles.heroRow}>
            <View>
              <AppText
                color={theme.colors.primary}
                style={styles.eyebrow}
                weight="800"
              >
                HOME COLLECTION
              </AppText>
              <AppText style={styles.heroTitle} weight="800">
                Complete your{`\n`}booking.
              </AppText>
            </View>
            <View style={styles.secure}>
              <ShieldCheck color="#078A73" size={13} />
              <AppText color="#078A73" style={styles.secureText} weight="700">
                Secure
              </AppText>
            </View>
          </View>
          <StepCard
            number="01"
            title="Patient details"
            subtitle="Assign tests to the person being tested"
          >
            {!customer && (
              <View
                style={[
                  styles.loginRequired,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.loginRequiredIcon,
                    { backgroundColor: theme.colors.primarySoft },
                  ]}
                >
                  <UserRound color={theme.colors.primary} size={20} />
                </View>
                <View style={styles.loginRequiredCopy}>
                  <AppText style={styles.loginRequiredTitle} weight="800">
                    You’re not logged in
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.loginRequiredText}
                  >
                    Log in to add patient details and complete this booking.
                  </AppText>
                </View>
                <Pressable
                  onPress={goToLogin}
                  style={[
                    styles.loginButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <AppText
                    color="#FFFFFF"
                    style={styles.loginButtonText}
                    weight="800"
                  >
                    Login
                  </AppText>
                </Pressable>
              </View>
            )}
            {customer &&
              bookingPatients.map(beneficiary => (
                <PatientGroup
                  key={beneficiary.id}
                  beneficiary={beneficiary}
                  tests={cart.items.filter(item =>
                    item.beneficiaryIds.includes(beneficiary.id),
                  )}
                  onRemoveMember={() =>
                    dispatch(removeCartBeneficiary(beneficiary.id))
                  }
                  onRemoveTest={labTestId =>
                    dispatch(
                      removeTestForBeneficiary({
                        labTestId,
                        beneficiaryId: beneficiary.id,
                      }),
                    )
                  }
                  onAddTest={() => {
                    dispatch(setCartBeneficiaryTarget(beneficiary.id));
                    navigation.navigate('AddPatientTests', {
                      beneficiaryId: beneficiary.id,
                    });
                  }}
                />
              ))}
            {false && (
              <>
                <View
                  style={[
                    styles.patient,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.avatar}>
                    <AppText color={theme.colors.primary} weight="800">
                      {patientName.charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                  <View style={styles.grow}>
                    <AppText style={styles.patientName} weight="700">
                      {patientName}
                    </AppText>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.small}
                    >
                      {customer?.phone ?? 'Guest booking'}
                    </AppText>
                  </View>
                  <AppText
                    color={theme.colors.primary}
                    style={styles.change}
                    weight="700"
                  >
                    Change
                  </AppText>
                </View>
                {selectedMembers.map(member => (
                  <View
                    key={member.member_id}
                    style={[
                      styles.additionalPatient,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={styles.avatar}>
                      <AppText color={theme.colors.primary} weight="800">
                        {member.name.charAt(0).toUpperCase()}
                      </AppText>
                    </View>
                    <View style={styles.grow}>
                      <AppText style={styles.patientName} weight="700">
                        {member.name}
                      </AppText>
                      <AppText
                        color={theme.colors.textMuted}
                        style={styles.small}
                      >
                        {member.age} yrs · {member.gender} · {member.relation}
                      </AppText>
                    </View>
                  </View>
                ))}
                {cart.items.map(entry => (
                  <View
                    key={entry.labTest.lab_test_id}
                    style={[
                      styles.test,
                      { borderBottomColor: theme.colors.border },
                    ]}
                  >
                    <View style={styles.grow}>
                      <AppText style={styles.testName} weight="700">
                        {entry.labTest.test.test_name}
                      </AppText>
                      <AppText
                        color={theme.colors.textMuted}
                        style={styles.testMeta}
                      >
                        {entry.labTest.test.requirements?.sample_type ??
                          'Sample'}{' '}
                        sample ·{' '}
                        {entry.labTest.test.included_tests?.length ?? 0}{' '}
                        parameters · Fasting{' '}
                        {entry.labTest.test.requirements?.fasting_required
                          ? `${
                              entry.labTest.test.requirements
                                .fasting_duration ?? ''
                            } hrs`
                          : 'not required'}
                      </AppText>
                      <View style={styles.tagRow}>
                        {entry.labTest.test.tags?.slice(0, 2).map(tag => (
                          <View key={tag} style={styles.testTag}>
                            <AppText
                              color={theme.colors.primary}
                              style={styles.testTagText}
                              weight="700"
                            >
                              {tag.toUpperCase()}
                            </AppText>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={styles.testRight}>
                      <Pressable
                        onPress={() =>
                          dispatch(
                            removeTestFromCart(entry.labTest.lab_test_id),
                          )
                        }
                      >
                        <Trash color={theme.colors.textMuted} size={14} />
                      </Pressable>
                      <AppText style={styles.testPrice} weight="800">
                        {formatINR(Number(entry.labTest.offer_price))}
                      </AppText>
                    </View>
                  </View>
                ))}
                <Pressable
                  style={[
                    styles.addTest,
                    { borderColor: theme.colors.primary },
                  ]}
                >
                  <Plus color={theme.colors.primary} size={13} />
                  <AppText
                    color={theme.colors.primary}
                    style={styles.addText}
                    weight="700"
                  >
                    Add another test for {patientName}
                  </AppText>
                </Pressable>
              </>
            )}
            {customer && (
              <Pressable
                onPress={loadFamilyMembers}
                style={[
                  styles.addMember,
                  { borderColor: theme.colors.primary },
                ]}
              >
                <View
                  style={[
                    styles.plusCircle,
                    { borderColor: theme.colors.primary },
                  ]}
                >
                  <Plus color={theme.colors.primary} size={15} />
                </View>
                <View style={styles.grow}>
                  <AppText style={styles.addMemberText} weight="700">
                    Add another family member
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.addMemberSubtext}
                  >
                    Select a saved member or create new
                  </AppText>
                </View>
                <ChevronDown color={theme.colors.textMuted} size={14} />
              </Pressable>
            )}
          </StepCard>
          {recommendation && (
            <SmartChoiceCard
              currentLabName={cart.labName ?? 'Selected lab'}
              currentPrice={currentSelectionPrice}
              selectedTestCount={selectedTestIds.length}
              recommendation={recommendation}
              onSwitch={() =>
                runAuthenticatedAction(() =>
                  dispatch(
                    switchCartLab({
                      labName: recommendation.lab_name,
                      tests: recommendation.tests,
                    }),
                  ),
                )
              }
            />
          )}
          <StepCard
            number="02"
            title="Select date & slot"
            subtitle="Choose a convenient home-collection time"
          >
            <View style={styles.dates}>
              {dates.map((date, index) => {
                const active = selectedDay === index;
                return (
                  <Pressable
                    key={date.toISOString()}
                    onPress={() =>
                      runAuthenticatedAction(() => setSelectedDay(index))
                    }
                    style={[
                      styles.date,
                      {
                        backgroundColor: active
                          ? theme.colors.primary
                          : theme.colors.surfaceMuted,
                      },
                    ]}
                  >
                    <AppText
                      color={active ? '#FFFFFF' : theme.colors.textMuted}
                      style={styles.day}
                      weight="700"
                    >
                      {date
                        .toLocaleDateString('en-US', { weekday: 'short' })
                        .toUpperCase()}
                    </AppText>
                    <AppText
                      color={active ? '#FFFFFF' : theme.colors.text}
                      style={styles.dateNumber}
                      weight="800"
                    >
                      {date.getDate()}
                    </AppText>
                    <AppText
                      color={active ? '#FFFFFF' : theme.colors.textMuted}
                      style={styles.month}
                    >
                      {date
                        .toLocaleDateString('en-US', { month: 'short' })
                        .toUpperCase()}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            {slotsLoading ? (
              <View
                style={[
                  styles.slotStatus,
                  { backgroundColor: theme.colors.surfaceMuted },
                ]}
              >
                <ActivityIndicator color={theme.colors.primary} size="small" />
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.slotStatusText}
                >
                  Checking available slots…
                </AppText>
              </View>
            ) : slotsError ? (
              <View
                style={[
                  styles.slotStatus,
                  { backgroundColor: theme.colors.surfaceMuted },
                ]}
              >
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.slotStatusText}
                >
                  {slotsError}
                </AppText>
              </View>
            ) : slots.length ? (
              <View style={styles.times}>
                {slots.map(slot => {
                  const active = selectedSlotId === slot.slot_id;
                  const timePassed = slotStartHasPassed(slot);
                  const bookable = isSlotBookable(slot);
                  return (
                    <Pressable
                      key={slot.slot_id}
                      disabled={!bookable}
                      onPress={() =>
                        runAuthenticatedAction(() =>
                          setSelectedSlotId(slot.slot_id),
                        )
                      }
                      style={[
                        styles.time,
                        {
                          borderColor: active
                            ? theme.colors.success
                            : bookable
                            ? theme.isDark
                              ? '#2F7669'
                              : '#8BD8C8'
                            : theme.colors.border,
                          backgroundColor: active
                            ? theme.colors.success
                            : bookable
                            ? theme.isDark
                              ? '#123A34'
                              : '#EEFAF6'
                            : theme.colors.surface,
                          opacity: bookable ? 1 : 0.45,
                        },
                      ]}
                    >
                      <AppText
                        color={
                          active
                            ? '#FFFFFF'
                            : bookable
                            ? theme.isDark
                              ? '#5EEAD4'
                              : '#078A73'
                            : theme.colors.textMuted
                        }
                        style={styles.timeText}
                        weight="700"
                      >
                        {slotLabel(slot)}
                      </AppText>
                      <AppText
                        color={
                          active
                            ? '#FFFFFF'
                            : bookable
                            ? theme.isDark
                              ? '#5EEAD4'
                              : '#078A73'
                            : theme.colors.textMuted
                        }
                        style={styles.slotCount}
                        weight={active ? '700' : '400'}
                      >
                        {active
                          ? `✓ Selected · ${slot.available_booking_count} left`
                          : timePassed
                          ? 'Time passed'
                          : slot.is_available
                          ? `${slot.available_booking_count} left`
                          : 'Full'}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View
                style={[
                  styles.slotStatus,
                  { backgroundColor: theme.colors.surfaceMuted },
                ]}
              >
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.slotStatusText}
                >
                  No collection slots are available for this date.
                </AppText>
              </View>
            )}
          </StepCard>
          <StepCard
            number="03"
            title="Collection address"
            subtitle="Where should our phlebotomist visit?"
          >
            <Pressable
              onPress={() => runAuthenticatedAction(openAddresses)}
              style={[
                styles.address,
                { backgroundColor: theme.colors.surfaceMuted },
              ]}
            >
              <View
                style={[
                  styles.locationIcon,
                  { backgroundColor: theme.colors.primarySoft },
                ]}
              >
                <MapPin color={theme.colors.primary} size={17} />
              </View>
              <View style={styles.grow}>
                <AppText style={styles.patientName} weight="700">
                  {addressesLoading
                    ? 'Loading addresses…'
                    : selectedAddress
                    ? addressTitle(selectedAddress)
                    : 'No saved address'}
                </AppText>
                <AppText color={theme.colors.textMuted} style={styles.small}>
                  {selectedAddress
                    ? addressLine(selectedAddress)
                    : zone?.zone_name ?? 'Add a collection address'}
                </AppText>
              </View>
              {!!addresses.length && (
                <View style={styles.changeAddress}>
                  <AppText
                    color={theme.colors.primary}
                    style={styles.change}
                    weight="700"
                  >
                    Change
                  </AppText>
                  <ChevronDown
                    color={theme.colors.primary}
                    size={13}
                    style={addressesOpen ? styles.chevronOpen : undefined}
                  />
                </View>
              )}
            </Pressable>
            <Pressable onPress={createAddress} style={styles.addAddress}>
              <Plus color={theme.colors.primary} size={12} />
              <AppText
                color={theme.colors.primary}
                style={styles.addText}
                weight="700"
              >
                Add another address
              </AppText>
            </Pressable>
          </StepCard>
        </ScrollView>
        <FamilyMembersSheet
          visible={membersOpen}
          members={members}
          selectedIds={unavailableMemberIds}
          loading={membersLoading}
          error={membersError}
          onClose={() => setMembersOpen(false)}
          onRetry={loadFamilyMembers}
          onCreate={createFamilyMember}
          onSelect={member => {
            if (selectedMemberIds.has(member.member_id)) {
              setMembersOpen(false);
              return;
            }
            const memberId = `member-${member.member_id}`;
            dispatch(
              upsertCartBeneficiary({
                id: memberId,
                name: member.name,
                detail: `${member.age} yrs  ·  ${member.gender}  ·  ${member.relation}`,
                profilePhoto: member.profilePhoto,
              }),
            );
            dispatch(setCartBeneficiaryTarget(memberId));
            setMembersOpen(false);
          }}
        />
        <AddressesSheet
          visible={addressesOpen}
          addresses={addresses}
          selectedId={selectedAddressId}
          loading={addressesLoading}
          onClose={() => setAddressesOpen(false)}
          onSelect={address => {
            setSelectedAddressId(address.address_id);
            setAddressesOpen(false);
          }}
          onCreate={createAddress}
        />
        <View
          style={[
            styles.payment,
            {
              bottom: insets.bottom,
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <View>
            <AppText color={theme.colors.textMuted} style={styles.totalLabel}>
              Total payable
            </AppText>
            <AppText style={styles.total} weight="800">
              {formatINR(total)}
            </AppText>
            <AppText
              color={bookingError ? theme.colors.danger : '#078A73'}
              numberOfLines={2}
              style={bookingError ? styles.bookingError : styles.noFees}
              weight="700"
            >
              {bookingError ?? 'No collection fee'}
            </AppText>
          </View>
          <Pressable
            disabled={!cart.items.length || bookingLoading}
            onPress={proceedToPayment}
            style={[
              styles.pay,
              {
                backgroundColor:
                  cart.items.length && !bookingLoading
                    ? theme.colors.primary
                    : theme.colors.border,
              },
            ]}
          >
            <AppText color="#FFFFFF" style={styles.payText} weight="800">
              {bookingLoading ? 'Creating booking…' : 'Proceed to pay →'}
            </AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function PatientGroup({
  beneficiary,
  tests,
  onRemoveMember,
  onRemoveTest,
  onAddTest,
}: {
  beneficiary: CartBeneficiary;
  tests: CartTest[];
  onRemoveMember: () => void;
  onRemoveTest: (labTestId: number) => void;
  onAddTest: () => void;
}) {
  const { theme } = useAppTheme();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [beneficiary.profilePhoto]);

  return (
    <View style={[styles.patientGroup, { borderColor: theme.colors.border }]}>
      <View style={styles.patientGroupHeader}>
        {beneficiary.profilePhoto && !imageFailed ? (
          <Image
            source={{ uri: beneficiary.profilePhoto }}
            style={styles.groupAvatar}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.groupAvatar}>
            <AppText
              color={theme.colors.primary}
              style={styles.avatarLetter}
              weight="800"
            >
              {beneficiary.name.charAt(0).toUpperCase()}
            </AppText>
          </View>
        )}
        <View style={styles.grow}>
          <AppText style={styles.groupPatientName} weight="800">
            {beneficiary.name}
          </AppText>
          <AppText
            color={theme.colors.textMuted}
            style={styles.groupPatientMeta}
          >
            {beneficiary.detail}
          </AppText>
        </View>
        <Pressable
          hitSlop={8}
          onPress={onRemoveMember}
          style={styles.removeMember}
        >
          <Trash color={theme.colors.primary} size={16} />
          <AppText
            color={theme.colors.primary}
            style={styles.removeMemberText}
            weight="700"
          >
            Remove
          </AppText>
        </Pressable>
      </View>

      {tests.map(({ labTest }, index) => (
        <View
          key={labTest.lab_test_id}
          style={[
            styles.patientTestCard,
            index === 0
              ? styles.firstPatientTestCard
              : styles.nextPatientTestCard,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <TestImage
            uri={
              labTest.test.images?.[0] ?? labTest.test.category?.image ?? null
            }
          />
          <View style={styles.testCopy}>
            <AppText style={styles.groupTestName} weight="800">
              {labTest.test.test_name}
            </AppText>
            <AppText
              color={theme.colors.textMuted}
              style={styles.groupTestMeta}
            >
              {labTest.test.requirements?.sample_type ?? 'Sample'} sample ·{' '}
              {labTest.test.included_tests?.length ?? 0} parameters
            </AppText>
            <View style={styles.tagRow}>
              {(labTest.test.tags?.length
                ? labTest.test.tags
                : [labTest.test.test_type.replaceAll('_', ' ')]
              )
                .slice(0, 2)
                .map(tag => (
                  <View key={tag} style={styles.testTag}>
                    <AppText
                      color={theme.colors.primary}
                      style={styles.testTagText}
                      weight="700"
                    >
                      {tag.toUpperCase()}
                    </AppText>
                  </View>
                ))}
            </View>
          </View>
          <View style={styles.groupTestRight}>
            <AppText style={styles.groupTestPrice} weight="800">
              {formatINR(Number(labTest.offer_price))}
            </AppText>
            <Pressable
              hitSlop={10}
              onPress={() => onRemoveTest(labTest.lab_test_id)}
            >
              <Trash color={theme.colors.textMuted} size={17} />
            </Pressable>
          </View>
        </View>
      ))}

      <Pressable
        onPress={onAddTest}
        style={[styles.groupAddTest, { borderColor: theme.colors.primary }]}
      >
        <Plus color={theme.colors.primary} size={20} />
        <AppText
          color={theme.colors.primary}
          style={styles.groupAddText}
          weight="700"
        >
          Add another test for {beneficiary.name}
        </AppText>
      </Pressable>
    </View>
  );
}

function TestImage({ uri }: { uri: string | null }) {
  const { theme } = useAppTheme();
  const [failed, setFailed] = useState(false);
  const imageUrl = normalizeProfilePhoto(uri);

  useEffect(() => setFailed(false), [imageUrl]);

  if (imageUrl && !failed) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.testImage}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View style={styles.testIconBox}>
      <FlaskConical color={theme.colors.primary} size={23} />
    </View>
  );
}

function SmartChoiceCard({
  currentLabName,
  currentPrice,
  selectedTestCount,
  recommendation,
  onSwitch,
}: {
  currentLabName: string;
  currentPrice: number;
  selectedTestCount: number;
  recommendation: RecommendedLab;
  onSwitch: () => void;
}) {
  const { theme } = useAppTheme();
  const saving = Math.max(
    currentPrice - recommendation.total_test_final_amount,
    0,
  );
  const savingPercent = currentPrice
    ? Math.round((saving / currentPrice) * 100)
    : 0;
  const city = recommendation.address?.city ?? recommendation.zone?.zone_name;

  return (
    <View
      style={[
        styles.recommendationCard,
        { backgroundColor: theme.colors.surface, borderColor: '#F4B7BE' },
      ]}
    >
      <View style={styles.recommendationHeader}>
        <WandSparkles color="#FFFFFF" size={20} />
        <AppText
          color="#FFFFFF"
          style={styles.recommendationHeaderText}
          weight="800"
        >
          SMART CHOICE RECOMMENDATION
        </AppText>
      </View>
      <View style={styles.recommendationBody}>
        <AppText
          color="#94A3B8"
          style={styles.recommendationEyebrow}
          weight="800"
        >
          YOUR SELECTION
        </AppText>
        <View style={styles.recommendationSummary}>
          <View style={styles.grow}>
            <AppText style={styles.recommendationLabName} weight="800">
              {currentLabName}
            </AppText>
            <AppText
              color="#94A3B8"
              style={styles.recommendationTestCount}
              weight="700"
            >
              {selectedTestCount} selected{' '}
              {selectedTestCount === 1 ? 'test' : 'tests'}
            </AppText>
          </View>
          <AppText style={styles.recommendationPrice} weight="800">
            {formatINR(currentPrice)}
          </AppText>
        </View>
        <View style={styles.versusRow}>
          <View style={styles.versusLine} />
          <View style={styles.versusCircle}>
            <AppText color="#94A3B8" style={styles.versusText} weight="800">
              VS
            </AppText>
          </View>
          <View style={styles.versusLine} />
        </View>
        <View style={styles.recommendedLab}>
          {saving > 0 && (
            <View style={styles.savingPill}>
              <AppText color="#FFFFFF" style={styles.savingText} weight="800">
                Save {formatINR(saving)}
                {savingPercent ? ` (${savingPercent}%)` : ''}
              </AppText>
            </View>
          )}
          <AppText color="#D81F32" style={styles.topRated} weight="800">
            TOP RATED
          </AppText>
          <View style={styles.recommendedNameRow}>
            <AppText
              color="#08233D"
              style={styles.recommendedName}
              weight="800"
            >
              {recommendation.lab_name}
            </AppText>
            <View style={styles.recommendedPriceBlock}>
              <AppText
                color="#08233D"
                style={styles.recommendedPrice}
                weight="800"
              >
                {formatINR(recommendation.total_test_final_amount)}
              </AppText>
              {recommendation.total_test_normal_amount >
                recommendation.total_test_final_amount && (
                <AppText color="#94A3B8" style={styles.strikePrice}>
                  {formatINR(recommendation.total_test_normal_amount)}
                </AppText>
              )}
            </View>
          </View>
          <View style={styles.recommendedMeta}>
            <Star color="#FFC107" fill="#FFC107" size={17} />
            <AppText
              color="#64748B"
              style={styles.recommendedMetaText}
              weight="700"
            >
              Recommended
            </AppText>
            {!!city && <AppText color="#64748B">•</AppText>}
            {!!city && (
              <AppText
                color="#D81F32"
                style={styles.recommendedMetaText}
                weight="700"
              >
                {city}
              </AppText>
            )}
          </View>
        </View>
        <Pressable onPress={onSwitch} style={styles.switchRecommendation}>
          <AppText
            color="#D81F32"
            style={styles.switchRecommendationText}
            weight="800"
          >
            Switch to Recommended
          </AppText>
          <ArrowRight color="#D81F32" size={20} />
        </Pressable>
      </View>
    </View>
  );
}

function StepCard({
  number,
  title,
  subtitle,
  icon,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View style={styles.stepHeader}>
        <View
          style={[
            styles.stepNumber,
            { backgroundColor: theme.colors.primarySoft },
          ]}
        >
          <AppText
            color={theme.colors.primary}
            style={styles.stepNumberText}
            weight="800"
          >
            {number}
          </AppText>
        </View>
        {icon}
        <View style={styles.grow}>
          <AppText style={styles.stepTitle} weight="800">
            {title}
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.stepSubtitle}>
            {subtitle}
          </AppText>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, lineHeight: 22 },
  headerSpacer: { width: 36 },
  content: { paddingHorizontal: 14 },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  eyebrow: { fontSize: 7, lineHeight: 9, letterSpacing: 0.7 },
  heroTitle: { marginTop: 5, fontSize: 21, lineHeight: 20 },
  secure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCF7EF',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  secureText: { fontSize: 7, lineHeight: 9 },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  recommendationCard: {
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  recommendationHeader: {
    minHeight: 48,
    backgroundColor: '#001A31',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  recommendationHeaderText: {
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.8,
  },
  recommendationBody: { padding: 14 },
  recommendationEyebrow: { fontSize: 8, lineHeight: 10, letterSpacing: 0.8 },
  recommendationSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 11,
  },
  recommendationLabName: { fontSize: 14, lineHeight: 18 },
  recommendationTestCount: { marginTop: 4, fontSize: 9, lineHeight: 12 },
  recommendationPrice: { fontSize: 15, lineHeight: 19 },
  versusRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  versusLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D7DCE2',
  },
  versusCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#D7DCE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  versusText: { fontSize: 9, lineHeight: 12 },
  recommendedLab: {
    borderWidth: 1,
    borderColor: '#F4B7BE',
    borderRadius: 14,
    backgroundColor: '#FFF7F8',
    padding: 13,
    paddingTop: 16,
  },
  savingPill: {
    position: 'absolute',
    right: 12,
    top: -14,
    backgroundColor: '#D81F32',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  savingText: { fontSize: 8, lineHeight: 10 },
  topRated: { fontSize: 8, lineHeight: 10, letterSpacing: 1 },
  recommendedNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  recommendedName: { flex: 1, fontSize: 12, lineHeight: 16 },
  recommendedPriceBlock: { alignItems: 'flex-end' },
  recommendedPrice: { fontSize: 13, lineHeight: 16 },
  strikePrice: {
    marginTop: 2,
    fontSize: 8,
    lineHeight: 10,
    textDecorationLine: 'line-through',
  },
  recommendedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },
  recommendedMetaText: { fontSize: 8, lineHeight: 11 },
  switchRecommendation: {
    minHeight: 44,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D81F32',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  switchRecommendationText: { fontSize: 10, lineHeight: 13 },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 13,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { fontSize: 8, lineHeight: 10 },
  stepTitle: { fontSize: 14, lineHeight: 18 },
  stepSubtitle: { marginTop: 2, fontSize: 8, lineHeight: 11 },
  loginRequired: {
    minHeight: 82,
    borderWidth: 1,
    borderRadius: 14,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loginRequiredIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginRequiredCopy: { flex: 1 },
  loginRequiredTitle: { fontSize: 11, lineHeight: 14 },
  loginRequiredText: { marginTop: 3, fontSize: 8, lineHeight: 11 },
  loginButton: {
    minWidth: 62,
    height: 34,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: { fontSize: 9, lineHeight: 12 },
  patientGroup: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
  },
  patientGroupHeader: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groupAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFF0F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 18, lineHeight: 22 },
  groupPatientName: { fontSize: 14, lineHeight: 18 },
  groupPatientMeta: { marginTop: 3, fontSize: 9, lineHeight: 12 },
  removeMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  removeMemberText: { fontSize: 8, lineHeight: 10 },
  patientTestCard: {
    minHeight: 82,
    borderWidth: 1,
    borderRadius: 14,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  firstPatientTestCard: { marginTop: 10 },
  nextPatientTestCard: { marginTop: 8 },
  testIconBox: {
    width: 48,
    height: 58,
    borderRadius: 13,
    backgroundColor: '#FFF0F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testImage: {
    width: 48,
    height: 58,
    borderRadius: 13,
    backgroundColor: '#FFF0F2',
  },
  testCopy: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' },
  groupTestName: { fontSize: 12, lineHeight: 15 },
  groupTestMeta: { marginTop: 3, fontSize: 8, lineHeight: 11 },
  groupTestRight: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  groupTestPrice: { fontSize: 14, lineHeight: 18 },
  groupAddTest: {
    minHeight: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 13,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  groupAddText: { fontSize: 10, lineHeight: 13 },
  patient: {
    minHeight: 64,
    borderRadius: 13,
    borderWidth: 1,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  additionalPatient: {
    minHeight: 58,
    borderRadius: 12,
    borderWidth: 1,
    padding: 9,
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFF0F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: { flex: 1 },
  patientName: { fontSize: 11, lineHeight: 14 },
  small: { marginTop: 3, fontSize: 8, lineHeight: 10 },
  change: { fontSize: 8, lineHeight: 10 },
  changeAddress: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  test: {
    paddingHorizontal: 11,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  testName: { fontSize: 11, lineHeight: 14 },
  testMeta: { marginTop: 7, fontSize: 8, lineHeight: 11 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 },
  testTag: {
    borderRadius: 7,
    backgroundColor: '#FFF0F2',
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  testTagText: { fontSize: 6, lineHeight: 8 },
  testRight: { alignItems: 'flex-end' },
  testPrice: { marginTop: 15, fontSize: 13, lineHeight: 16 },
  addTest: {
    minHeight: 44,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 9,
  },
  addText: { fontSize: 9, lineHeight: 12 },
  addMember: {
    minHeight: 62,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
    marginTop: 12,
  },
  plusCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMemberText: { fontSize: 10, lineHeight: 13 },
  addMemberSubtext: { marginTop: 3, fontSize: 7, lineHeight: 9 },
  dates: { flexDirection: 'row', gap: 6 },
  date: {
    flex: 1,
    minHeight: 57,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: { fontSize: 6, lineHeight: 8 },
  dateNumber: { fontSize: 14, lineHeight: 17 },
  month: { fontSize: 6, lineHeight: 8 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  time: {
    minWidth: '31%',
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  timeText: { marginTop: 3, fontSize: 8, lineHeight: 11 },
  slotCount: { marginTop: 2, fontSize: 6, lineHeight: 8 },
  slotStatus: {
    minHeight: 48,
    marginTop: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  slotStatusText: { fontSize: 9, lineHeight: 13, textAlign: 'center' },
  address: {
    minHeight: 50,
    borderRadius: 10,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 9,
  },
  payment: {
    position: 'absolute',
    left: 0,
    right: 0,
    minHeight: 72,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 12,
  },
  totalLabel: { fontSize: 7, lineHeight: 9 },
  total: { fontSize: 17, lineHeight: 20 },
  noFees: { fontSize: 6, lineHeight: 8 },
  bookingError: { maxWidth: 150, marginTop: 2, fontSize: 7, lineHeight: 9 },
  pay: {
    height: 43,
    borderRadius: 12,
    paddingHorizontal: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payText: { fontSize: 9, lineHeight: 12 },
});
