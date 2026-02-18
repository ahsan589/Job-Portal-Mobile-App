// app/(main)/jobseeker/message.js
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { messageService } from '../../../src/services/messageService';
import { ProfileService } from '../../../src/services/profileService';

const JobSeekerMessageScreen = () => {
  const { user, userData } = useAuth();
  const { conversationId } = useLocalSearchParams();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});

  const flatListRef = useRef(null);
  const messagesUnsubscribeRef = useRef(null);
  const conversationsUnsubscribeRef = useRef(null);
  const inputAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user) {
      setupRealTimeListeners();
    }

    return () => {
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
      }
      if (conversationsUnsubscribeRef.current) {
        conversationsUnsubscribeRef.current();
      }
    };
  }, [user]);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
      }
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    if (currentConversation) {
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
      }

      console.log('Job Seeker: Setting up message listener for:', currentConversation.id);
      messagesUnsubscribeRef.current = messageService.listenToMessages(
        currentConversation.id,
        (messagesData) => {
          console.log('Job Seeker: Received messages:', messagesData.length);
          setMessages(messagesData);
          setTimeout(() => {
            if (flatListRef.current && messagesData.length > 0) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }, 100);
        }
      );
    }

    return () => {
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
      }
    };
  }, [currentConversation]);

  const setupRealTimeListeners = async () => {
    console.log('Setting up conversation listener for job seeker:', user.uid);
    
    conversationsUnsubscribeRef.current = messageService.listenToConversations(
      user.uid,
      async (conversationsData) => {
        console.log('Job Seeker conversations updated:', conversationsData.length);
        setConversations(conversationsData);
        await loadEmployerProfiles(conversationsData);
        setLoading(false);
      }
    );
  };

  const loadEmployerProfiles = async (conversations) => {
    const profiles = {};
    for (const conv of conversations) {
      const employerId = conv.employerParticipant || conv.participants.find(id => id !== user.uid);
      if (employerId && !profiles[employerId]) {
        try {
          const profileResult = await ProfileService.getProfile(employerId);
          if (profileResult.success) {
            profiles[employerId] = profileResult.data;
          }
        } catch (error) {
          console.error('Error loading employer profile:', error);
        }
      }
    }
    setUserProfiles(profiles);
  };

  const sendMessage = async () => {
    if (!currentConversation || !inputText.trim() || sending) return;

    setSending(true);
    
    Animated.spring(inputAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    const result = await messageService.sendMessage(
      currentConversation.id,
      user.uid,
      inputText.trim()
    );

    if (result.success) {
      setInputText('');
    } else {
      Alert.alert('Error', result.error || 'Failed to send message');
    }
    
    Animated.spring(inputAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    setSending(false);
  };

  const getEmployerProfile = (conversation) => {
    const employerId = conversation.employerParticipant || conversation.participants.find(id => id !== user.uid);
    return userProfiles[employerId];
  };

  const getConversationTitle = (conversation) => {
    const profile = getEmployerProfile(conversation);
    if (profile) {
      return profile.companyName || `${profile.firstName} ${profile.lastName}` || 'Employer';
    }
    return 'Employer';
  };

  const getCompanyName = (conversation) => {
    const profile = getEmployerProfile(conversation);
    return profile?.companyName || '';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'long' });
      return date.toLocaleDateString();
    } catch (error) {
      return '';
    }
  };

  const shouldShowDate = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentDate = currentMessage.timestamp?.toDate ? currentMessage.timestamp.toDate() : new Date(currentMessage.timestamp);
    const previousDate = previousMessage.timestamp?.toDate ? previousMessage.timestamp.toDate() : new Date(previousMessage.timestamp);
    
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  const renderMessageItem = ({ item, index }) => {
    const isOwnMessage = item.senderId === user.uid;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showDate = shouldShowDate(item, previousMessage);

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {formatDate(item.timestamp)}
            </Text>
          </View>
        )}
        <View style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
        ]}>
          <View style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
          ]}>
            <Text style={isOwnMessage ? styles.ownMessageText : styles.otherMessageText}>
              {item.text}
            </Text>
          </View>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const renderConversationItem = ({ item }) => {
    const profile = getEmployerProfile(item);
    const lastMessageTime = item.lastMessageTime?.toDate ? item.lastMessageTime.toDate() : new Date();
    const timeAgo = Math.floor((new Date() - lastMessageTime) / (1000 * 60 * 60));
    
    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          currentConversation?.id === item.id && styles.activeConversation
        ]}
        onPress={() => setCurrentConversation(item)}
      >
        <View style={styles.conversationAvatar}>
          <MaterialIcons name="business" size={24} color="#6366f1" />
        </View>
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationTitle}>
            {getConversationTitle(item)}
          </Text>
          {getCompanyName(item) && (
            <Text style={styles.companyName}>{getCompanyName(item)}</Text>
          )}
          <Text style={styles.conversationLastMessage} numberOfLines={1}>
            {item.lastMessage || 'Start a conversation'}
          </Text>
        </View>
        <View style={styles.conversationMeta}>
          <Text style={styles.conversationTime}>
            {timeAgo < 24 ? `${timeAgo}h ago` : `${Math.floor(timeAgo / 24)}d ago`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />

      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (currentConversation) {
              setCurrentConversation(null);
            } else {
              router.back();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {currentConversation ? getConversationTitle(currentConversation) : 'Messages'}
          </Text>
          {currentConversation && getCompanyName(currentConversation) && (
            <Text style={styles.headerSubtitle}>
              {getCompanyName(currentConversation)}
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {currentConversation && (
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="information-circle-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {currentConversation ? (
        // Chat View
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <MaterialIcons name="chat" size={64} color="#cbd5e1" />
                <Text style={styles.emptyMessagesText}>No messages yet</Text>
                <Text style={styles.emptyMessagesSubtext}>
                  Start the conversation by sending a message!
                </Text>
              </View>
            }
          />

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message..."
                placeholderTextColor="#999"
                multiline
                maxLength={500}
              />
              <Animated.View style={{
                transform: [{
                  scale: inputAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.8]
                  })
                }]
              }}>
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!inputText.trim() || sending) && styles.sendButtonDisabled
                  ]}
                  onPress={sendMessage}
                  disabled={!inputText.trim() || sending}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="send" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : (
        // Conversations List
        <View style={styles.conversationsContainer}>
          {conversations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="chat-bubble-outline" size={80} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>
                Start a conversation by messaging employers about jobs
              </Text>
              <TouchableOpacity 
                style={styles.findJobsButton}
                onPress={() => router.push('/(main)/jobseeker/jobs')}
              >
                <Text style={styles.findJobsButtonText}>Find Jobs</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={conversations}
              renderItem={renderConversationItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.conversationsList}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 0 : 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#e0e7ff',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
  },
  conversationsContainer: {
    flex: 1,
  },
  conversationsList: {
    paddingVertical: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeConversation: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
    borderWidth: 1,
  },
  conversationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  companyName: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
    marginBottom: 4,
  },
  conversationLastMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  conversationTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#1e293b',
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  findJobsButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  findJobsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  ownMessageBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ownMessageText: {
    color: '#FFF',
    fontSize: 16,
    lineHeight: 20,
  },
  otherMessageText: {
    color: '#1e293b',
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    marginHorizontal: 8,
  },
  ownMessageTime: {
    color: '#94a3b8',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#94a3b8',
    textAlign: 'left',
  },
  emptyMessages: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyMessagesText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f8fafc',
    marginRight: 12,
    color: '#1e293b',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
  },
});

export default JobSeekerMessageScreen;