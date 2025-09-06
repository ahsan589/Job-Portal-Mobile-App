import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { PostService } from '../../src/services/postService';

const PostCard = ({ post, onRefresh }) => {
  const { user, userData } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  // Animation values for buttons
  const likeScaleAnim = useRef(new Animated.Value(1)).current;
  const commentScaleAnim = useRef(new Animated.Value(1)).current;
  const shareScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Check if user has liked this post
    if (post.likes && user?.uid) {
      setIsLiked(!!post.likes[user.uid]);
    }
    setLikesCount(post.likesCount || 0);
  }, [post, user]);

  useEffect(() => {
    let unsubscribeComments;

    if (showComments) {
      unsubscribeComments = PostService.subscribeToComments(post.id, (commentsData) => {
        setComments(commentsData);
      });
    }

    return () => {
      if (unsubscribeComments) {
        unsubscribeComments();
      }
    };
  }, [showComments, post.id]);

  const animatePressIn = (anim) => {
    Animated.timing(anim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const animatePressOut = (anim) => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to like posts');
      return;
    }

    const result = await PostService.toggleLike(post.id, user.uid);
    if (result.success) {
      setIsLiked(result.isLiked);
      setLikesCount(result.likesCount);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleComment = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to comment');
      return;
    }

    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    setIsCommenting(true);
    const result = await PostService.addComment(post.id, user.uid, {
      content: newComment.trim()
    });

    if (result.success) {
      setNewComment('');
      setShowComments(true);
    } else {
      Alert.alert('Error', result.error);
    }
    setIsCommenting(false);
  };

  const handleShare = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to share posts');
      return;
    }

    const result = await PostService.sharePost(post.id, user.uid);
    if (result.success) {
      Alert.alert('Success', 'Post shared successfully!');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleDeletePost = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await PostService.deletePost(post.id, user.uid);
            if (result.success) {
              Alert.alert('Success', 'Post deleted successfully!');
              if (onRefresh) onRefresh();
            } else {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const CommentItem = ({ comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>
          {comment.authorId === user?.uid ? 'You' : 'User'}
        </Text>
        <Text style={styles.commentTime}>
          {formatTime(comment.timestamp)}
        </Text>
      </View>
      <Text style={styles.commentContent}>{comment.content}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.commentAction}>
          <Text style={styles.commentActionText}>
            {comment.likesCount || 0} likes
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={20} color="#666" />
          </View>
          <View>
            <Text style={styles.authorName}>
              {post.authorId === user?.uid ? 'You' : 'User'}
            </Text>
            <Text style={styles.postTime}>
              {formatTime(post.timestamp)}
            </Text>
          </View>
        </View>
        {post.authorId === user?.uid && (
          <TouchableOpacity onPress={handleDeletePost}>
            <MaterialIcons name="more-vert" size={24} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Post Content */}
      <View style={styles.content}>
        <Text style={styles.postText}>{post.content}</Text>
        {post.imageUrl && (
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}
      </View>

      {/* Post Stats */}
      <View style={styles.stats}>
        <Text style={styles.statText}>
          {likesCount} likes • {comments.length} comments • {post.shares || 0} shares
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Animated.View
          style={{ flex: 1, transform: [{ scale: likeScaleAnim }] }}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
            onPressIn={() => animatePressIn(likeScaleAnim)}
            onPressOut={() => animatePressOut(likeScaleAnim)}
          >
            <MaterialIcons
              name={isLiked ? "favorite" : "favorite-border"}
              size={24}
              color={isLiked ? "#e74c3c" : "#666"}
            />
            <Text style={[styles.actionText, isLiked && styles.likedText]}>
              Like
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={{ flex: 1, transform: [{ scale: commentScaleAnim }] }}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowComments(!showComments)}
            onPressIn={() => animatePressIn(commentScaleAnim)}
            onPressOut={() => animatePressOut(commentScaleAnim)}
          >
            <MaterialIcons name="chat-bubble-outline" size={24} color="#666" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={{ flex: 1, transform: [{ scale: shareScaleAnim }] }}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
            onPressIn={() => animatePressIn(shareScaleAnim)}
            onPressOut={() => animatePressOut(shareScaleAnim)}
          >
            <MaterialIcons name="share" size={24} color="#666" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Comments Section */}
      {showComments && (
        <View style={styles.commentsSection}>
          {/* Add Comment */}
          <View style={styles.addComment}>
            <View style={styles.commentAvatar}>
              <MaterialIcons name="person" size={16} color="#666" />
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              style={[styles.commentButton, (!newComment.trim() || isCommenting) && styles.disabledButton]}
              onPress={handleComment}
              disabled={!newComment.trim() || isCommenting}
            >
              <Text style={styles.commentButtonText}>
                {isCommenting ? 'Posting...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {comments.length > 0 && (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <CommentItem comment={item} />}
              showsVerticalScrollIndicator={false}
              style={styles.commentsList}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  postTime: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  content: {
    padding: 15,
  },
  postText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  stats: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  statText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  likedText: {
    color: '#e74c3c',
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  addComment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
  },
  commentButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  commentButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  commentsList: {
    maxHeight: 200,
  },
  commentItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  commentTime: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  commentContent: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 5,
  },
  commentAction: {
    marginRight: 15,
  },
  commentActionText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
});

export default PostCard;
