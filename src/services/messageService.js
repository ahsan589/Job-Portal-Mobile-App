// src/services/messageService.js
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

class MessageService {
  // Create or get existing conversation
  async createConversation(employerId, jobSeekerId, jobId = null) {
    try {
      console.log('Creating conversation between:', { employerId, jobSeekerId, jobId });
      
      const participants = [employerId, jobSeekerId].sort();
      const conversationId = `${participants[0]}_${participants[1]}`;
      
      console.log('Using conversation ID:', conversationId);

      // Check if conversation already exists
      const existingConvQuery = await getDocs(query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', employerId)
      ));
      
      let existingConversation = null;
      existingConvQuery.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(jobSeekerId)) {
          existingConversation = { id: doc.id, ...data };
        }
      });

      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation.id);
        return { success: true, id: existingConversation.id };
      }

      // Create new conversation
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationData = {
        id: conversationId,
        participants: participants,
        employerId,
        jobSeekerId,
        jobId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: 'Conversation started',
        lastMessageTime: serverTimestamp(),
        employerName: '',
        jobSeekerName: '',
        employerParticipant: employerId,
        jobSeekerParticipant: jobSeekerId
      };

      await setDoc(conversationRef, conversationData);
      console.log('Created new conversation:', conversationId);
      
      // Send an initial welcome message
      await this.sendInitialMessage(conversationId, employerId);
      
      return { success: true, id: conversationId };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: error.message };
    }
  }

  // Send initial welcome message
  async sendInitialMessage(conversationId, senderId) {
    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, {
        senderId,
        text: 'Hello! Thanks for your interest in our position.',
        timestamp: serverTimestamp(),
        read: false,
        type: 'system'
      });
      console.log('Initial message sent to:', conversationId);
    } catch (error) {
      console.error('Error sending initial message:', error);
    }
  }

  // Send message
  async sendMessage(conversationId, senderId, text) {
    try {
      if (!conversationId || !senderId || !text) {
        throw new Error('Missing required parameters');
      }

      console.log('Sending message to conversation:', conversationId);
      
      // Add message to subcollection
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const messageDoc = await addDoc(messagesRef, {
        senderId,
        text: text.trim(),
        timestamp: serverTimestamp(),
        read: false,
        type: 'text'
      });

      // Update conversation last message
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Message sent successfully to:', conversationId);
      return { success: true, messageId: messageDoc.id };
    } catch (error) {
      console.error('Error sending message to', conversationId, ':', error);
      return { success: false, error: error.message };
    }
  }

  // Listen to conversations for a user
  listenToConversations(userId, callback) {
    try {
      console.log('Setting up conversation listener for user:', userId);
      
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc')
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const conversations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`Real-time update: Loaded ${conversations.length} conversations`);
          callback(conversations);
        },
        (error) => {
          console.error('Error in conversation listener:', error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up conversation listener:', error);
      return () => {};
    }
  }

  // Listen to messages in a conversation - FIXED ORDERING
  listenToMessages(conversationId, callback) {
    try {
      if (!conversationId) {
        console.error('No conversation ID provided');
        callback([]);
        return () => {};
      }

      console.log('Setting up message listener for:', conversationId);
      
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      // Use timestamp for proper chronological order
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const messages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Ensure consistent timestamp handling
              createdAt: data.timestamp,
              timestamp: data.timestamp
            };
          });
          console.log(`Loaded ${messages.length} messages in correct order`);
          callback(messages);
        },
        (error) => {
          console.error('Error in message listener:', error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up message listener:', error);
      return () => {};
    }
  }
}

export const messageService = new MessageService();