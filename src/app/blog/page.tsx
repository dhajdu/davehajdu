import { listPosts } from '@/lib/blog/posts';
import BlogIndex from './BlogIndex';

// Static, refreshed hourly until publishing revalidates on demand (marketing phase 2).
export const revalidate = 3600;

export default async function BlogPage() {
  return <BlogIndex posts={await listPosts()} />;
}
