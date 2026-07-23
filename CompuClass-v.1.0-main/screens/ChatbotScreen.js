import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aiService } from '../services/aiService';

const BLUE = '#2563EB'; const WHITE = '#FFFFFF'; const BG = '#F3F4F6';
const TEXT = '#111827'; const MUTED = '#6B7280'; const BUBBLE_AI = '#EFF6FF';

const QUICK_PROMPTS = [
  { label: '🖥️ What is a CPU?',        text: 'What is a CPU and what does it do?' },
  { label: '💾 RAM vs Storage',         text: 'What is the difference between RAM and storage?' },
  { label: '🔧 PC won\'t turn on',      text: 'My PC won\'t turn on. How do I troubleshoot it?' },
  { label: '📋 Quiz tips',              text: 'Give me tips to prepare for a computer hardware quiz.' },
  { label: '🔌 What is a PSU?',         text: 'What is a PSU and why is it important?' },
  { label: '🧩 Motherboard explained',  text: 'Explain what a motherboard does in simple terms.' },
];

export default function ChatbotScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text: trimmed };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      const reply = await aiService.chatWithAI(updatedMessages);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: 'Sorry, I ran into an issue. Please try again.' }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [input, messages, loading]);

  const clearChat = () => setMessages([]);

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Ionicons name="hardware-chip" size={14} color={WHITE} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Ionicons name="hardware-chip" size={16} color={WHITE} />
          </View>
          <View>
            <Text style={styles.headerTitle}>CompuBot</Text>
            <Text style={styles.headerSub}>AI Learning Assistant</Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={18} color={MUTED} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages or empty state */}
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles" size={36} color={BLUE} />
            </View>
            <Text style={styles.emptyTitle}>Ask CompuBot anything</Text>
            <Text style={styles.emptySub}>Get help with PC components, troubleshooting, quizzes, and more.</Text>
            <View style={styles.quickGrid}>
              {QUICK_PROMPTS.map((p, i) => (
                <TouchableOpacity key={i} style={styles.quickChip} onPress={() => sendMessage(p.text)}>
                  <Text style={styles.quickChipText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item => item.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            ListFooterComponent={
              loading ? (
                <View style={styles.typingRow}>
                  <View style={styles.avatar}>
                    <Ionicons name="hardware-chip" size={14} color={WHITE} />
                  </View>
                  <View style={styles.typingBubble}>
                    <ActivityIndicator size="small" color={BLUE} />
                    <Text style={styles.typingText}>CompuBot is thinking...</Text>
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask a question..."
            placeholderTextColor={MUTED}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={18} color={WHITE} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '800', color: TEXT },
  headerSub: { fontSize: 11, color: MUTED },
  clearBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },

  emptyState: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 48 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: BLUE + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: TEXT, marginBottom: 8 },
  emptySub: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  quickChip: { backgroundColor: WHITE, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#E5E7EB' },
  quickChipText: { fontSize: 12, fontWeight: '600', color: TEXT },

  messageList: { padding: 16, gap: 12, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAI: { justifyContent: 'flex-start' },
  avatar: { width: 28, height: 28, borderRadius: 8, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: BLUE, borderBottomRightRadius: 4 },
  bubbleAI: { backgroundColor: BUBBLE_AI, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: TEXT, lineHeight: 21 },
  bubbleTextUser: { color: WHITE },

  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  typingBubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: BUBBLE_AI, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  typingText: { fontSize: 13, color: MUTED },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: WHITE, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 10 },
  input: { flex: 1, backgroundColor: BG, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: TEXT, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: BLUE + '50' },
});
