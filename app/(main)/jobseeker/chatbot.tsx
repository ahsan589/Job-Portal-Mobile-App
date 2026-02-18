import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { UploadService } from '../../../src/utils/uploadService';
// axios removed: using the built-in fetch API instead

const { width } = Dimensions.get('window');

// OpenRouter API Service
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = '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';

const sendMessageToOpenRouter = async (userMessage: string) => {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        max_tokens: 512,
        messages: [
          {
            role: "system",
            content: "You are a helpful education assistant specializing in learning techniques, study strategies, and educational content. Provide practical, research-based advice to help students learn more effectively."
          },
          { role: "user", content: userMessage }
        ]
      }),
    });

    const data = await res.json();

    if (res.ok) {
      return data.choices?.[0]?.message?.content?.trim() ?? '';
    } else {
      return `Error: ${data?.error?.message || 'Unknown error'}`;
    }
  } catch (error) {
    console.error('API Error:', error);
    return `Sorry, I'm having trouble connecting to the education service. Please try again later.`;
  }
};

const ChatScreen = ({ fromBmiResult = false }) => {
  const [isBotTyping, setIsBotTyping] = useState(false);
  type ChatMessage = {
    role: 'user' | 'bot';
    content: string;
    timestamp: Date;
    attachment?: {
      type: 'image' | 'document';
      url: string;
      fileName: string;
      size?: number;
    };
  };
  
  type ChatSession = {
    id: string;
    title: string;
    createdAt: Date;
    messages: ChatMessage[];
  };
  
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [inputText, setInputText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  
  const flatListRef = useRef<FlatList<any>>(null);
  const typingAnimations = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isBotTyping]);

  useEffect(() => {
    if (isBotTyping) {
      startTypingAnimation();
    } else {
      resetTypingAnimation();
    }
  }, [isBotTyping]);

  const startTypingAnimation = () => {
    const animations = typingAnimations.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 150),
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach(anim => anim.start());
  };

  const resetTypingAnimation = () => {
    typingAnimations.forEach(anim => anim.setValue(0));
  };

  const initializeChat = async () => {
    await loadChatSessions();
    if (chatSessions.length === 0) {
      createNewSession();
    } else {
      loadSession(chatSessions[0].id);
    }
  };

  const createNewSession = async () => {
    const newSessionId = Date.now().toString();
    const newSession = {
      id: newSessionId,
      title: 'New Chat',
      createdAt: new Date(),
      messages: [],
    };

    setCurrentSessionId(newSessionId);
    setCurrentMessages([]);
    const updatedSessions = [newSession, ...chatSessions];
    setChatSessions(updatedSessions);
    await saveChatSessions(updatedSessions);
  };

  const loadChatSessions = async () => {
    try {
      const storedSessions = await AsyncStorage.getItem('education_chat_sessions');
      if (storedSessions) {
        const parsedSessions = JSON.parse(storedSessions);
        // Convert string dates back to Date objects
        const sessionsWithDates = parsedSessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChatSessions(sessionsWithDates);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const saveChatSessions = async (sessions = chatSessions) => {
    try {
      await AsyncStorage.setItem('education_chat_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving chat sessions:', error);
    }
  };

  const sendMessage = async () => {
    if (isBotTyping || !inputText.trim()) return;

    const userInput = inputText.trim();
    const newMessage: ChatMessage = {
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    // Update UI immediately
    setCurrentMessages(prev => [...prev, newMessage]);
    setIsBotTyping(true);
    setInputText('');

    // Update session
    const sessionIndex = chatSessions.findIndex(s => s.id === currentSessionId);
    if (sessionIndex !== -1) {
      const updatedSessions = [...chatSessions];
      updatedSessions[sessionIndex].messages.push(newMessage);
      
      if (updatedSessions[sessionIndex].title === 'New Chat') {
        updatedSessions[sessionIndex].title = 
          userInput.length > 30 ? `${userInput.substring(0, 30)}...` : userInput;
      }
      
      setChatSessions(updatedSessions);
      await saveChatSessions(updatedSessions);
    }

    try {
      // Call the OpenRouter API
      const reply = await sendMessageToOpenRouter(userInput);
      
      const botMessage: ChatMessage = {
        role: 'bot',
        content: reply,
        timestamp: new Date(),
      };

      setCurrentMessages(prev => [...prev, botMessage]);
      setIsBotTyping(false);

      // Update session with bot response
      if (sessionIndex !== -1) {
        const updatedSessions = [...chatSessions];
        updatedSessions[sessionIndex].messages.push(botMessage);
        setChatSessions(updatedSessions);
        await saveChatSessions(updatedSessions);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      
      setCurrentMessages(prev => [...prev, errorMessage]);
      setIsBotTyping(false);
      
      if (sessionIndex !== -1) {
        const updatedSessions = [...chatSessions];
        updatedSessions[sessionIndex].messages.push(errorMessage);
        setChatSessions(updatedSessions);
        await saveChatSessions(updatedSessions);
      }
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && currentMessages.length > 0) {
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }
  };

  const loadSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setCurrentMessages([...session.messages]);
    }
  };

  const deleteSession = async (sessionId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            const updatedSessions = chatSessions.filter(session => session.id !== sessionId);
            setChatSessions(updatedSessions);

            if (sessionId === currentSessionId) {
              if (updatedSessions.length > 0) {
                loadSession(updatedSessions[0].id);
              } else {
                createNewSession();
              }
            }

            await saveChatSessions(updatedSessions);
          },
        },
      ]
    );
  };

  const handleAttachmentPress = () => {
    setShowAttachmentOptions(true);
  };

  const handleImageUpload = async () => {
    try {
      const result = await UploadService.pickImage();
      if (result.success) {
        // Upload to Firebase and get URL
        const uploadResult = await UploadService.uploadFile(result.uri, 'chat_images');
        if (uploadResult.success) {
          // Add image message to chat
          const imageMessage: ChatMessage = {
            role: 'user',
            content: `[Image: ${uploadResult.fileName!}]`,
            timestamp: new Date(),
            attachment: {
              type: 'image',
              url: uploadResult.url!,
              fileName: uploadResult.fileName!
            }
          };

          setCurrentMessages(prev => [...prev, imageMessage]);
          setShowAttachmentOptions(false);

          // Update session
          const sessionIndex = chatSessions.findIndex(s => s.id === currentSessionId);
          if (sessionIndex !== -1) {
            const updatedSessions = [...chatSessions];
            updatedSessions[sessionIndex].messages.push(imageMessage);
            setChatSessions(updatedSessions);
            await saveChatSessions(updatedSessions);
          }
        } else {
          Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleDocumentUpload = async () => {
    try {
      const result = await UploadService.pickDocument();
      if (result.success) {
        // Upload to Firebase and get URL
        const uploadResult = await UploadService.uploadFile(result.uri, 'chat_documents');
        if (uploadResult.success) {
          // Add document message to chat
          const documentMessage: ChatMessage = {
            role: 'user',
            content: `[Document: ${result.name!}]`,
            timestamp: new Date(),
            attachment: {
              type: 'document',
              url: uploadResult.url!,
              fileName: result.name!,
              size: result.size
            }
          };

          setCurrentMessages(prev => [...prev, documentMessage]);
          setShowAttachmentOptions(false);

          // Update session
          const sessionIndex = chatSessions.findIndex(s => s.id === currentSessionId);
          if (sessionIndex !== -1) {
            const updatedSessions = [...chatSessions];
            updatedSessions[sessionIndex].messages.push(documentMessage);
            setChatSessions(updatedSessions);
            await saveChatSessions(updatedSessions);
          }
        } else {
          Alert.alert('Upload Failed', 'Failed to upload document. Please try again.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const renderMessage = ({ item }: { item: { role: 'user' | 'bot'; content: string; timestamp: Date } }) => (
    <ChatBubble 
      message={item.content} 
      isUser={item.role === 'user'} 
      time={item.timestamp} 
    />
  );

  const renderSessionItem = ({ item }: { item: ChatSession }) => (
    <SessionListItem
      session={item}
      isActive={item.id === currentSessionId}
      onTap={() => {
        loadSession(item.id);
        setShowHistory(false);
      }}
      onDelete={() => deleteSession(item.id)}
    />
  );

  return (
    <SafeAreaView style={[styles.container, fromBmiResult && styles.darkContainer]}>
      <StatusBar barStyle={fromBmiResult ? 'dark-content' : 'light-content'} />
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
     <View style={[styles.header, fromBmiResult && styles.darkHeader]}>
  <Text style={fromBmiResult ? styles.darkHeaderTitle : styles.headerTitle}>
    Education Assistant
  </Text>
  <TouchableOpacity 
    style={styles.historyButton}
    onPress={() => setShowHistory(true)}
  >
    <Icon 
      name="history" 
      size={24} 
      color={fromBmiResult ? '#000' : '#FFF'} 
    />
  </TouchableOpacity>
</View>

        {/* Chat Content */}
        <View style={styles.chatContainer}>
          {currentMessages.length === 0 && !isBotTyping ? (
            <View style={styles.emptyState}>
              <Icon
                name="school"
                size={64}
                color="#2E7D32"
                style={{ opacity: 0.3 }}
              />
              <Text style={styles.emptyStateTitle}>
                How can I assist with your learning today?
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                Ask me about study techniques, learning strategies, or any educational topic
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={isBotTyping ? [...currentMessages, { typing: true }] : currentMessages}
              renderItem={({ item }) => 
                item.typing ? <TypingIndicator animations={typingAnimations} /> : renderMessage({ item })
              }
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.messagesList}
            />
          )}
        </View>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about education..."
              placeholderTextColor="#666"
              multiline
              editable={!isBotTyping}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity style={styles.attachButton}>
              <Icon name="attach-file" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.sendButton, isBotTyping && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={isBotTyping}
          >
            <Icon name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* History Modal */}
        <Modal
          visible={showHistory}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowHistory(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chat History</Text>
                <TouchableOpacity onPress={() => setShowHistory(false)}>
                  <Icon name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              
              {chatSessions.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyHistoryText}>No conversations yet</Text>
                </View>
              ) : (
                <FlatList
                  data={chatSessions}
                  renderItem={renderSessionItem}
                  keyExtractor={item => item.id}
                />
              )}
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.newChatButton}
                  onPress={() => {
                    createNewSession();
                    setShowHistory(false);
                  }}
                >
                  <Icon name="add" size={20} color="#FFF" />
                  <Text style={styles.newChatText}>New Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Chat Bubble Component
type ChatBubbleProps = {
  message: string;
  isUser: boolean;
  time: Date;
};

const ChatBubble = ({ message, isUser, time }: ChatBubbleProps) => {
  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.botMessageContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>
          {message}
        </Text>
      </View>
      <Text style={styles.timeText}>
        {formatTime(time)}
      </Text>
    </View>
  );
};

// Typing Indicator Component
const TypingIndicator = ({ animations }: { animations: Animated.Value[] }) => {
  return (
    <View style={[styles.messageContainer, styles.botMessageContainer]}>
      <View style={[styles.bubble, styles.botBubble]}>
        <View style={styles.typingContainer}>
          {animations.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.typingDot,
                {
                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -8]
                      })
                    }
                  ]
                }
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// Session List Item Component
const SessionListItem = ({
  session,
  isActive,
  onTap,
  onDelete
}: {
  session: {
    id: string;
    title: string;
    createdAt: Date;
    messages: {
      role: 'user' | 'bot';
      content: string;
      timestamp: Date;
    }[];
  };
  isActive: boolean;
  onTap: () => void;
  onDelete: () => void;
}) => {
  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} • ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Get preview from first user message
  const getPreview = () => {
    const firstUserMessage = session.messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.length > 50
        ? `${firstUserMessage.content.substring(0, 50)}...`
        : firstUserMessage.content;
    }
    return 'No messages yet';
  };

  return (
    <View style={[styles.sessionItem, isActive && styles.activeSessionItem]}>
      <TouchableOpacity style={styles.sessionContent} onPress={onTap}>
        <View style={[styles.sessionIcon, isActive && styles.activeSessionIcon]}>
          <Icon
            name="chat-bubble"
            size={20}
            color={isActive ? '#FFF' : '#666'}
          />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={[styles.sessionTitle, isActive && styles.activeSessionTitle]}>
            {session.title}
          </Text>
          <Text style={styles.sessionPreview}>
            {getPreview()}
          </Text>
          <Text style={styles.sessionDate}>
            {formatDate(new Date(session.createdAt))}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <Icon name="delete-outline" size={20} color="#999" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEFF1',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  darkHeader: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  darkHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  headerPlaceholder: {
    width: 24,
    height: 24,
  },
  historyButton: {
    padding: 4,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messagesList: {
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#3498db',
    borderTopRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#F1F1F1',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  userMessageText: {
    color: '#FFF',
  },
  timeText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    marginHorizontal: 8,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginHorizontal: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingRight: 8,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    maxHeight: 100,
    color: '#333',
  },
  attachButton: {
    padding: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#AAA',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3498db',
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyHistory: {
    padding: 16,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#666',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 16,
  },
  newChatText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F7F7F7',
  },
  sessionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeSessionItem: {
    backgroundColor: '#C8E6C9',
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeSessionIcon: {
    backgroundColor: '#3498db',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activeSessionTitle: {
    color: '#3498db',
  },
  sessionPreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 12,
    color: '#777',
  },
  deleteButton: {
    padding: 4,
  },
});


export default ChatScreen;