import Check from 'lucide-react-native/icons/check';
import Plus from 'lucide-react-native/icons/plus';
import UserRound from 'lucide-react-native/icons/user-round';
import X from 'lucide-react-native/icons/x';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FamilyMember } from '../../api/familyMembers';
import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';

type Props = {
  visible: boolean;
  members: FamilyMember[];
  selectedIds: number[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onSelect: (member: FamilyMember) => void;
  onCreate: () => void;
};
export function FamilyMembersSheet({
  visible,
  members,
  selectedIds,
  loading,
  error,
  onClose,
  onRetry,
  onSelect,
  onCreate,
}: Props) {
  const { theme } = useAppTheme();
  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <SafeAreaView
          edges={['bottom']}
          style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
        >
          <View
            style={[styles.handle, { backgroundColor: theme.colors.border }]}
          />
          <View style={styles.header}>
            <View>
              <AppText style={styles.title} weight="800">
                Choose family member
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.subtitle}>
                Assign selected tests to this person
              </AppText>
            </View>
            <Pressable
              onPress={onClose}
              style={[
                styles.close,
                { backgroundColor: theme.colors.surfaceMuted },
              ]}
            >
              <X color={theme.colors.text} size={19} />
            </Pressable>
          </View>
          {loading ? (
            <View style={styles.state}>
              <ActivityIndicator color={theme.colors.primary} />
              <AppText color={theme.colors.textMuted} style={styles.stateText}>
                Loading family members…
              </AppText>
            </View>
          ) : error ? (
            <View style={styles.state}>
              <AppText style={styles.stateTitle} weight="700">
                Could not load family members
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.stateText}>
                {error}
              </AppText>
              <Pressable
                onPress={onRetry}
                style={[
                  styles.retry,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <AppText color="#FFFFFF" style={styles.retryText} weight="700">
                  Try again
                </AppText>
              </Pressable>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {members.map(member => {
                const selected = selectedIds.includes(member.member_id);
                return (
                  <Pressable
                    key={member.member_id}
                    disabled={selected}
                    onPress={() => onSelect(member)}
                    style={[
                      styles.member,
                      selected && styles.selectedMember,
                      { borderBottomColor: theme.colors.border },
                    ]}
                  >
                    <MemberPhoto member={member} />
                    <View style={styles.copy}>
                      <AppText style={styles.name} weight="700">
                        {member.name}
                      </AppText>
                      <AppText
                        color={theme.colors.textMuted}
                        style={styles.meta}
                      >
                        {member.age} yrs · {member.gender} · {member.relation}
                      </AppText>
                      {member.phone && (
                        <AppText
                          color={theme.colors.textMuted}
                          style={styles.meta}
                        >
                          {member.phone}
                        </AppText>
                      )}
                    </View>
                    {selected && (
                      <View style={styles.selectedStatus}>
                        <View style={styles.selected}>
                          <Check color="#078A73" size={13} />
                        </View>
                        <AppText
                          color="#078A73"
                          style={styles.selectedText}
                          weight="700"
                        >
                          Added
                        </AppText>
                      </View>
                    )}
                  </Pressable>
                );
              })}
              {!members.length && (
                <View style={styles.state}>
                  <AppText style={styles.stateTitle} weight="700">
                    No family members found
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.stateText}
                  >
                    Create a family member to assign tests.
                  </AppText>
                </View>
              )}
              <Pressable
                onPress={onCreate}
                style={[
                  styles.create,
                  {
                    backgroundColor: theme.colors.primarySoft,
                    borderColor: theme.colors.primary,
                  },
                ]}
              >
                <Plus color={theme.colors.primary} size={16} />
                <AppText
                  color={theme.colors.primary}
                  style={styles.createText}
                  weight="800"
                >
                  Create family member
                </AppText>
              </Pressable>
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function MemberPhoto({ member }: { member: FamilyMember }) {
  const { theme } = useAppTheme();
  const [failed, setFailed] = React.useState(false);

  if (member.profilePhoto && !failed) {
    return (
      <Image
        source={{ uri: member.profilePhoto }}
        style={styles.photo}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View style={[styles.photo, { backgroundColor: theme.colors.primarySoft }]}>
      <UserRound color={theme.colors.primary} size={19} />
    </View>
  );
}
const styles = StyleSheet.create({
  modal: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(2,6,23,.55)',
  },
  sheet: {
    maxHeight: '72%',
    minHeight: 350,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  title: { fontSize: 18, lineHeight: 22 },
  subtitle: { marginTop: 2, fontSize: 9, lineHeight: 12 },
  close: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  member: {
    minHeight: 66,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
  },
  selectedMember: { opacity: 0.72 },
  photo: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  name: { fontSize: 12, lineHeight: 16 },
  meta: { marginTop: 2, fontSize: 8, lineHeight: 10 },
  selected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCF7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedStatus: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  selectedText: { fontSize: 8, lineHeight: 10 },
  state: { alignItems: 'center', paddingVertical: 42, paddingHorizontal: 24 },
  stateTitle: { fontSize: 13, lineHeight: 17 },
  stateText: { marginTop: 6, textAlign: 'center', fontSize: 9, lineHeight: 12 },
  retry: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9,
  },
  retryText: { fontSize: 9, lineHeight: 12 },
  create: {
    minHeight: 44,
    marginTop: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  createText: { fontSize: 10, lineHeight: 13 },
});
