import X from 'lucide-react-native/icons/x';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductSubCategory } from '../../api/productCategories';
import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';

export type CategoryProductFilters = {
  subCategoryId: number | null;
  sort: 'default' | 'low' | 'high';
};

type Props = {
  visible: boolean;
  subCategories: ProductSubCategory[];
  value: CategoryProductFilters;
  onClose: () => void;
  onApply: (value: CategoryProductFilters) => void;
};

export function CategoryProductsFilterSheet({
  visible,
  subCategories,
  value,
  onClose,
  onApply,
}: Props) {
  const { theme } = useAppTheme();
  const [draft, setDraft] = useState<CategoryProductFilters>(value);
  useEffect(() => {
    if (visible) setDraft(value);
  }, [value, visible]);

  const sortChoice = (label: string, sort: CategoryProductFilters['sort']) => {
    const selected = draft.sort === sort;
    return (
      <Pressable
        key={sort}
        onPress={() => setDraft(current => ({ ...current, sort }))}
        style={[
          styles.sortChoice,
          {
            borderColor: selected ? theme.colors.primary : theme.colors.border,
            backgroundColor: selected
              ? theme.colors.primarySoft
              : theme.colors.surface,
          },
        ]}
      >
        <View
          style={[
            styles.radio,
            {
              borderColor: selected
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
        >
          {selected ? (
            <View
              style={[
                styles.radioDot,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          ) : null}
        </View>
        <AppText
          color={selected ? theme.colors.primary : theme.colors.text}
          style={styles.sortText}
          weight={selected ? '700' : '500'}
        >
          {label}
        </AppText>
      </Pressable>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent
      statusBarTranslucent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <Pressable
          accessibilityLabel="Close filters"
          style={styles.backdrop}
          onPress={onClose}
        />
        <SafeAreaView
          edges={['bottom']}
          style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.header}>
            <AppText style={styles.title} weight="800">
              Filter products
            </AppText>
            <Pressable
              accessibilityLabel="Close filters"
              onPress={onClose}
              style={[
                styles.close,
                { backgroundColor: theme.colors.surfaceMuted },
              ]}
            >
              <X color={theme.colors.text} size={20} />
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <AppText style={styles.label} weight="800">
              Subcategories
            </AppText>
            <View style={styles.subCategories}>
              <Pressable
                onPress={() =>
                  setDraft(current => ({ ...current, subCategoryId: null }))
                }
                style={[
                  styles.subCategory,
                  {
                    borderColor:
                      draft.subCategoryId === null
                        ? theme.colors.primary
                        : theme.colors.border,
                    backgroundColor:
                      draft.subCategoryId === null
                        ? theme.colors.primarySoft
                        : theme.colors.surface,
                  },
                ]}
              >
                <AppText
                  color={
                    draft.subCategoryId === null
                      ? theme.colors.primary
                      : theme.colors.text
                  }
                  style={styles.subCategoryText}
                  weight="800"
                >
                  All
                </AppText>
              </Pressable>
              {subCategories.map(item => {
                const selected = draft.subCategoryId === item.sub_category_id;
                return (
                  <Pressable
                    key={item.sub_category_id}
                    onPress={() =>
                      setDraft(current => ({
                        ...current,
                        subCategoryId: item.sub_category_id,
                      }))
                    }
                    style={[
                      styles.subCategory,
                      {
                        borderColor: selected
                          ? theme.colors.primary
                          : theme.colors.border,
                        backgroundColor: selected
                          ? theme.colors.primarySoft
                          : theme.colors.surface,
                      },
                    ]}
                  >
                    {item.image?.url ? (
                      <Image
                        source={{ uri: item.image.url }}
                        style={styles.subCategoryImage}
                      />
                    ) : null}
                    <AppText
                      color={
                        selected ? theme.colors.primary : theme.colors.text
                      }
                      numberOfLines={2}
                      style={styles.subCategoryText}
                      weight="800"
                    >
                      {item.sub_category_name}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            <AppText style={styles.label} weight="800">
              Sort by price
            </AppText>
            <View style={styles.sortOptions}>
              {sortChoice('Default', 'default')}
              {sortChoice('Low to high', 'low')}
              {sortChoice('High to low', 'high')}
            </View>
          </ScrollView>
          <View style={styles.actions}>
            <Pressable
              onPress={() => setDraft({ subCategoryId: null, sort: 'default' })}
              style={[styles.clear, { borderColor: theme.colors.border }]}
            >
              <AppText style={styles.actionText} weight="700">
                Clear all
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => onApply(draft)}
              style={[styles.apply, { backgroundColor: theme.colors.primary }]}
            >
              <AppText color="#FFFFFF" style={styles.actionText} weight="800">
                Apply filters
              </AppText>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
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
    backgroundColor: 'rgba(2,6,23,.5)',
  },
  sheet: {
    maxHeight: '75%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: { fontSize: 21, lineHeight: 26 },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingBottom: 6 },
  label: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  subCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  subCategory: {
    minHeight: 44,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  subCategoryImage: { width: 30, height: 30, borderRadius: 8 },
  subCategoryText: { flexShrink: 1, fontSize: 10, lineHeight: 13 },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  sortChoice: {
    minHeight: 39,
    borderWidth: 1,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },
  radio: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 7, height: 7, borderRadius: 4 },
  sortText: { fontSize: 10, lineHeight: 13 },
  actions: { flexDirection: 'row', gap: 10, paddingTop: 10, paddingBottom: 12 },
  clear: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apply: {
    flex: 1.5,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontSize: 12, lineHeight: 16 },
});
