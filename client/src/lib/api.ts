import type {
  Roadmap,
  Task,
  SkillGap,
  QuizQuestion,
  GenerateRoadmapPayload,
  HealthStatus,
  DashboardData,
  StudySession,
  TaskStatus,
  Conversation,
  ChatMessage,
  ConversationWithMessages,
  SendMessagePayload,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function getAuthHeaders(): Record<string, string> {
  const authHeaders: Record<string, string> = {};
  try {
    const rawSession = localStorage.getItem('skillpilot_auth_session');
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      if (parsed.id) {
        authHeaders['x-user-id'] = parsed.id;
        authHeaders['x-user-name'] = parsed.fullName || 'Student';
        authHeaders['Authorization'] = `Bearer simulated-jwt-${parsed.id}`;
      }
    }
  } catch {
    // Ignore error
  }
  return authHeaders;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const authHeaders = getAuthHeaders();

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) errorMessage = errorJson.message;
      else if (errorJson.errors) errorMessage = JSON.stringify(errorJson.errors);
    } catch {
      // Keep default message if json parse fails
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  async getHealth(): Promise<HealthStatus> {
    return fetchJson<HealthStatus>(`${API_BASE}/health`);
  },

  async getRoadmaps(): Promise<Roadmap[]> {
    const res = await fetchJson<{ success: boolean; data: Roadmap[] }>(`${API_BASE}/roadmaps`);
    return res.data;
  },

  async getRoadmapById(id: string): Promise<Roadmap> {
    const res = await fetchJson<{ success: boolean; data: Roadmap }>(`${API_BASE}/roadmaps/${id}`);
    return res.data;
  },

  async generateRoadmap(payload: GenerateRoadmapPayload): Promise<Roadmap> {
    const res = await fetchJson<{ success: boolean; data: Roadmap }>(`${API_BASE}/roadmaps/generate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async regenerateRoadmap(id: string, payload: GenerateRoadmapPayload): Promise<Roadmap> {
    const res = await fetchJson<{ success: boolean; data: Roadmap }>(`${API_BASE}/roadmaps/${id}/regenerate`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async deleteRoadmap(id: string): Promise<boolean> {
    const res = await fetchJson<{ success: boolean }>(`${API_BASE}/roadmaps/${id}`, {
      method: 'DELETE',
    });
    return res.success;
  },

  async toggleTaskCompletion(roadmapId: string, taskId: string, isCompleted: boolean): Promise<{ task: Task; roadmap: Roadmap }> {
    const res = await fetchJson<{ success: boolean; data: { task: Task; roadmap: Roadmap } }>(
      `${API_BASE}/roadmaps/${roadmapId}/tasks/${taskId}/toggle`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isCompleted }),
      }
    );
    return res.data;
  },

  async recoverPace(roadmapId: string, strategy: 'redistribute' | 'sprint' | 'core_essentials'): Promise<Roadmap> {
    const res = await fetchJson<{ success: boolean; data: Roadmap }>(
      `${API_BASE}/roadmaps/${roadmapId}/recover-pace`,
      {
        method: 'POST',
        body: JSON.stringify({ strategy }),
      }
    );
    return res.data;
  },

  async getTopicQuiz(topic: string, skill: string): Promise<QuizQuestion[]> {
    const res = await fetchJson<{ success: boolean; data: QuizQuestion[] }>(
      `${API_BASE}/roadmaps/diagnostic/quiz?topic=${encodeURIComponent(topic)}&skill=${encodeURIComponent(skill)}`
    );
    return res.data;
  },

  async submitQuizScore(roadmapId: string, gapId: string, score: number): Promise<SkillGap> {
    const res = await fetchJson<{ success: boolean; data: SkillGap }>(
      `${API_BASE}/roadmaps/${roadmapId}/diagnostic/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ gapId, score }),
      }
    );
    return res.data;
  },

  async getDashboard(roadmapId: string): Promise<DashboardData> {
    const res = await fetchJson<{ success: boolean; data: DashboardData }>(
      `${API_BASE}/roadmaps/${roadmapId}/dashboard`
    );
    return res.data;
  },

  async recordStudySession(roadmapId: string, taskId: string, durationMinutes: number, xpEarned = 25): Promise<StudySession> {
    const res = await fetchJson<{ success: boolean; data: StudySession }>(
      `${API_BASE}/roadmaps/${roadmapId}/tasks/${taskId}/session`,
      {
        method: 'POST',
        body: JSON.stringify({ durationMinutes, xpEarned }),
      }
    );
    return res.data;
  },

  async updateTaskStatus(roadmapId: string, taskId: string, status: TaskStatus): Promise<{ task: Task; roadmap: Roadmap }> {
    const res = await fetchJson<{ success: boolean; data: { task: Task; roadmap: Roadmap } }>(
      `${API_BASE}/roadmaps/${roadmapId}/tasks/${taskId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
    return res.data;
  },

  async rescheduleTask(roadmapId: string, taskId: string, newDayNumber: number): Promise<{ task: Task; roadmap: Roadmap }> {
    const res = await fetchJson<{ success: boolean; data: { task: Task; roadmap: Roadmap } }>(
      `${API_BASE}/roadmaps/${roadmapId}/tasks/${taskId}/reschedule`,
      {
        method: 'PATCH',
        body: JSON.stringify({ newDayNumber }),
      }
    );
    return res.data;
  },

  // AI Assistant Methods
  async listConversations(): Promise<Conversation[]> {
    const res = await fetchJson<{ success: boolean; data: Conversation[] }>(
      `${API_BASE}/assistant/conversations`
    );
    return res.data;
  },

  async getConversation(id: string): Promise<ConversationWithMessages> {
    const res = await fetchJson<{ success: boolean; data: ConversationWithMessages }>(
      `${API_BASE}/assistant/conversations/${id}`
    );
    return res.data;
  },

  async createConversation(title?: string, roadmapId?: string): Promise<ConversationWithMessages> {
    const res = await fetchJson<{ success: boolean; data: ConversationWithMessages }>(
      `${API_BASE}/assistant/conversations`,
      {
        method: 'POST',
        body: JSON.stringify({ title, roadmapId }),
      }
    );
    return res.data;
  },

  async renameConversation(id: string, title: string): Promise<Conversation> {
    const res = await fetchJson<{ success: boolean; data: Conversation }>(
      `${API_BASE}/assistant/conversations/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }
    );
    return res.data;
  },

  async deleteConversation(id: string): Promise<boolean> {
    const res = await fetchJson<{ success: boolean }>(
      `${API_BASE}/assistant/conversations/${id}`,
      {
        method: 'DELETE',
      }
    );
    return res.success;
  },

  async sendChatMessage(payload: SendMessagePayload): Promise<{
    conversationId: string;
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
  }> {
    const res = await fetchJson<{
      success: boolean;
      data: {
        conversationId: string;
        userMessage: ChatMessage;
        assistantMessage: ChatMessage;
      };
    }>(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async streamChatMessage(
    payload: SendMessagePayload,
    onStart: (convId: string, userMsg: ChatMessage) => void,
    onChunk: (chunk: string) => void,
    onDone: (msg: ChatMessage, provider?: string) => void,
    onError: (err: Error) => void,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/assistant/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(trimmed.slice(6));
              if (eventData.type === 'start') {
                onStart(eventData.conversationId, eventData.userMessage);
              } else if (eventData.type === 'chunk' && eventData.chunk) {
                onChunk(eventData.chunk);
              } else if (eventData.type === 'done' && eventData.message) {
                onDone(eventData.message, eventData.provider);
              } else if (eventData.type === 'error') {
                onError(new Error(eventData.error || 'Generation failed'));
              }
            } catch {
              // Ignore malformed partial chunks
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      onError(err);
    }
  },
};
