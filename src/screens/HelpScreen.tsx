import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Ellipsis from 'lucide-react-native/icons/ellipsis';
import FileText from 'lucide-react-native/icons/file-text';
import FlaskConical from 'lucide-react-native/icons/flask-conical';
import Mail from 'lucide-react-native/icons/mail';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import Package from 'lucide-react-native/icons/package';
import Phone from 'lucide-react-native/icons/phone';
import CreditCard from 'lucide-react-native/icons/credit-card';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../components';
import { useAppSelector } from '../store';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Support'>;
const topics = [
  {
    title: 'Lab bookings',
    description: 'Collection, preparation and rescheduling',
    icon: FlaskConical,
  },
  {
    title: 'Orders & delivery',
    description: 'Quick and Global Store assistance',
    icon: Package,
  },
  {
    title: 'Reports & privacy',
    description: 'Access, download and secure health data',
    icon: FileText,
  },
  {
    title: 'Payments & refunds',
    description: 'Charges, payment status and refund timelines',
    icon: CreditCard,
  },
];

export function HelpScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const token = useAppSelector(state => state.auth.session?.token);
  const guarded = (action: () => void) => {
    if (token) {
      action();
      return;
    }
    Alert.alert(
      'Login required',
      'Please log in to use this support feature.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Log in', onPress: () => navigation.navigate('Login') },
      ],
    );
  };
  const createTicket = () => navigation.navigate('SupportCreate');
  const contactUnavailable = (channel: string) =>
    Alert.alert(
      `${channel} support`,
      `${channel} support is not available yet. You can raise a ticket to contact our care team.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Raise a ticket', onPress: createTicket },
      ],
    );
  const actions = [
    {
      title: 'Raise a ticket',
      subtitle: "We'll respond shortly",
      icon: FileText,
      action: createTicket,
    },
    {
      title: 'Call us',
      subtitle: 'Talk to our care team',
      icon: Phone,
      action: () => contactUnavailable('Phone'),
    },
    {
      title: 'Email',
      subtitle: 'Contact our care team',
      icon: Mail,
      action: () => contactUnavailable('Email'),
    },
  ];
  const panel = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  };
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={navigation.goBack}
          style={[styles.headerButton, panel]}
        >
          <ChevronLeft size={18} color={theme.colors.text} />
        </Pressable>
        <AppText weight="800" style={styles.headerTitle}>
          Need Help?
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View support requests"
          onPress={() => guarded(() => navigation.navigate('SupportRequests'))}
          style={[styles.headerButton, panel]}
        >
          <Ellipsis size={18} color={theme.colors.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText weight="800" style={styles.heading}>
          How can we help you?
        </AppText>
        <AppText color={theme.colors.textMuted} style={styles.intro}>
          Choose the most convenient way to contact the HAA Health support team.
        </AppText>
        <AppText weight="800" style={styles.section}>
          Talk to us
        </AppText>
        <View style={styles.actions}>
          {actions.map(({ title, subtitle, icon: Icon, action }, index) => {
            const primary = index === 0;
            const foreground = primary
              ? theme.colors.onPrimary
              : theme.colors.text;
            return (
              <Pressable
                key={title}
                accessibilityRole="button"
                onPress={() => guarded(action)}
                style={[
                  styles.action,
                  panel,
                  primary && {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  },
                ]}
              >
                <View
                  style={[
                    styles.icon,
                    {
                      backgroundColor: primary
                        ? 'rgba(255,255,255,0.18)'
                        : theme.colors.primarySoft,
                    },
                  ]}
                >
                  <Icon
                    size={18}
                    color={primary ? foreground : theme.colors.primary}
                  />
                </View>
                <AppText
                  weight="700"
                  color={foreground}
                  style={styles.actionTitle}
                >
                  {title}
                </AppText>
                <AppText
                  color={primary ? foreground : theme.colors.textMuted}
                  style={styles.caption}
                >
                  {subtitle}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText weight="800" style={styles.section}>
          Help by topic
        </AppText>
        <View style={[styles.topics, panel]}>
          {topics.map(({ title, description, icon: Icon }, index) => (
            <Pressable
              key={title}
              accessibilityRole="button"
              onPress={() => guarded(createTicket)}
              style={[
                styles.topic,
                index > 0 && styles.topicDivider,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <View
                style={[
                  styles.icon,
                  { backgroundColor: theme.colors.primarySoft },
                ]}
              >
                <Icon size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.copy}>
                <AppText weight="700" style={styles.topicTitle}>
                  {title}
                </AppText>
                <AppText color={theme.colors.textMuted} style={styles.caption}>
                  {description}
                </AppText>
              </View>
              <ChevronRight size={15} color={theme.colors.textMuted} />
            </Pressable>
          ))}
        </View>
        <View
          style={[
            styles.care,
            {
              backgroundColor: theme.isDark ? '#123A34' : '#DFF6F0',
              borderColor: theme.isDark ? '#27675B' : '#BCE7DC',
            },
          ]}
        >
          <MessageCircle
            size={23}
            color={theme.isDark ? '#5EEAD4' : '#087C67'}
          />
          <View style={styles.copy}>
            <AppText weight="700" style={styles.topicTitle}>
              We're here to help
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.caption}>
              Raise a ticket and follow updates from our care team in your
              support requests.
            </AppText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17 },
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 16, lineHeight: 21 },
  intro: { marginTop: 5, fontSize: 11, lineHeight: 16 },
  section: { fontSize: 15, marginTop: 20, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    minWidth: 0,
    minHeight: 108,
    padding: 11,
    borderRadius: 15,
    borderWidth: 1,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { fontSize: 11, marginTop: 10 },
  caption: { fontSize: 9, lineHeight: 13, marginTop: 3 },
  topics: { borderWidth: 1, borderRadius: 15, overflow: 'hidden' },
  topic: {
    minHeight: 59,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topicDivider: { borderTopWidth: StyleSheet.hairlineWidth },
  topicTitle: { fontSize: 11, lineHeight: 15 },
  copy: { flex: 1 },
  care: {
    marginTop: 20,
    borderRadius: 13,
    borderWidth: 1,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
