import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import CircleQuestionMark from 'lucide-react-native/icons/circle-question-mark';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import MessageSquarePlus from 'lucide-react-native/icons/message-square-plus';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSupportTickets, SupportTicket } from '../api/support';
import { AppText } from '../components';
import { useAppSelector } from '../store';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Support'>;

function titleCase(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
}

function statusColor(status: string) {
  if (status.toLowerCase() === 'closed') return '#64748B';
  if (status.toLowerCase() === 'in_progress') return '#B45309';
  return '#078A73';
}

export function SupportScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const token = useAppSelector(state => state.auth.session?.token);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setTickets(await getSupportTickets(token));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load support requests.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [loadTickets]),
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Pressable
          onPress={navigation.goBack}
          style={[styles.back, { backgroundColor: theme.colors.surface }]}
        >
          <ChevronLeft color={theme.colors.text} size={20} />
        </Pressable>
        <AppText style={styles.headerTitle} weight="800">
          Support requests
        </AppText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadTickets}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <AppText
            color={theme.colors.primary}
            style={styles.eyebrow}
            weight="800"
          >
            — SUPPORT
          </AppText>
          <AppText style={styles.title} weight="800">
            How can we help?
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.subtitle}>
            Track updates and create a new request whenever you need us.
          </AppText>
        </View>
        <Pressable
          onPress={() => navigation.navigate('SupportCreate')}
          style={[styles.create, { backgroundColor: theme.colors.primary }]}
        >
          <MessageSquarePlus color="#FFFFFF" size={17} />
          <AppText color="#FFFFFF" style={styles.createText} weight="800">
            Create support request
          </AppText>
        </Pressable>

        {loading && !tickets.length ? (
          <View style={styles.state}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : error ? (
          <View
            style={[
              styles.stateCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <AppText style={styles.stateTitle} weight="800">
              Could not load requests
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.stateText}>
              {error}
            </AppText>
            <Pressable
              onPress={loadTickets}
              style={[styles.retry, { backgroundColor: theme.colors.primary }]}
            >
              <AppText color="#FFFFFF" style={styles.retryText} weight="800">
                Try again
              </AppText>
            </Pressable>
          </View>
        ) : !tickets.length ? (
          <View
            style={[
              styles.stateCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.colors.primarySoft },
              ]}
            >
              <CircleQuestionMark color={theme.colors.primary} size={23} />
            </View>
            <AppText style={styles.stateTitle} weight="800">
              No support requests yet
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.stateText}>
              Create a request and our team will get back to you.
            </AppText>
          </View>
        ) : (
          <View style={styles.list}>
            {tickets.map(ticket => (
              <TicketCard
                key={ticket.support_id}
                ticket={ticket}
                onPress={() => navigation.navigate('SupportDetail', { ticket })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TicketCard({
  ticket,
  onPress,
}: {
  ticket: SupportTicket;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const lastMessage = ticket.messages[ticket.messages.length - 1];
  const color = statusColor(ticket.status);
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.ticket,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.ticketHeader}>
        <AppText style={styles.subject} weight="800" numberOfLines={1}>
          {ticket.subject}
        </AppText>
        <View style={[styles.status, { backgroundColor: `${color}1A` }]}>
          <AppText color={color} style={styles.statusText} weight="800">
            {titleCase(ticket.status)}
          </AppText>
        </View>
      </View>
      <AppText
        color={theme.colors.textMuted}
        style={styles.description}
        numberOfLines={2}
      >
        {ticket.description}
      </AppText>
      <View style={styles.metaRow}>
        <AppText color={theme.colors.primary} style={styles.meta} weight="700">
          {titleCase(ticket.type)}
        </AppText>
        <AppText color={theme.colors.textMuted} style={styles.meta}>
          {formatDate(ticket.updatedAt || ticket.createdAt)}
        </AppText>
      </View>
      {lastMessage?.text ? (
        <AppText
          color={theme.colors.textMuted}
          style={styles.lastMessage}
          numberOfLines={1}
        >
          Latest: {lastMessage.text}
        </AppText>
      ) : null}
      <View style={styles.viewRequest}>
        <AppText
          color={theme.colors.primary}
          style={styles.viewRequestText}
          weight="800"
        >
          View full request
        </AppText>
        <ChevronRight color={theme.colors.primary} size={14} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, lineHeight: 21 },
  headerSpacer: { width: 36 },
  content: { padding: 16, paddingBottom: 96 },
  intro: { marginTop: 4 },
  eyebrow: { fontSize: 9, lineHeight: 12, letterSpacing: 0.8 },
  title: { marginTop: 4, fontSize: 24, lineHeight: 29, letterSpacing: -0.6 },
  subtitle: { marginTop: 4, fontSize: 10, lineHeight: 14 },
  create: {
    minHeight: 48,
    borderRadius: 14,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createText: { fontSize: 11, lineHeight: 14 },
  list: { marginTop: 14, gap: 9 },
  ticket: { borderWidth: 1, borderRadius: 15, padding: 12 },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subject: { flex: 1, fontSize: 12, lineHeight: 16 },
  status: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  statusText: { fontSize: 8, lineHeight: 10, textTransform: 'capitalize' },
  description: { marginTop: 7, fontSize: 10, lineHeight: 14 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  meta: { fontSize: 8, lineHeight: 10 },
  lastMessage: { marginTop: 7, fontSize: 9, lineHeight: 12 },
  viewRequest: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 9,
  },
  viewRequestText: { fontSize: 9, lineHeight: 12 },
  state: { paddingVertical: 64, alignItems: 'center' },
  stateCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    marginTop: 18,
    padding: 24,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  stateTitle: { fontSize: 13, lineHeight: 17 },
  stateText: { marginTop: 5, textAlign: 'center', fontSize: 9, lineHeight: 13 },
  retry: {
    borderRadius: 10,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryText: { fontSize: 9, lineHeight: 12 },
});
