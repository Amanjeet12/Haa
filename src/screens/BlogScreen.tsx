import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Blog, getBlog } from '../api/blogs';
import { AppText, Screen } from '../components';
import { useAppTheme } from '../theme';
import type { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'Blog'>;

function plainText(value: string) {
  return value
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function BlogScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const [blog, setBlog] = useState<Blog>(route.params.blog);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [bannerAspectRatio, setBannerAspectRatio] = useState(1.7);

  useEffect(() => {
    let active = true;
    getBlog(route.params.blog.slug)
      .then(item => {
        if (active) setBlog(item);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [route.params.blog.slug]);

  useEffect(() => {
    if (!blog.banner?.url) return;
    let active = true;
    Image.getSize(
      blog.banner.url,
      (width, height) => {
        if (active && height > 0) setBannerAspectRatio(width / height);
      },
      () => {},
    );
    return () => {
      active = false;
    };
  }, [blog.banner?.url]);

  const article = blog.content || blog.body;
  const date = blog.createdAt ? new Date(blog.createdAt) : null;

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

      <AppText color={theme.colors.primary} style={styles.eyebrow} weight="800">
        {(blog.tags?.[0]?.tag_name || 'HEALTHCARE').toUpperCase()}
      </AppText>
      <AppText style={styles.title} weight="800">
        {blog.name}
      </AppText>
      <View style={styles.metaRow}>
        <AppText color={theme.colors.textMuted} style={styles.meta}>
          {blog.meta?.author || 'Haa Healthcare'}
          {date && !Number.isNaN(date.getTime())
            ? `  ·  ${date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}`
            : ''}
        </AppText>
      </View>

      {blog.banner?.url ? (
        <Image
          accessibilityLabel={blog.banner.alt || blog.name}
          source={{ uri: blog.banner.url }}
          resizeMode="contain"
          style={[styles.banner, { aspectRatio: bannerAspectRatio }]}
        />
      ) : null}

      {blog.meta?.description ? (
        <AppText style={styles.intro} weight="600">
          {blog.meta.description}
        </AppText>
      ) : null}

      {loading ? (
        <ActivityIndicator
          color={theme.colors.primary}
          style={styles.loading}
        />
      ) : null}
      {article ? (
        <AppText color={theme.colors.text} style={styles.body}>
          {plainText(article)}
        </AppText>
      ) : !loading ? (
        <AppText color={theme.colors.textMuted} style={styles.status}>
          {loadError
            ? 'The full article could not be loaded right now.'
            : 'The full article is not available yet.'}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 36 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1 },
  title: { marginTop: 10, fontSize: 27, lineHeight: 34, letterSpacing: -0.6 },
  metaRow: { marginTop: 14, marginBottom: 22 },
  meta: { fontSize: 11, lineHeight: 16 },
  banner: { width: '100%', borderRadius: 18 },
  intro: { marginTop: 24, fontSize: 16, lineHeight: 24 },
  body: { marginTop: 22, fontSize: 14, lineHeight: 23 },
  loading: { marginTop: 26 },
  status: { marginTop: 24, fontSize: 13, lineHeight: 20 },
});
