import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';

export type Blog = {
  blog_id: number;
  name: string;
  slug: string;
  banner?: { alt?: string; url?: string };
  meta?: { description?: string; author?: string };
  createdAt?: string;
  tags?: Array<{ blog_tag_id: number; tag_name: string; slug: string }>;
  content?: string;
  contentHtml?: string;
  body?: string;
  description?: string;
};

type BlogsResponse = {
  success: number | string;
  msg: string;
  data: Blog[];
};

export async function getBlogs(): Promise<Blog[]> {
  const response = await apiRequest<BlogsResponse>(
    `${apiBaseUrl}/customer/blogs?start=0&end=19`,
  );
  if (Number(response.success) !== 1 || !Array.isArray(response.data)) {
    throw new Error(response.msg || 'Unable to fetch blogs.');
  }
  return response.data;
}

export async function getBlog(blogId: number): Promise<Blog> {
  const response = await apiRequest<{
    success: number | string;
    msg: string;
    data: Blog;
  }>(`${apiBaseUrl}/customer/blogs/${encodeURIComponent(blogId)}`);
  if (Number(response.success) !== 1 || !response.data) {
    throw new Error(response.msg || 'Unable to fetch blog.');
  }
  return response.data;
}
