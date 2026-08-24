import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api, type ApiErrorResponse } from '@/api/client';

export interface Fridge {
  id: number;
  name: string;
  ownerId: number;
  role: 'owner' | 'member';
  memberCount: number;
  createdAt: string;
}

export interface FridgeInviteResponse {
  id: number;
  email: string;
  expiresAt: string;
  acceptedAt?: string | null;
}

export const useFridgeStore = defineStore('fridge', () => {
  const fridges = ref<Fridge[]>([]);
  const activeFridgeId = ref<number | null>(api.getActiveFridgeId());
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const activeFridge = computed(() => {
    if (!activeFridgeId.value) return fridges.value[0] || null;
    return fridges.value.find(f => f.id === activeFridgeId.value) || fridges.value[0] || null;
  });

  const lastSyncTime = ref<number>(Date.now());

  async function fetchFridges(silent = false) {
    if (!silent) loading.value = true;
    error.value = null;
    try {
      const list = await api.fetch<Fridge[]>('/fridges');
      fridges.value = list;
      lastSyncTime.value = Date.now();

      if (list.length > 0) {
        if (!activeFridgeId.value || !list.some(f => f.id === activeFridgeId.value)) {
          setActiveFridge(list[0].id);
        }
      } else {
        activeFridgeId.value = null;
      }
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to load fridges';
    } finally {
      if (!silent) loading.value = false;
    }
  }

  function setActiveFridge(id: number) {
    const changed = activeFridgeId.value !== id;
    activeFridgeId.value = id;
    api.setActiveFridgeId(id);
    if (changed) {
      lastSyncTime.value = Date.now();
    }
  }

  async function createFridge(name: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const created = await api.fetch<Fridge>('/fridges', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      fridges.value.push(created);
      setActiveFridge(created.id);
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to create fridge';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function renameFridge(id: number, name: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const updated = await api.fetch<Fridge>(`/fridges/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name })
      });
      const index = fridges.value.findIndex(f => f.id === id);
      if (index !== -1) {
        fridges.value[index] = updated;
      }
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to rename fridge';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteFridge(id: number): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      await api.fetch(`/fridges/${id}`, { method: 'DELETE' });
      fridges.value = fridges.value.filter(f => f.id !== id);
      if (activeFridgeId.value === id) {
        if (fridges.value.length > 0) {
          setActiveFridge(fridges.value[0].id);
        } else {
          activeFridgeId.value = null;
        }
      }
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to delete fridge';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function leaveFridge(id: number): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      await api.fetch(`/fridges/${id}/members/me`, { method: 'DELETE' });
      fridges.value = fridges.value.filter(f => f.id !== id);
      if (activeFridgeId.value === id) {
        if (fridges.value.length > 0) {
          setActiveFridge(fridges.value[0].id);
        } else {
          activeFridgeId.value = null;
        }
      }
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to leave fridge';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function createInvite(fridgeId: number, email: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      await api.fetch<FridgeInviteResponse>(`/fridges/${fridgeId}/invites`, {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to send invite';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function acceptInvite(token: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.fetch<{ fridgeId: number; fridgeName: string }>('/fridges/accept', {
        method: 'POST',
        body: JSON.stringify({ token })
      });
      await fetchFridges();
      setActiveFridge(res.fridgeId);
      return true;
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      error.value = apiErr.error || 'Failed to accept invite';
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    fridges,
    activeFridgeId,
    activeFridge,
    loading,
    error,
    fetchFridges,
    setActiveFridge,
    createFridge,
    renameFridge,
    deleteFridge,
    leaveFridge,
    createInvite,
    acceptInvite
  };
});
