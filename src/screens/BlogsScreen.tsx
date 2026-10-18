import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Blog, getBlogs } from '../api/blogs';
import { AppText, Screen } from '../components';
import { useAppTheme } from '../theme';
import type { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'Blogs'>;

export function BlogsScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const [blogs, setBlogs] = useState<Blog[]>(route.params.blogs);

  useEffect(() => {
    let active = true;
    getBlogs()
      .then(items => {
        if (active) setBlogs(items);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <Screen contentContainerStyle={styles.content}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to home"
        onPress={() => navigation.goBack()}
        style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
      >
        <ArrowLeft color={theme.colors.text} size={20} />
      </Pressable>
      <AppText style={styles.heading} weight="800">
        All Blogs
      </AppText>
      <AppText color={theme.colors.textMuted} style={styles.subtitle}>
        Simple reads to help you feel prepared.
      </AppText>
      {blogs.map(blog => (
        <Pressable
          key={blog.blog_id}
          accessibilityRole="button"
          accessibilityLabel={`Read article: ${blog.name}`}
          onPress={() => navigation.navigate('Blog', { blog })}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {blog.banner?.url ? (
            <Image
              source={{ uri: blog.banner.url }}
              accessibilityLabel={blog.banner.alt || blog.name}
              resizeMode="cover"
              style={styles.image}
            />
          ) : (
            <View
              style={[
                styles.image,
                { backgroundColor: theme.colors.primarySoft },
              ]}
            />
          )}
          <View style={styles.copy}>
            <AppText
              color={theme.colors.primary}
              style={styles.tag}
              weight="800"
            >
              {(blog.tags?.[0]?.tag_name || 'HEALTHCARE').toUpperCase()}
            </AppText>
            <AppText style={styles.title} weight="700" numberOfLines={2}>
              {blog.name}
            </AppText>
            {blog.meta?.description ? (
              <AppText
                color={theme.colors.textMuted}
                style={styles.description}
                numberOfLines={2}
              >
                {blog.meta.description}
              </AppText>
            ) : null}
            <View style={styles.readRow}>
              <AppText
                color={theme.colors.primary}
                style={styles.read}
                weight="700"
              >
                Read article →
              </AppText>
            </View>
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 36 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  heading: { fontSize: 18, lineHeight: 21, letterSpacing: -0.4 },
  subtitle: { marginTop: 3, marginBottom: 11, fontSize: 11, lineHeight: 15 },
  card: {
    flexDirection: 'row',
    minHeight: 146,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 10,
  },
  image: { width: 112, height: '100%', minHeight: 146 },
  copy: { flex: 1, paddingHorizontal: 12, paddingVertical: 13 },
  tag: { fontSize: 9, lineHeight: 12, letterSpacing: 0.5 },
  title: { marginTop: 6, fontSize: 14, lineHeight: 18 },
  description: { marginTop: 5, fontSize: 10, lineHeight: 14 },
  readRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },
  read: { fontSize: 11, lineHeight: 15 },
});
