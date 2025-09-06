import { get, onValue, push, ref, remove, set, update } from 'firebase/database';
import { database } from '../config/firebase';

class PostServiceClass {
  // Create a new post
  async createPost(userId, postData) {
    try {
      const postsRef = ref(database, 'posts');
      const newPostRef = push(postsRef);

      const post = {
        id: newPostRef.key,
        authorId: userId,
        content: postData.content,
        imageUrl: postData.imageUrl || null,
        timestamp: new Date().toISOString(),
        likes: {},
        comments: {},
        shares: 0,
        likesCount: 0,
        commentsCount: 0,
      };

      await set(newPostRef, post);
      return { success: true, post };
    } catch (error) {
      console.error('Error creating post:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all posts with real-time updates
  subscribeToPosts(callback) {
    const postsRef = ref(database, 'posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const posts = [];
      snapshot.forEach((childSnapshot) => {
        posts.push(childSnapshot.val());
      });
      // Sort by timestamp (newest first)
      posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      callback(posts);
    });

    return unsubscribe;
  }

  // Get posts by user
  async getUserPosts(userId) {
    try {
      const postsRef = ref(database, 'posts');
      const snapshot = await get(postsRef);

      const userPosts = [];
      snapshot.forEach((childSnapshot) => {
        const post = childSnapshot.val();
        if (post.authorId === userId) {
          userPosts.push(post);
        }
      });

      // Sort by timestamp (newest first)
      userPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return { success: true, posts: userPosts };
    } catch (error) {
      console.error('Error getting user posts:', error);
      return { success: false, error: error.message };
    }
  }

  // Like/Unlike a post
  async toggleLike(postId, userId) {
    try {
      const postRef = ref(database, `posts/${postId}`);
      const snapshot = await get(postRef);

      if (!snapshot.exists()) {
        return { success: false, error: 'Post not found' };
      }

      const post = snapshot.val();
      const likes = post.likes || {};
      const isLiked = likes[userId];

      if (isLiked) {
        // Unlike
        delete likes[userId];
        post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
      } else {
        // Like
        likes[userId] = true;
        post.likesCount = (post.likesCount || 0) + 1;
      }

      await update(postRef, {
        likes,
        likesCount: post.likesCount
      });

      return { success: true, isLiked: !isLiked, likesCount: post.likesCount };
    } catch (error) {
      console.error('Error toggling like:', error);
      return { success: false, error: error.message };
    }
  }

  // Add a comment to a post
  async addComment(postId, userId, commentData) {
    try {
      const commentsRef = ref(database, `posts/${postId}/comments`);
      const newCommentRef = push(commentsRef);

      const comment = {
        id: newCommentRef.key,
        authorId: userId,
        content: commentData.content,
        timestamp: new Date().toISOString(),
        likes: {},
        likesCount: 0,
      };

      await set(newCommentRef, comment);

      // Update comment count
      const postRef = ref(database, `posts/${postId}`);
      const snapshot = await get(postRef);
      const post = snapshot.val();
      const commentsCount = (post.commentsCount || 0) + 1;

      await update(postRef, { commentsCount });

      return { success: true, comment, commentsCount };
    } catch (error) {
      console.error('Error adding comment:', error);
      return { success: false, error: error.message };
    }
  }

  // Get comments for a post
  subscribeToComments(postId, callback) {
    const commentsRef = ref(database, `posts/${postId}/comments`);
    const unsubscribe = onValue(commentsRef, (snapshot) => {
      const comments = [];
      snapshot.forEach((childSnapshot) => {
        comments.push(childSnapshot.val());
      });
      // Sort by timestamp (newest first)
      comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      callback(comments);
    });

    return unsubscribe;
  }

  // Share a post
  async sharePost(postId, userId) {
    try {
      const postRef = ref(database, `posts/${postId}`);
      const snapshot = await get(postRef);

      if (!snapshot.exists()) {
        return { success: false, error: 'Post not found' };
      }

      const post = snapshot.val();
      const shares = (post.shares || 0) + 1;

      await update(postRef, { shares });

      return { success: true, shares };
    } catch (error) {
      console.error('Error sharing post:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete a post
  async deletePost(postId, userId) {
    try {
      const postRef = ref(database, `posts/${postId}`);
      const snapshot = await get(postRef);

      if (!snapshot.exists()) {
        return { success: false, error: 'Post not found' };
      }

      const post = snapshot.val();
      if (post.authorId !== userId) {
        return { success: false, error: 'Unauthorized to delete this post' };
      }

      await remove(postRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting post:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete a comment
  async deleteComment(postId, commentId, userId) {
    try {
      const commentRef = ref(database, `posts/${postId}/comments/${commentId}`);
      const snapshot = await get(commentRef);

      if (!snapshot.exists()) {
        return { success: false, error: 'Comment not found' };
      }

      const comment = snapshot.val();
      if (comment.authorId !== userId) {
        return { success: false, error: 'Unauthorized to delete this comment' };
      }

      await remove(commentRef);

      // Update comment count
      const postRef = ref(database, `posts/${postId}`);
      const postSnapshot = await get(postRef);
      const post = postSnapshot.val();
      const commentsCount = Math.max(0, (post.commentsCount || 0) - 1);

      await update(postRef, { commentsCount });

      return { success: true, commentsCount };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message };
    }
  }

  // Like/Unlike a comment
  async toggleCommentLike(postId, commentId, userId) {
    try {
      const commentRef = ref(database, `posts/${postId}/comments/${commentId}`);
      const snapshot = await get(commentRef);

      if (!snapshot.exists()) {
        return { success: false, error: 'Comment not found' };
      }

      const comment = snapshot.val();
      const likes = comment.likes || {};
      const isLiked = likes[userId];

      if (isLiked) {
        // Unlike
        delete likes[userId];
        comment.likesCount = Math.max(0, (comment.likesCount || 0) - 1);
      } else {
        // Like
        likes[userId] = true;
        comment.likesCount = (comment.likesCount || 0) + 1;
      }

      await update(commentRef, {
        likes,
        likesCount: comment.likesCount
      });

      return { success: true, isLiked: !isLiked, likesCount: comment.likesCount };
    } catch (error) {
      console.error('Error toggling comment like:', error);
      return { success: false, error: error.message };
    }
  }
}

export const PostService = new PostServiceClass();
