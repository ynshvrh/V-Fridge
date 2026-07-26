<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useFridgeStore } from '@/stores/fridge';
import CreateFridgeModal from '@/components/fridge/CreateFridgeModal.vue';
import InviteMemberModal from '@/components/fridge/InviteMemberModal.vue';
import { Refrigerator, Plus, UserPlus, Trash2, LogOut, Edit3, Users, Crown } from '@lucide/vue';

const fridgeStore = useFridgeStore();

const showCreateModal = ref(false);
const inviteModalFridge = ref<{ id: number; name: string } | null>(null);
const editingFridgeId = ref<number | null>(null);
const editName = ref('');

onMounted(async () => {
  await fridgeStore.fetchFridges();
});

const startRename = (id: number, currentName: string) => {
  editingFridgeId.value = id;
  editName.value = currentName;
};

const saveRename = async (id: number) => {
  if (!editName.value.trim()) return;
  await fridgeStore.renameFridge(id, editName.value.trim());
  editingFridgeId.value = null;
};

const handleDelete = async (id: number, name: string) => {
  if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
    await fridgeStore.deleteFridge(id);
  }
};

const handleLeave = async (id: number, name: string) => {
  if (confirm(`Are you sure you want to leave "${name}"?`)) {
    await fridgeStore.leaveFridge(id);
  }
};
</script>

<template>
  <div class="fridges-page fade-in">
    <header class="page-header">
      <div>
        <h1>My Fridges & Members</h1>
        <p class="subtitle">Manage owned fridges and member access</p>
      </div>
      <button class="btn-primary" @click="showCreateModal = true">
        <Plus :size="18" />
        <span>Create New Fridge</span>
      </button>
    </header>

    <div v-if="fridgeStore.fridges.length === 0" class="empty-state glass-card">
      <div class="empty-icon-bg">
        <Refrigerator :size="36" />
      </div>
      <h3>No fridges found</h3>
      <p>Create a fridge or ask someone to invite you to theirs.</p>
    </div>

    <div v-else class="fridges-grid">
      <div v-for="fridge in fridgeStore.fridges" :key="fridge.id" class="glass-card fridge-card">
        <div class="card-top">
          <div class="role-badge" :class="fridge.role">
            <Crown v-if="fridge.role === 'owner'" :size="12" />
            <Users v-else :size="12" />
            <span>{{ fridge.role }}</span>
          </div>
          <span class="created-date">{{ new Date(fridge.createdAt).toLocaleDateString() }}</span>
        </div>

        <div class="card-main">
          <div v-if="editingFridgeId === fridge.id" class="inline-edit">
            <input v-model="editName" type="text" class="form-input" @keyup.enter="saveRename(fridge.id)" />
            <button class="btn-primary btn-sm" @click="saveRename(fridge.id)">Save</button>
          </div>
          <div v-else class="title-row">
            <h3 class="fridge-title">{{ fridge.name }}</h3>
            <button v-if="fridge.role === 'owner'" class="icon-btn" title="Rename" @click="startRename(fridge.id, fridge.name)">
              <Edit3 :size="14" />
            </button>
          </div>
          <p class="member-count">
            <Users :size="14" />
            {{ fridge.memberCount }} member{{ fridge.memberCount > 1 ? 's' : '' }}
          </p>
        </div>

        <div class="card-actions">
          <button
            v-if="fridge.role === 'owner'"
            class="btn-secondary action-btn"
            @click="inviteModalFridge = { id: fridge.id, name: fridge.name }"
          >
            <UserPlus :size="16" />
            <span>Invite Member</span>
          </button>

          <button
            v-if="fridge.role === 'owner'"
            class="danger-icon-btn"
            title="Delete Fridge"
            @click="handleDelete(fridge.id, fridge.name)"
          >
            <Trash2 :size="16" />
          </button>

          <button
            v-else
            class="danger-icon-btn"
            title="Leave Fridge"
            @click="handleLeave(fridge.id, fridge.name)"
          >
            <LogOut :size="16" />
          </button>
        </div>
      </div>
    </div>

    <CreateFridgeModal v-if="showCreateModal" @close="showCreateModal = false" />
    <InviteMemberModal
      v-if="inviteModalFridge"
      :fridge-id="inviteModalFridge.id"
      :fridge-name="inviteModalFridge.name"
      @close="inviteModalFridge = null"
    />
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 4px;
}
.empty-state {
  padding: 64px 24px;
  text-align: center;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-icon-bg {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  border-radius: 50%;
  background: rgba(140, 83, 131, 0.15);
  color: var(--accent-purple-hover);
  display: flex;
  align-items: center;
  justify-content: center;
}
.fridges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.fridge-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
}
.role-badge.owner {
  background: rgba(245, 158, 11, 0.15);
  color: var(--accent-amber);
}
.role-badge.member {
  background: rgba(6, 182, 212, 0.15);
  color: var(--accent-cyan);
}
.created-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fridge-title {
  font-size: 1.2rem;
  color: var(--text-primary);
}
.icon-btn {
  color: var(--text-muted);
  padding: 4px;
}
.icon-btn:hover {
  color: var(--text-primary);
}
.inline-edit {
  display: flex;
  gap: 8px;
}
.btn-sm {
  padding: 6px 12px;
  font-size: 0.85rem;
}
.member-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 6px;
}
.card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
}
.action-btn {
  flex: 1;
  font-size: 0.85rem;
}
.danger-icon-btn {
  color: var(--text-muted);
  padding: 8px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}
.danger-icon-btn:hover {
  color: var(--accent-rose);
  background: rgba(244, 63, 94, 0.1);
  border-color: rgba(244, 63, 94, 0.3);
}
</style>
