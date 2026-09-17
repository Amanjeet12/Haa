import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Camera from 'lucide-react-native/icons/camera';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Send from 'lucide-react-native/icons/send';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  replyToSupportTicket,
  SupportMessage,
  SupportTicket,
  uploadSupportPhoto,
} from '../api/support';
import { AppText } from '../components';
import { useAppSelector } from '../store';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'SupportDetail'>;

function titleCase(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      });
}

function statusColor(status: string) {
  if (status.toLowerCase() === 'closed') return '#64748B';
  if (status.toLowerCase() === 'in_progress') return '#B45309';
  return '#078A73';
}

export function SupportDetailScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const token = useAppSelector(state => state.auth.session?.token);
  const [ticket, setTicket] = useState<SupportTicket>(route.params.ticket);
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<{
    uri: string;
    type?: string;
    fileName?: string;
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canReply = ticket.status.toLowerCase() !== 'closed';
  const color = statusColor(ticket.status);

  const choosePhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });
    const asset = result.assets?.[0];
    if (asset?.uri)
      setPhoto({ uri: asset.uri, type: asset.type, fileName: asset.fileName });
  };

  const sendReply = async () => {
    if (!token || (!message.trim() && !photo) || sending) return;
    setSending(true);
    setError(null);
    const text = message.trim();
    try {
      const remoteUrl = photo ? await uploadSupportPhoto(token, photo) : null;
      await replyToSupportTicket(
        token,
        ticket.support_id,
        text,
        remoteUrl
          ? { remoteUrl, type: photo?.type, fileName: photo?.fileName }
          : null,
      );
      const nextMessage: SupportMessage = {
        message_id: `local-${Date.now()}`,
        text,
        createdAt: new Date().toISOString(),
        sender_type: 'customer',
        attachments: remoteUrl
          ? [
              {
                type: 'image',
                url: remoteUrl,
                mime_type: photo?.type,
                name: photo?.fileName,
              },
            ]
          : [],
      };
      setTicket(current => ({
        ...current,
        messages: [...current.messages, nextMessage],
      }));
      setMessage('');
      setPhoto(null);
    } catch (replyError) {
      setError(
        replyError instanceof Error
          ? replyError.message
          : 'Unable to send reply.',
      );
    } finally {
      setSending(false);
    }
  };

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
        <View style={styles.headerCopy}>
          <AppText style={styles.headerTitle} weight="800">
            Support request
          </AppText>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.safe}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.summary,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.summaryAccent,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <View style={styles.summaryTop}>
              <View style={styles.summaryCopy}>
                <AppText
                  color={theme.colors.primary}
                  style={styles.reference}
                  weight="800"
                >
                  REQUEST #{ticket.support_id}
                </AppText>
                <AppText style={styles.subject} weight="800">
                  {ticket.subject}
                </AppText>
              </View>
              <View style={[styles.status, { backgroundColor: `${color}1A` }]}>
                <AppText color={color} style={styles.statusText} weight="800">
                  {titleCase(ticket.status)}
                </AppText>
              </View>
            </View>
            <AppText color={theme.colors.textMuted} style={styles.description}>
              {ticket.description}
            </AppText>
            <View style={styles.summaryMeta}>
              <View
                style={[
                  styles.metaPill,
                  { backgroundColor: theme.colors.primarySoft },
                ]}
              >
                <AppText
                  color={theme.colors.primary}
                  style={styles.meta}
                  weight="700"
                >
                  {titleCase(ticket.type)}
                </AppText>
              </View>
              <View
                style={[
                  styles.metaPill,
                  { backgroundColor: theme.colors.surfaceMuted },
                ]}
              >
                <AppText color={theme.colors.textMuted} style={styles.meta}>
                  Priority: {titleCase(ticket.priority)}
                </AppText>
              </View>
            </View>
          </View>
          <AppText style={styles.messagesTitle} weight="800">
            Messages
          </AppText>
          <View style={styles.messages}>
            {ticket.messages.map(item => (
              <MessageBubble key={item.message_id} message={item} />
            ))}
            {!ticket.messages.length && (
              <AppText
                color={theme.colors.textMuted}
                style={styles.emptyMessages}
              >
                No messages yet.
              </AppText>
            )}
          </View>
        </ScrollView>
        <View
          style={[
            styles.composer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          {!canReply ? (
            <AppText color={theme.colors.textMuted} style={styles.closedText}>
              This support request is closed.
            </AppText>
          ) : (
            <>
              {photo && (
                <View style={styles.pendingImage}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.pendingImagePreview}
                  />
                  <Pressable
                    onPress={() => setPhoto(null)}
                    style={[
                      styles.removeImage,
                      { backgroundColor: theme.colors.surface },
                    ]}
                  >
                    <AppText
                      color={theme.colors.primary}
                      style={styles.removeImageText}
                      weight="800"
                    >
                      ×
                    </AppText>
                  </Pressable>
                </View>
              )}
              <Pressable
                onPress={choosePhoto}
                style={[
                  styles.attach,
                  { backgroundColor: theme.colors.primarySoft },
                ]}
              >
                <Camera color={theme.colors.primary} size={17} />
              </Pressable>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Write a message"
                placeholderTextColor={theme.colors.textMuted}
                multiline
                style={[
                  styles.messageInput,
                  {
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surfaceMuted,
                  },
                ]}
              />
              <Pressable
                disabled={(!message.trim() && !photo) || sending}
                onPress={sendReply}
                style={[
                  styles.send,
                  {
                    backgroundColor:
                      (!message.trim() && !photo) || sending
                        ? theme.colors.border
                        : theme.colors.primary,
                  },
                ]}
              >
                <Send color="#FFFFFF" size={17} />
              </Pressable>
            </>
          )}
          {!!error && (
            <AppText color={theme.colors.danger} style={styles.replyError}>
              {error}
            </AppText>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message }: { message: SupportMessage }) {
  const { theme } = useAppTheme();
  const mine = message.sender_type === 'customer';
  return (
    <View style={[styles.messageRow, mine ? styles.mine : styles.theirs]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: mine ? theme.colors.primary : theme.colors.surface,
            borderColor: mine ? theme.colors.primary : theme.colors.border,
          },
        ]}
      >
        <AppText
          color={mine ? '#FFFFFF' : theme.colors.text}
          style={styles.messageText}
        >
          {message.text || 'Image attachment'}
        </AppText>
        {message.attachments.map(attachment => (
          <Image
            key={attachment.url}
            source={{ uri: attachment.url }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        ))}
        <AppText
          color={mine ? '#FFFFFF' : theme.colors.textMuted}
          style={styles.messageTime}
        >
          {formatTime(message.createdAt)}
        </AppText>
      </View>
    </View>
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
  headerCopy: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, lineHeight: 20 },
  headerSpacer: { width: 36 },
  content: { padding: 16, paddingBottom: 24 },
  summary: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    overflow: 'hidden',
  },
  summaryAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryCopy: { flex: 1 },
  reference: { fontSize: 8, lineHeight: 10, letterSpacing: 0.6 },
  subject: { marginTop: 3, fontSize: 14, lineHeight: 18 },
  status: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  statusText: { fontSize: 8, lineHeight: 10 },
  description: { marginTop: 7, fontSize: 10, lineHeight: 14 },
  summaryMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 11,
    gap: 6,
  },
  metaPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  meta: { fontSize: 8, lineHeight: 10 },
  messagesTitle: { marginTop: 18, fontSize: 14, lineHeight: 18 },
  messages: { marginTop: 10, gap: 8 },
  messageRow: { flexDirection: 'row' },
  mine: { justifyContent: 'flex-end' },
  theirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  messageText: { fontSize: 10, lineHeight: 14 },
  messageImage: { width: 180, height: 130, borderRadius: 9, marginTop: 7 },
  messageTime: { marginTop: 4, fontSize: 7, lineHeight: 9 },
  emptyMessages: {
    textAlign: 'center',
    paddingVertical: 18,
    fontSize: 10,
    lineHeight: 14,
  },
  composer: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    flexWrap: 'wrap',
  },
  attach: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingImage: { width: '100%', height: 54 },
  pendingImagePreview: { width: 54, height: 54, borderRadius: 10 },
  removeImage: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  removeImageText: { fontSize: 14, lineHeight: 16 },
  messageInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 11,
    textAlignVertical: 'top',
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedText: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 10,
    lineHeight: 14,
  },
  replyError: {
    width: '100%',
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 12,
  },
});
