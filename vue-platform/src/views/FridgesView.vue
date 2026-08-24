<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useFridgeStore } from '@/stores/fridge';
import CreateFridgeModal from '@/components/fridge/CreateFridgeModal.vue';
import InviteMemberModal from '@/components/fridge/InviteMemberModal.vue';
import { Plus, UserPlus, Trash2, LogOut, Edit3, Users, Crown, Refrigerator, Check } from '@lucide/vue';

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
        <h2 class="section-heading">Спільні холодильники</h2>
        <p class="section-subheading">Управління просторами для сім'ї або сусідів</p>
      </div>
      <button class="btn-primary btn-sm" @click="showCreateModal = true">
        <Plus :size="16" />
        <span>Створити холодильник</span>
      </button>
    </header>

    <div v-if="fridgeStore.fridges.length === 0" class="empty-state nordic-card">
      <div class="empty-icon-box">
        <Refrigerator :size="24" />
      </div>
      <h3>Холодильники не знайдені</h3>
      <p>Створіть власний холодильник або попросіть надіслати вам запрошення.</p>
    </div>

    <div v-else class="fridges-grid">
      <div
        v-for="fridge in fridgeStore.fridges"
        :key="fridge.id"
        class="nordic-card fridge-card"
        :class="{ 'active-fridge-card': fridge.id === fridgeStore.activeFridgeId }"
      >
        <div class="card-top">
          <div class="top-badges">
            <div class="role-badge" :class="fridge.role">
              <Crown v-if="fridge.role === 'owner'" :size="12" />
              <Users v-else :size="12" />
              <span>{{ fridge.role === 'owner' ? 'Власник' : 'Учасник' }}</span>
            </div>
            <span v-if="fridge.id === fridgeStore.activeFridgeId" class="active-badge-tag">
              <Check :size="11" />
              <span>Активний</span>
            </span>
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
              <Edit3 :size="13" />
            </button>
          </div>
          <p class="member-count">
            <Users :size="13" />
            {{ fridge.memberCount }} учасник{{ fridge.memberCount > 1 ? 'ів' : '' }}
          </p>
        </div>

        <div class="card-actions">
          <button
            v-if="fridge.id !== fridgeStore.activeFridgeId"
            class="btn-ghost action-btn"
            @click="fridgeStore.setActiveFridge(fridge.id)"
          >
            <span>Вибрати</span>
          </button>

          <button
            v-if="fridge.role === 'owner'"
            class="btn-secondary action-btn"
            @click="inviteModalFridge = { id: fridge.id, name: fridge.name }"
          >
            <UserPlus :size="14" />
            <span>Запросити</span>
          </button>

          <button
            v-if="fridge.role === 'owner'"
            class="danger-icon-btn"
            title="Видалити холодильник"
            @click="handleDelete(fridge.id, fridge.name)"
          >
            <Trash2 :size="15" />
          </button>

          <button
            v-else
            class="danger-icon-btn"
            title="Залишити холодильник"
            @click="handleLeave(fridge.id, fridge.name)"
          >
            <LogOut :size="15" />
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
.fridges-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.section-heading {
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.section-subheading {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.btn-sm {
  padding: 7px 12px;
  font-size: 0.82rem;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon-box {
  width: 46px;
  height: 46px;
  margin-bottom: 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.empty-state p {
  font-size: 0.82rem;
  color: var(--text-muted);
  max-width: 320px;
}

.fridges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.fridge-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: var(--transition-fast);
}

.active-fridge-card {
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.top-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

.active-badge-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  background: var(--status-fresh-bg);
  border: 1px solid var(--status-fresh-border);
  color: var(--status-fresh);
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
}

.role-badge.owner {
  background: var(--bg-subtle);
  color: var(--text-primary);
  border: 1px solid var(--border-strong);
}

.role-badge.member {
  background: var(--status-fresh-bg);
  color: var(--status-fresh);
  border: 1px solid var(--status-fresh-border);
}

.created-date {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fridge-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.icon-btn {
  color: var(--text-muted);
  padding: 3px;
  border-radius: var(--radius-xs);
  transition: var(--transition-fast);
}

.icon-btn:hover {
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.inline-edit {
  display: flex;
  gap: 8px;
}

.member-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}

.action-btn {
  flex: 1;
  font-size: 0.78rem;
  padding: 6px 10px;
}

.danger-icon-btn {
  color: var(--text-muted);
  padding: 6px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
  transition: var(--transition-fast);
}

.danger-icon-btn:hover {
  color: var(--status-expired);
  background: var(--status-expired-bg);
  border-color: var(--status-expired-border);
}
</style>
