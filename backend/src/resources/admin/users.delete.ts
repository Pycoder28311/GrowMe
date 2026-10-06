import type { Store } from '../../lib/crud'

// Comment ids in the threads the user started or joined: their comments and every answer under them
// (answers are deleted with them: blog_comments.parent_comment_id cascades)
const USER_THREADS = `(
  WITH RECURSIVE thread(id) AS (
    SELECT id FROM blog_comments WHERE user_id = ?1
    UNION
    SELECT c.id FROM blog_comments c JOIN thread ON c.parent_comment_id = thread.id
  ) SELECT id FROM thread)`

const OWN_POSTS = '(SELECT id FROM posts WHERE user_id = ?1)'

/** like_count fix for one liked type: minus the user's likes (dislikes aren't counted) */
const undoLikes = (table: string, type: string) => `
  UPDATE ${table} SET like_count = like_count - (
    SELECT count(*) FROM likes WHERE liked_type = '${type}' AND liked_id = ${table}.id AND user_id = ?1 AND is_like = 1)
  WHERE id IN (SELECT liked_id FROM likes WHERE liked_type = '${type}' AND user_id = ?1 AND is_like = 1)`

/** Every statement of a user's deletion, in order; ?1 is the user's id */
const STEPS = [
  // 1. Their likes, taken back from the counts, then deleted
  undoLikes('posts', 'post'),
  undoLikes('post_replies', 'post_reply'),
  undoLikes('blogs', 'blog'),
  undoLikes('blog_comments', 'blog_comment'),
  'DELETE FROM likes WHERE user_id = ?1',
  // 2. Their replies on other people's posts leave those posts' reply counts
  `UPDATE posts SET reply_count = reply_count - (
     SELECT count(*) FROM post_replies r WHERE r.post_id = posts.id AND r.user_id = ?1)
   WHERE user_id != ?1 AND id IN (SELECT post_id FROM post_replies WHERE user_id = ?1)`,
  // 3. Their comment threads leave the blogs' comment counts
  `UPDATE blogs SET comment_count = comment_count - (
     SELECT count(*) FROM blog_comments c WHERE c.blog_id = blogs.id AND c.id IN ${USER_THREADS})
   WHERE id IN (SELECT blog_id FROM blog_comments WHERE user_id = ?1)`,
  // 4. Likes on everything that is about to be deleted (likes have no foreign key)
  `DELETE FROM likes WHERE liked_type = 'post' AND liked_id IN ${OWN_POSTS}`,
  `DELETE FROM likes WHERE liked_type = 'post_reply' AND liked_id IN (
     SELECT id FROM post_replies WHERE user_id = ?1 OR post_id IN ${OWN_POSTS})`,
  `DELETE FROM likes WHERE liked_type = 'blog_comment' AND liked_id IN ${USER_THREADS}`,
  // 5. Notes (their user_id has no cascade), then the user: sessions, accounts, posts, replies,
  //    comments and image rows cascade
  'DELETE FROM notes WHERE user_id = ?1',
  'DELETE FROM "user" WHERE id = ?1',
]

/**
 * Deletes a user and everything they made in one transaction, keeping other people's counters right:
 * their likes are taken back, their replies and comment threads leave the counts of the posts and
 * blogs they were on, and the likes of everything deleted go too. Their photos leave R2 afterwards.
 * Returns false when there is no such user.
 */
export async function deleteUser({ env }: Store, userId: string) {
  const d1 = env.DB
  const found = await d1.prepare('SELECT id FROM "user" WHERE id = ?1').bind(userId).first()
  if (!found) return false
  const { results } = await d1.prepare('SELECT key FROM images WHERE user_id = ?1').bind(userId).all<{ key: string }>()

  await d1.batch(STEPS.map((step) => d1.prepare(step).bind(userId)))
  if (results.length > 0) await env.BUCKET.delete(results.map((r) => r.key))
  return true
}
