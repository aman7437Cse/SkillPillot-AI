import type { Roadmap, Task, SkillGap, QuizQuestion, GenerateRoadmapPayload, HealthStatus } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  let authHeaders: Record<string, string> = {};
  try {
    const rawSession = localStorage.getItem('skillpilot_auth_session');
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      if (parsed.id) {
        authHeaders['x-user-id'] = parsed.id;
        authHeaders['Authorization'] = `Bearer simulated-jwt-${parsed.id}`;
      }
    }
  } catch {
    // Ignore error
  }

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
};
