import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createFamilyMember } from '../api/familyMembers';
import { AppText } from '../components';
import { useAppDispatch, useAppSelector } from '../store';
import { finishFirstFamilyMemberSetup } from '../store/authSlice';
import { useAppTheme } from '../theme';

const relations = [
  'self',
  'husband',
  'wife',
  'father',
  'mother',
  'son',
  'daughter',
  'sibling',
  'other',
];
const genders = ['male', 'female', 'other'];

export function FirstFamilyMemberScreen() {
  const { theme } = useAppTheme();
  const dispatch = useAppDispatch();
  const token = useAppSelector(state => state.auth.session?.token);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [relation, setRelation] = useState('self');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async () => {
    await dispatch(finishFirstFamilyMemberSetup()).unwrap();
  };

  const save = async () => {
    if (!token || saving) return;
    const numericAge = Number(age);
    if (
      !name.trim() ||
      !Number.isInteger(numericAge) ||
      numericAge < 0 ||
      numericAge > 120 ||
      !gender
    ) {
      setError('Enter a name, valid age, and gender.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createFamilyMember(token, {
        name: name.trim(),
        age: numericAge,
        gender,
        relation,
        phone: phone.trim() || null,
        profilePhoto: null,
        isDefault: true,
      });
      await finish();
      Toast.show({ type: 'success', text1: 'Family member added' });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to add family member.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <AppText
                color={theme.colors.primary}
                style={styles.eyebrow}
                weight="800"
              >
                ONE QUICK STEP
              </AppText>
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={finish}
              >
                <AppText color={theme.colors.textMuted} weight="700">
                  Skip for now
                </AppText>
              </Pressable>
            </View>
            <AppText style={styles.title} weight="800">
              Add your first family member
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.subtitle}>
              Save a profile for booking tests and receiving reports. You can
              add more family members later.
            </AppText>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <AppText style={styles.label} weight="700">
                Full name *
              </AppText>
              <TextInput
                accessibilityLabel="Family member name"
                autoCapitalize="words"
                onChangeText={setName}
                placeholder="Enter full name"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={name}
              />

              <AppText style={styles.label} weight="700">
                Age *
              </AppText>
              <TextInput
                accessibilityLabel="Family member age"
                keyboardType="number-pad"
                onChangeText={value =>
                  setAge(value.replace(/\D/g, '').slice(0, 3))
                }
                placeholder="Age"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={age}
              />

              <AppText style={styles.label} weight="700">
                Gender *
              </AppText>
              <View style={styles.choices}>
                {genders.map(option => (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: gender === option }}
                    onPress={() => setGender(option)}
                    style={[
                      styles.choice,
                      {
                        borderColor:
                          gender === option
                            ? theme.colors.primary
                            : theme.colors.border,
                        backgroundColor:
                          gender === option
                            ? theme.colors.primarySoft
                            : theme.colors.surface,
                      },
                    ]}
                  >
                    <AppText
                      color={
                        gender === option
                          ? theme.colors.primary
                          : theme.colors.text
                      }
                      style={styles.choiceText}
                      weight="700"
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <AppText style={styles.label} weight="700">
                Relationship *
              </AppText>
              <View style={styles.choices}>
                {relations.map(option => (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: relation === option }}
                    onPress={() => setRelation(option)}
                    style={[
                      styles.choice,
                      {
                        borderColor:
                          relation === option
                            ? theme.colors.primary
                            : theme.colors.border,
                        backgroundColor:
                          relation === option
                            ? theme.colors.primarySoft
                            : theme.colors.surface,
                      },
                    ]}
                  >
                    <AppText
                      color={
                        relation === option
                          ? theme.colors.primary
                          : theme.colors.text
                      }
                      style={styles.choiceText}
                      weight="700"
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <AppText style={styles.label} weight="700">
                Phone number (optional)
              </AppText>
              <TextInput
                accessibilityLabel="Family member phone number"
                keyboardType="phone-pad"
                onChangeText={value =>
                  setPhone(value.replace(/[^+\d]/g, '').slice(0, 14))
                }
                placeholder="Phone number"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={phone}
              />
              <AppText
                color={theme.colors.textMuted}
                style={styles.defaultNote}
              >
                This member will be your default profile for bookings.
              </AppText>
            </View>
            {error && (
              <AppText
                accessibilityRole="alert"
                color={theme.colors.danger}
                style={styles.error}
              >
                {error}
              </AppText>
            )}
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={save}
              style={[
                styles.saveButton,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              {saving ? (
                <ActivityIndicator color={theme.colors.onPrimary} />
              ) : (
                <AppText color={theme.colors.onPrimary} weight="800">
                  Save and continue
                </AppText>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: { fontSize: 10, letterSpacing: 1 },
  title: { fontSize: 27, lineHeight: 32, marginTop: 22 },
  subtitle: { fontSize: 13, lineHeight: 18, marginTop: 8, marginBottom: 20 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16 },
  label: { fontSize: 12, lineHeight: 16, marginTop: 12, marginBottom: 7 },
  input: {
    height: 46,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 36,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: { fontSize: 11 },
  defaultNote: { fontSize: 11, lineHeight: 15, marginTop: 16 },
  error: { fontSize: 12, marginTop: 12 },
  saveButton: {
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
});
