import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Camera from 'lucide-react-native/icons/camera';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Trash from 'lucide-react-native/icons/trash';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createFamilyMember,
  deleteFamilyMember,
  FamilyMemberInput,
  updateFamilyMember,
  uploadProfileImage,
} from '../api/familyMembers';
import { AppText } from '../components';
import { useAppSelector } from '../store';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyMemberForm'>;
const relations = [
  'self',
  'husband',
  'wife',
  'father',
  'mother',
  'son',
  'daughter',
  'sibling',
  'friend',
  'other',
];
const genders = ['male', 'female', 'other'];

export function FamilyMemberFormScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const token = useAppSelector(state => state.auth.session?.token);
  const member = route.params?.member;
  const [name, setName] = useState(member?.name ?? '');
  const [age, setAge] = useState(member ? String(member.age) : '');
  const [gender, setGender] = useState(member?.gender.toLowerCase() ?? '');
  const [relation, setRelation] = useState(
    member?.relation.toLowerCase() ?? '',
  );
  const [phone, setPhone] = useState(member?.phone ?? '');
  const [photoUrl, setPhotoUrl] = useState(member?.profilePhoto ?? null);
  const [photoFile, setPhotoFile] = useState<{
    uri: string;
    type?: string;
    fileName?: string;
  } | null>(null);
  const [isDefault, setIsDefault] = useState(member?.isDefault ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const revealFormFields = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
  };

  const choosePhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });
    const asset = result.assets?.[0];
    if (asset?.uri) {
      setPhotoFile({
        uri: asset.uri,
        type: asset.type,
        fileName: asset.fileName,
      });
      setPhotoUrl(asset.uri);
    }
  };

  const save = async () => {
    if (!token) return;
    const numericAge = Number(age);
    if (
      !name.trim() ||
      !relation ||
      !gender ||
      !Number.isInteger(numericAge) ||
      numericAge < 0 ||
      numericAge > 120
    ) {
      setError('Enter a name, valid age, gender and relationship.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const uploadedPhoto = photoFile
        ? await uploadProfileImage(token, photoFile)
        : photoUrl;
      const input: FamilyMemberInput = {
        name: name.trim(),
        age: numericAge,
        gender,
        relation,
        phone: phone.trim() || null,
        profilePhoto: uploadedPhoto,
        isDefault,
      };
      if (member) await updateFamilyMember(token, member.member_id, input);
      else await createFamilyMember(token, input);
      navigation.goBack();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save family member.',
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!token || !member) return;
    Alert.alert(
      'Delete family member?',
      `${member.name} will be removed from your saved profiles.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await deleteFamilyMember(token, member.member_id);
              navigation.goBack();
            } catch (deleteError) {
              setError(
                deleteError instanceof Error
                  ? deleteError.message
                  : 'Unable to delete family member.',
              );
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.background,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <Pressable
            onPress={navigation.goBack}
            style={[styles.back, { backgroundColor: theme.colors.surface }]}
          >
            <ChevronLeft color={theme.colors.text} size={20} />
          </Pressable>
          <AppText style={styles.headerTitle} weight="800">
            {member ? 'Edit family member' : 'Add family member'}
          </AppText>
          <View style={styles.headerSpacer} />
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === 'ios' ? 'interactive' : 'on-drag'
            }
            showsVerticalScrollIndicator={false}
          >
            <Pressable onPress={choosePhoto} style={styles.photoWrap}>
              <View
                style={[
                  styles.photo,
                  {
                    backgroundColor: theme.colors.primarySoft,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.photoImage} />
                ) : (
                  <AppText
                    color={theme.colors.primary}
                    style={styles.photoInitial}
                    weight="800"
                  >
                    {name.trim().charAt(0).toUpperCase() || '?'}
                  </AppText>
                )}
              </View>
              <View
                style={[
                  styles.camera,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Camera color="#FFFFFF" size={15} />
              </View>
            </Pressable>
            <AppText color={theme.colors.textMuted} style={styles.photoHint}>
              Tap to add a profile photo
            </AppText>

            <View
              style={[
                styles.form,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Field
                label="Full name *"
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
              />
              <Field
                label="Age *"
                value={age}
                onChangeText={value =>
                  setAge(value.replace(/\D/g, '').slice(0, 3))
                }
                placeholder="Age"
                keyboardType="number-pad"
              />
              <Choice
                label="Gender *"
                options={genders}
                value={gender}
                onChange={setGender}
              />
              <Choice
                label="Relationship *"
                options={relations}
                value={relation}
                onChange={setRelation}
              />
              <Field
                label="Phone number"
                value={phone}
                onChangeText={value =>
                  setPhone(value.replace(/[^+\d]/g, '').slice(0, 14))
                }
                onFocus={revealFormFields}
                placeholder="Optional phone number"
                keyboardType="phone-pad"
              />
              <Pressable
                onPress={() => setIsDefault(value => !value)}
                style={styles.defaultRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: isDefault
                        ? theme.colors.primary
                        : theme.colors.border,
                      backgroundColor: isDefault
                        ? theme.colors.primary
                        : theme.colors.surface,
                    },
                  ]}
                >
                  {isDefault && (
                    <AppText color="#FFFFFF" style={styles.check} weight="800">
                      ✓
                    </AppText>
                  )}
                </View>
                <View style={styles.grow}>
                  <AppText style={styles.defaultTitle} weight="700">
                    Make default member
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.defaultText}
                  >
                    Use this profile first when assigning tests.
                  </AppText>
                </View>
              </Pressable>
            </View>
            {!!error && (
              <AppText color={theme.colors.danger} style={styles.error}>
                {error}
              </AppText>
            )}
            <Pressable
              disabled={saving}
              onPress={save}
              style={[
                styles.save,
                {
                  backgroundColor: saving
                    ? theme.colors.border
                    : theme.colors.primary,
                },
              ]}
            >
              <AppText color="#FFFFFF" style={styles.saveText} weight="800">
                {saving
                  ? 'Saving…'
                  : member
                  ? 'Save changes'
                  : 'Add family member'}
              </AppText>
            </Pressable>
            {!!member && (
              <Pressable
                disabled={saving}
                onPress={confirmDelete}
                style={[styles.delete, { borderColor: theme.colors.primary }]}
              >
                <Trash color={theme.colors.primary} size={16} />
                <AppText
                  color={theme.colors.primary}
                  style={styles.deleteText}
                  weight="800"
                >
                  Delete family member
                </AppText>
              </Pressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onFocus?: () => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad';
}) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.field}>
      <AppText style={styles.label} weight="700">
        {props.label}
      </AppText>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        onFocus={props.onFocus}
        placeholder={props.placeholder}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType={props.keyboardType}
        style={[
          styles.input,
          {
            color: theme.colors.text,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceMuted,
          },
        ]}
      />
    </View>
  );
}
function Choice({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.field}>
      <AppText style={styles.label} weight="700">
        {label}
      </AppText>
      <View style={styles.choices}>
        {options.map(option => (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[
              styles.choice,
              {
                borderColor:
                  value === option ? theme.colors.primary : theme.colors.border,
                backgroundColor:
                  value === option
                    ? theme.colors.primarySoft
                    : theme.colors.surface,
              },
            ]}
          >
            <AppText
              color={
                value === option ? theme.colors.primary : theme.colors.textMuted
              }
              style={styles.choiceText}
              weight="700"
            >
              {option}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  content: { padding: 16, paddingBottom: 150 },
  photoWrap: { alignSelf: 'center', marginTop: 4 },
  photo: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%' },
  photoInitial: { fontSize: 28, lineHeight: 32 },
  camera: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: { marginTop: 7, textAlign: 'center', fontSize: 9, lineHeight: 12 },
  form: { borderWidth: 1, borderRadius: 18, marginTop: 18, padding: 13 },
  field: { marginBottom: 15 },
  label: { marginBottom: 7, fontSize: 11, lineHeight: 14 },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 12,
  },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: { fontSize: 9, lineHeight: 12, textTransform: 'capitalize' },
  defaultRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { fontSize: 12, lineHeight: 14 },
  grow: { flex: 1 },
  defaultTitle: { fontSize: 10, lineHeight: 13 },
  defaultText: { marginTop: 2, fontSize: 8, lineHeight: 11 },
  error: { marginTop: 10, textAlign: 'center', fontSize: 10, lineHeight: 14 },
  save: {
    minHeight: 50,
    borderRadius: 14,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { fontSize: 12, lineHeight: 16 },
  delete: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  deleteText: { fontSize: 10, lineHeight: 13 },
});
