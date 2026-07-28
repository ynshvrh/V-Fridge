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
  if (confirm(`Ви впевнені, що хочете видалити "${name}"? Цю дію неможливо скасувати.`)) {
    await fridgeStore.deleteFridge(id);
  }
};

const handleLeave = async (id: number, name: string) => {
  if (confirm(`Ви впевнені, що хочете залишити холодильник "${name}"?`)) {
    await fridgeStore.leaveFridge(id);
  }
};
</script>

<template>
  <div class="fridges-page fade-in">
    <header class="page-header">
      <div>
        <h1>Холодильники та Учасники</h1>
        <p class="subtitle">Управління власними та спільними холодильниками</p>
      </div>
      <button class="btn-primary" @click="showCreateModal = true">
        <Plus :size="18" />
        <span>Створити новий холодильник</span>
      </button>
    </header>

    <div v-if="fridgeStore.fridges.length === 0" class="empty-state glass-card">
      <div class="empty-icon-bg">
        <Refrigerator :size="36" />
      </div>
      <h3>Холодильники не знайдені</h3>
      <p>Створіть власний холодильник або попросіть надіслати вам запрошення.</p>
    </div>

    <div v-else class="fridges-grid">
      <div v-for="fridge in fridgeStore.fridges" :key="fridge.id" class="glass-card fridge-card">
        <div class="card-top">
          <div class="role-badge" :class="fridge.role">
            <Crown v-if="fridge.role === 'owner'" :size="12" />
            <Users v-else :size="12" />
            <span>{{ fridge.role === 'owner' ? 'ВЛАСНИК' : 'УЧАСНИК' }}</span>
          </div>
          <span class="created-date">{{ new Date(fridge.createdAt).toLocaleDateString() }}</span>
        </div>

        <div class="card-main">
          <div v-if="editingFridgeId === fridge.id" class="inline-edit">
            <input v-model="editName" type="text" class="form-input" @keyup.enter="saveRename(fridge.id)" />
            <button class="btn-primary btn-sm" @click="saveRename(fridge.id)">Зберегти</button>
          </div>
          <div v-else class="title-row">
            <h3 class="fridge-title">{{ fridge.name }}</h3>
            <button v-if="fridge.role === 'owner'" class="icon-btn" title="Перейменувати" @click="startRename(fridge.id, fridge.name)">
              <Edit3 :size="14" />
            </button>
          </div>
          <p class="member-count">
            <Users :size="14" />
            {{ fridge.memberCount }} учасник{{ fridge.memberCount > 1 ? 'ів' : '' }}
          </p>
        </div>

        <div class="card-actions">
          <button
            v-if="fridge.role === 'owner'"
            class="btn-secondary action-btn"
            @click="inviteModalFridge = { id: fridge.id, name: fridge.name }"
          >
            <UserPlus :size="16" />
            <span>Запросити учасника</span>
          </button>

          <button
            v-if="fridge.role === 'owner'"
            class="danger-icon-btn"
            title="Видалити холодильник"
            @click="handleDelete(fridge.id, fridge.name)"
          >
            <Trash2 :size="16" />
          </button>

          <button
            v-else
            class="danger-icon-btn"
            title="Залишити холодильник"
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
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.88rem;
  margin-top: 2px;
}

.empty-state {
  padding: 48px 20px;
  text-align: center;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon-bg {
  width: 56px;
  height: 56px;
  margin-bottom: 14px;
  border-radius: 50%;
  background: var(--accent-orange-bg);
  color: var(--accent-orange);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fridges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.fridge-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
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
  font-size: 0.72rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border-radius: 12px;
}

.role-badge.owner {
  background: var(--accent-orange-bg);
  color: var(--accent-orange);
  border: 1px solid var(--accent-orange-glow);
}

.role-badge.member {
  background: var(--accent-blue-bg);
  color: var(--accent-blue);
  border: 1px solid rgba(164, 225, 255, 0.3);
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
  font-size: 1.1rem;
  color: var(--text-primary);
}

.icon-btn {
  color: var(--text-muted);
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.icon-btn:hover {
  color: var(--accent-orange);
  background: var(--accent-orange-bg);
}

.inline-edit {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.82rem;
}

.member-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}

.action-btn {
  flex: 1;
  font-size: 0.82rem;
}

.danger-icon-btn {
  color: var(--text-muted);
  padding: 6px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  transition: var(--transition-fast);
}

.danger-icon-btn:hover {
  color: var(--status-expired);
  background: var(--status-expired-bg);
  border-color: rgba(239, 68, 68, 0.3);
}
</style>
