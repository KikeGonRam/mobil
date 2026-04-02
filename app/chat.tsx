import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId(),
      role: 'assistant',
      text: 'Hola, soy tu asistente. Te puedo ayudar con citas, servicios, horarios o pagos.',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  const loadHistory = useCallback(async () => {
    if (!token) {
      setError('Inicia sesion para cargar historial del chatbot.');
      return;
    }

    setLoadingHistory(true);
    setError(null);

    try {
      const response = await api.chatbotHistory(token);
      const mapped = mapHistory(response.history);

      if (mapped.length > 0) {
        setMessages(mapped);
      }
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo cargar el historial.');
    } finally {
      setLoadingHistory(false);
    }
  }, [token]);

  const clearHistory = useCallback(async () => {
    if (!token) {
      setMessages([
        {
          id: makeId(),
          role: 'assistant',
          text: 'Hola, soy tu asistente. Te puedo ayudar con citas, servicios, horarios o pagos.',
        },
      ]);
      return;
    }

    setLoadingHistory(true);
    setError(null);

    try {
      await api.chatbotClearHistory(token);
      setMessages([
        {
          id: makeId(),
          role: 'assistant',
          text: 'Historial limpiado. ¿En que te ayudo ahora?',
        },
      ]);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo limpiar el historial.');
    } finally {
      setLoadingHistory(false);
    }
  }, [token]);

  const sendMessage = useCallback(async () => {
    const content = input.trim();

    if (!content || sending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: makeId(),
      role: 'user',
      text: content,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const response = await api.chatbotQuery({ message: content }, token);

      setMessages((previous) => [
        ...previous,
        {
          id: makeId(),
          role: 'assistant',
          text: response.response,
        },
      ]);
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'No se pudo obtener respuesta del asistente.';
      setError(message);
      setMessages((previous) => [
        ...previous,
        {
          id: makeId(),
          role: 'assistant',
          text: 'No pude responder en este momento. Intenta de nuevo.',
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, sending, token]);

  return (
    <ThemedView style={styles.backdrop}>
      <Stack.Screen options={{ title: 'Asistente', headerShown: false }} />
      <Pressable style={styles.backdropPressable} onPress={() => router.back()}>
        <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <ThemedText type="title" style={styles.title}>Asistente</ThemedText>
              <ThemedText style={styles.subtitle}>Consulta rapida para tu barberia.</ThemedText>
            </View>
            <Pressable onPress={() => router.back()} style={styles.closeButton}>
              <ThemedText style={styles.closeButtonText}>Cerrar</ThemedText>
            </Pressable>
          </View>

          <View style={styles.actionsRow}>
            <Pressable onPress={loadHistory} disabled={loadingHistory} style={styles.secondaryButton}>
              <ThemedText style={styles.secondaryButtonText}>Historial</ThemedText>
            </Pressable>
            <Pressable onPress={clearHistory} disabled={loadingHistory} style={styles.secondaryButton}>
              <ThemedText style={styles.secondaryButtonText}>Limpiar</ThemedText>
            </Pressable>
          </View>

          {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

          <ScrollView contentContainerStyle={styles.messages}>
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.bubble,
                  message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}>
                <ThemedText style={styles.bubbleText}>{message.text}</ThemedText>
              </View>
            ))}
            {sending && (
              <View style={styles.typingRow}>
                <ActivityIndicator color={Brand.gold} size="small" />
                <ThemedText style={styles.typingText}>Pensando...</ThemedText>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              style={styles.input}
              placeholder="Escribe tu pregunta..."
              placeholderTextColor="#7f7f7f"
              multiline
            />
            <Pressable
              onPress={sendMessage}
              disabled={!canSend}
              style={[styles.sendButton, !canSend ? styles.sendButtonDisabled : null]}>
              <ThemedText style={styles.sendButtonText}>Enviar</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </ThemedView>
  );
}

function mapHistory(history: Record<string, unknown>[]): ChatMessage[] {
  const mapped: ChatMessage[] = [];

  for (const item of history) {
    const maybeQuestion = pickString(item, ['question', 'prompt', 'user_message', 'message']);
    const maybeAnswer = pickString(item, ['answer', 'response', 'bot_message']);

    if (maybeQuestion) {
      mapped.push({ id: makeId(), role: 'user', text: maybeQuestion });
    }

    if (maybeAnswer) {
      mapped.push({ id: makeId(), role: 'assistant', text: maybeAnswer });
    }
  }

  return mapped;
}

function pickString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    justifyContent: 'center',
    padding: 16,
  },
  backdropPressable: {
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgMain,
    padding: 14,
    gap: 10,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  header: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    padding: 16,
    gap: 4,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    color: Brand.muted,
    lineHeight: 20,
  },
  closeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  error: {
    color: '#f87171',
    fontSize: 12,
  },
  messages: {
    gap: 8,
    paddingVertical: 8,
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderColor: 'rgba(212,175,55,0.35)',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.bgCard,
    borderColor: Brand.line,
  },
  bubbleText: {
    color: '#fff',
    lineHeight: 20,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  typingText: {
    color: Brand.muted,
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgCard,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendButton: {
    borderRadius: 14,
    backgroundColor: Brand.gold,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});