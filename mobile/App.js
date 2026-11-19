import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import {
  User,
  Shield,
  Coins,
  Sparkles,
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  AlertTriangle,
  MoreVertical,
  Edit3,
  XCircle,
  RotateCcw,
  Trash2,
  Plus,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Bell,
  Calendar,
  Repeat,
  TrendingUp,
  TrendingDown,
  Home,
  ShoppingBag,
  Menu as MenuIcon,
  Award,
  FileText,
  AlignLeft,
  Clock,
  Flame,
  Star,
  Skull,
  Link,
  Gift,
  BarChart2,
  CheckCircle2,
} from 'lucide-react-native';

const STORAGE_KEY = '@do_it_now_state_v2';

const REPEAT_OPTIONS = [
  'Não repetir',
  'Semanalmente',
  'Mensalmente',
  'Todos os dias',
  'Anual',
];

const DEFAULT_HERO = {
  name: 'Douglas',
  avatarText: 'Herói',
  level: 0,
  gold: 37,
  xp: 9,
  skills: {
    Produtividade: 3,
    Disciplina: 2,
    Organização: 4,
    Foco: 2,
  },
};

const DEFAULT_TASKS = [
  {
    id: '1',
    title: 'Lavar a louça',
    description: 'Lavar pratos, talheres e panelas do almoço',
    repeat: 'Semanalmente',
    startDate: 'ter, 21/11/2026 12:00',
    allDay: false,
    reminders: ['15 min antes'],
    difficulty: 50,
    importance: 60,
    fear: 50,
    linkExpGold: true,
    xpReward: 1.6,
    goldReward: 10,
    increaseSkill: 'Organização',
    decreaseSkill: 'Disciplina',
    status: 'pending',
    createdAt: 1700000003000,
  },
  {
    id: '2',
    title: 'Arrumar a cama',
    description: 'Esticar lençol e organizar travesseiros logo ao acordar',
    repeat: 'Todos os dias',
    startDate: 'seg, 20/11/2026',
    allDay: true,
    reminders: [],
    difficulty: 25,
    importance: 25,
    fear: 0,
    linkExpGold: true,
    xpReward: 0.62,
    goldReward: 5,
    increaseSkill: 'Disciplina',
    decreaseSkill: 'Organização',
    status: 'pending',
    createdAt: 1700000002000,
  },
  {
    id: '3',
    title: 'Jogar lixo fora',
    description: 'Separar recicláveis e levar até a lixeira',
    repeat: 'Semanalmente',
    startDate: 'seg, 20/11/2026',
    allDay: true,
    reminders: [],
    difficulty: 20,
    importance: 30,
    fear: 10,
    linkExpGold: true,
    xpReward: 0.65,
    goldReward: 6,
    increaseSkill: 'Produtividade',
    decreaseSkill: 'Disciplina',
    status: 'pending',
    createdAt: 1700000001000,
  },
];

const DEFAULT_REWARDS = [
  { id: 'r1', title: 'Assistir 1 ep. de série', price: 10 },
  { id: 'r2', title: 'Jogar 1 partida de LoL', price: 67 },
  { id: 'r3', title: 'Comprar lanche', price: 330 },
];

const DEFAULT_REDEEMED = [];

const SKILL_NAMES = ['Nenhuma', 'Produtividade', 'Disciplina', 'Organização', 'Foco'];

function calculateLinkedRewards(difficulty, importance, fear) {
  const xp = Number((Math.floor(difficulty * 1.5 + importance * 1.0 + fear * 0.5) / 100).toFixed(2));
  const gold = Math.max(1, Math.round((difficulty + importance + fear) / 10));
  return { xp, gold };
}

function formatNumberBR(num) {
  return Number(num || 0)
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1')
    .replace('.', ',');
}

function XpIcon({ size = 14, color = '#000000', bgColor = 'transparent' }) {
  const height = Math.max(13, Math.round(size * 1.1));
  const width = Math.max(19, Math.round(size * 1.55));
  const fontSize = Math.max(8, Math.round(size * 0.65));
  return (
    <View
      style={{
        width,
        height,
        borderRadius: Math.round(height / 3.2),
        borderWidth: 1.4,
        borderColor: color,
        backgroundColor: bgColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize,
          fontWeight: '900',
          color,
          lineHeight: fontSize + 1,
          letterSpacing: -0.3,
        }}
      >
        XP
      </Text>
    </View>
  );
}

export default function App() {
  // Navigation state: 'home' | 'step1' | 'step2' | 'shop' | 'menu'
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isLoaded, setIsLoaded] = useState(false);

  // App persistent state
  const [hero, setHero] = useState(DEFAULT_HERO);
  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [rewards, setRewards] = useState(DEFAULT_REWARDS);
  const [redeemedRewards, setRedeemedRewards] = useState(DEFAULT_REDEEMED);

  // Home screen filters & UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [openMenuTaskId, setOpenMenuTaskId] = useState(null);

  // Task completion / fail modal state
  const [confirmTaskModal, setConfirmTaskModal] = useState(null);

  // Task Form state (Step 1 & Step 2)
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [formTitle, setFormTitle] = useState('Lavar louça');
  const [formDescription, setFormDescription] = useState('');
  const [formRepeat, setFormRepeat] = useState('Semanalmente');
  const [showRepeatDropdown, setShowRepeatDropdown] = useState(false);
  const [formStartDate, setFormStartDate] = useState('10/11/2026');
  const [formAllDay, setFormAllDay] = useState(true);
  const [formReminders, setFormReminders] = useState([]);
  const [newReminderInput, setNewReminderInput] = useState('');
  const [showReminderInput, setShowReminderInput] = useState(false);

  const [formDifficulty, setFormDifficulty] = useState(25);
  const [formImportance, setFormImportance] = useState(25);
  const [formFear, setFormFear] = useState(0);
  const [formLinkExpGold, setFormLinkExpGold] = useState(true);
  const [formCustomXp, setFormCustomXp] = useState('0.62');
  const [formCustomGold, setFormCustomGold] = useState('5');
  const [formIncreaseSkill, setFormIncreaseSkill] = useState('Organização');
  const [formDecreaseSkill, setFormDecreaseSkill] = useState('Disciplina');
  const [showIncreaseSkillDropdown, setShowIncreaseSkillDropdown] = useState(false);
  const [showDecreaseSkillDropdown, setShowDecreaseSkillDropdown] = useState(false);

  // Shop state
  const [shopTab, setShopTab] = useState('available');
  const [shopSearch, setShopSearch] = useState('');
  const [showShopSearch, setShowShopSearch] = useState(false);
  const [shopSortAsc, setShopSortAsc] = useState(true);
  const [selectedRewardToRedeem, setSelectedRewardToRedeem] = useState(null);
  const [showNewRewardModal, setShowNewRewardModal] = useState(false);
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardPrice, setNewRewardPrice] = useState('');

  // Status banner / feedback notification
  const [feedbackBanner, setFeedbackBanner] = useState(null);

  const showFeedback = (text) => {
    setFeedbackBanner(text);
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev === text ? null : prev));
    }, 3000);
  };

  // Load saved data from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.hero) setHero(parsed.hero);
          if (parsed.tasks) setTasks(parsed.tasks);
          if (parsed.rewards) setRewards(parsed.rewards);
          if (parsed.redeemedRewards) setRedeemedRewards(parsed.redeemedRewards);
        }
      } catch (e) {
        console.warn('Erro ao carregar dados locais:', e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Save data whenever state changes
  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            hero,
            tasks,
            rewards,
            redeemedRewards,
          })
        );
      } catch (e) {
        console.warn('Erro ao salvar dados locais:', e);
      }
    })();
  }, [hero, tasks, rewards, redeemedRewards, isLoaded]);

  // Derived RPG progress
  const xpPerLevel = 10;
  const currentLevelProgressPct = useMemo(() => {
    const xpInCurrentLevel = hero.xp % xpPerLevel;
    return Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpPerLevel) * 100)));
  }, [hero.xp]);

  // Computed form rewards
  const computedFormRewards = useMemo(() => {
    if (formLinkExpGold) {
      return calculateLinkedRewards(formDifficulty, formImportance, formFear);
    }
    const xp = Math.max(0, parseFloat(String(formCustomXp).replace(',', '.')) || 0);
    const gold = Math.max(0, parseInt(formCustomGold, 10) || 0);
    return { xp, gold };
  }, [formLinkExpGold, formDifficulty, formImportance, formFear, formCustomXp, formCustomGold]);

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = (t.description || '').toLowerCase().includes(q);
          const matchDate = (t.startDate || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchDate) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'reward') return (b.goldReward || 0) - (a.goldReward || 0);
        if (sortBy === 'difficulty') return (b.difficulty || 0) - (a.difficulty || 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [tasks, statusFilter, searchQuery, sortBy]);

  // Filtered and sorted shop rewards
  const filteredRewards = useMemo(() => {
    return rewards
      .filter((r) => {
        if (!shopSearch.trim()) return true;
        return r.title.toLowerCase().includes(shopSearch.toLowerCase());
      })
      .sort((a, b) => (shopSortAsc ? a.price - b.price : b.price - a.price));
  }, [rewards, shopSearch, shopSortAsc]);

  // Actions: Open New Task Form
  const handleStartNewTask = () => {
    setEditingTaskId(null);
    setFormTitle('');
    setFormDescription('');
    setFormRepeat('Semanalmente');
    setShowRepeatDropdown(false);
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setFormStartDate(`${dd}/${mm}/${yyyy}`);
    setFormAllDay(true);
    setFormReminders([]);
    setShowReminderInput(false);
    setFormDifficulty(25);
    setFormImportance(25);
    setFormFear(0);
    setFormLinkExpGold(true);
    setFormCustomXp('0.62');
    setFormCustomGold('5');
    setFormIncreaseSkill('Organização');
    setFormDecreaseSkill('Disciplina');
    setOpenMenuTaskId(null);
    setCurrentScreen('step1');
  };

  // Actions: Open Edit Task Form
  const handleEditTask = (task) => {
    setEditingTaskId(task.id);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormRepeat(task.repeat || 'Não repetir');
    setShowRepeatDropdown(false);
    setFormStartDate(task.startDate || '10/11/2026');
    setFormAllDay(Boolean(task.allDay));
    setFormReminders(task.reminders || []);
    setShowReminderInput(false);
    setFormDifficulty(task.difficulty ?? 25);
    setFormImportance(task.importance ?? 25);
    setFormFear(task.fear ?? 0);
    setFormLinkExpGold(task.linkExpGold ?? true);
    setFormCustomXp(String(task.xpReward ?? 0.62));
    setFormCustomGold(String(task.goldReward ?? 5));
    setFormIncreaseSkill(task.increaseSkill || 'Organização');
    setFormDecreaseSkill(task.decreaseSkill || 'Disciplina');
    setOpenMenuTaskId(null);
    setCurrentScreen('step1');
  };

  // Actions: Save Task (Create or Update)
  const handleSaveTask = () => {
    const finalTitle = formTitle.trim() || 'Nova Tarefa';
    const { xp, gold } = computedFormRewards;

    if (editingTaskId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTaskId
            ? {
                ...t,
                title: finalTitle,
                description: formDescription.trim(),
                repeat: formRepeat,
                startDate: formStartDate.trim() || 'Sem data',
                allDay: formAllDay,
                reminders: formReminders,
                difficulty: formDifficulty,
                importance: formImportance,
                fear: formFear,
                linkExpGold: formLinkExpGold,
                xpReward: xp,
                goldReward: gold,
                increaseSkill: formIncreaseSkill,
                decreaseSkill: formDecreaseSkill,
              }
            : t
        )
      );
      showFeedback(`Tarefa "${finalTitle}" atualizada!`);
    } else {
      const newTask = {
        id: String(Date.now()),
        title: finalTitle,
        description: formDescription.trim(),
        repeat: formRepeat,
        startDate: formStartDate.trim() || 'Sem data',
        allDay: formAllDay,
        reminders: formReminders,
        difficulty: formDifficulty,
        importance: formImportance,
        fear: formFear,
        linkExpGold: formLinkExpGold,
        xpReward: xp,
        goldReward: gold,
        increaseSkill: formIncreaseSkill,
        decreaseSkill: formDecreaseSkill,
        status: 'pending',
        createdAt: Date.now(),
      };
      setTasks((prev) => [newTask, ...prev]);
      showFeedback(`Tarefa "${finalTitle}" criada!`);
    }

    setCurrentScreen('home');
  };

  // Actions: Complete Task
  const executeCompleteTask = (task) => {
    const goldGain = Number(task.goldReward || 0);
    const xpGain = Number(task.xpReward || 0);

    setHero((prev) => {
      const nextXp = Number((prev.xp + xpGain).toFixed(2));
      const nextLevel = Math.floor(nextXp / xpPerLevel);
      const nextGold = prev.gold + goldGain;
      const nextSkills = { ...(prev.skills || {}) };
      if (task.increaseSkill && task.increaseSkill !== 'Nenhuma') {
        nextSkills[task.increaseSkill] = (nextSkills[task.increaseSkill] || 0) + 1;
      }
      return {
        ...prev,
        gold: nextGold,
        xp: nextXp,
        level: nextLevel,
        skills: nextSkills,
      };
    });

    if (task.repeat && task.repeat !== 'Não repetir') {
      showFeedback(`Concluída! +${goldGain} Ouro | +${formatNumberBR(xpGain)} XP (${task.repeat})`);
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'completed' } : t))
      );
      showFeedback(`Concluída! +${goldGain} Ouro | +${formatNumberBR(xpGain)} XP`);
    }
    setConfirmTaskModal(null);
    setOpenMenuTaskId(null);
  };

  // Actions: Fail Task
  const executeFailTask = (task) => {
    const goldPenalty = Number(task.goldReward || 0);
    const xpPenalty = Number(task.xpReward || 0);

    setHero((prev) => {
      const nextXp = Math.max(0, Number((prev.xp - xpPenalty).toFixed(2)));
      const nextLevel = Math.floor(nextXp / xpPerLevel);
      const nextGold = Math.max(0, prev.gold - goldPenalty);
      const nextSkills = { ...(prev.skills || {}) };
      if (task.decreaseSkill && task.decreaseSkill !== 'Nenhuma') {
        nextSkills[task.decreaseSkill] = Math.max(0, (nextSkills[task.decreaseSkill] || 0) - 1);
      }
      return {
        ...prev,
        gold: nextGold,
        xp: nextXp,
        level: nextLevel,
        skills: nextSkills,
      };
    });

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'failed' } : t))
    );
    showFeedback(`Falhou! -${goldPenalty} Ouro | -${formatNumberBR(xpPenalty)} XP`);
    setConfirmTaskModal(null);
    setOpenMenuTaskId(null);
  };

  // Actions: Delete Task
  const executeDeleteTask = (task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    showFeedback(`Tarefa "${task.title}" excluída.`);
    setConfirmTaskModal(null);
    setOpenMenuTaskId(null);
  };

  // Actions: Reopen task
  const handleReopenTask = (task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'pending' } : t))
    );
    setOpenMenuTaskId(null);
    showFeedback(`Tarefa "${task.title}" reaberta.`);
  };

  // Actions: Redeem Reward in Shop
  const handleRedeemReward = (reward) => {
    if (hero.gold < reward.price) {
      showFeedback(`Ouro insuficiente! Você precisa de ${reward.price} de ouro.`);
      setSelectedRewardToRedeem(null);
      return;
    }

    setHero((prev) => ({
      ...prev,
      gold: prev.gold - reward.price,
    }));

    const redeemedEntry = {
      id: `${reward.id}_${Date.now()}`,
      rewardId: reward.id,
      title: reward.title,
      price: reward.price,
      redeemedAt: new Date().toLocaleString('pt-BR'),
    };
    setRedeemedRewards((prev) => [redeemedEntry, ...prev]);
    setSelectedRewardToRedeem(null);
    showFeedback(`Recompensa "${reward.title}" resgatada (-${reward.price} de ouro)!`);
  };

  // Actions: Create New Shop Reward
  const handleCreateReward = () => {
    const title = newRewardTitle.trim();
    const price = parseInt(newRewardPrice, 10);
    if (!title || isNaN(price) || price <= 0) {
      showFeedback('Preencha um título e preço válido (> 0).');
      return;
    }
    const newItem = {
      id: `r_${Date.now()}`,
      title,
      price,
    };
    setRewards((prev) => [...prev, newItem]);
    setNewRewardTitle('');
    setNewRewardPrice('');
    setShowNewRewardModal(false);
    showFeedback(`Recompensa "${title}" adicionada à loja!`);
  };

  // Actions: Reset Demo Data
  const handleResetDemoData = async () => {
    setHero(DEFAULT_HERO);
    setTasks(DEFAULT_TASKS);
    setRewards(DEFAULT_REWARDS);
    setRedeemedRewards(DEFAULT_REDEEMED);
    setStatusFilter('pending');
    setSearchQuery('');
    await AsyncStorage.removeItem(STORAGE_KEY);
    showFeedback('Dados restaurados para o padrão original do protótipo!');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" backgroundColor="#F8FAFC" />

        {/* Main Frame Container */}
        <View style={styles.appFrame}>
          {/* Feedback Notification Toast */}
          {feedbackBanner && (
            <TouchableOpacity style={styles.feedbackToast} onPress={() => setFeedbackBanner(null)}>
              <CheckCircle2 size={16} color="#34D399" strokeWidth={2.5} />
              <Text style={styles.feedbackToastText}>{feedbackBanner}</Text>
              <X size={16} color="#94A3B8" strokeWidth={2.5} />
            </TouchableOpacity>
          )}

          {/* ==================== TELA 1: HOME / JORNADA ==================== */}
          {currentScreen === 'home' && (
            <View style={styles.screenContainer}>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Hero Card */}
                <TouchableOpacity
                  style={styles.heroCard}
                  activeOpacity={0.85}
                  onPress={() => setCurrentScreen('menu')}
                >
                  <View style={styles.heroAvatar}>
                    <User size={26} color="#4F46E5" strokeWidth={2.2} />
                  </View>
                  <View style={styles.heroInfo}>
                    <Text style={styles.heroName}>{hero.name}</Text>
                    <View style={styles.heroStats}>
                      <View style={styles.statBadge}>
                        <Shield size={13} color="#4F46E5" strokeWidth={2.2} />
                        <Text style={[styles.heroStatText, { color: '#4338CA' }]}>Nível {hero.level}</Text>
                      </View>
                      <Text style={styles.heroStatDivider}>•</Text>
                      <View style={styles.statBadge}>
                        <Coins size={13} color="#D97706" strokeWidth={2.2} />
                        <Text style={[styles.heroStatText, { color: '#B45309' }]}>{hero.gold}</Text>
                      </View>
                      <Text style={styles.heroStatDivider}>•</Text>
                      <View style={styles.statBadge}>
                        <XpIcon size={13} color="#0284C7" bgColor="#E0F2FE" />
                        <Text style={[styles.heroStatText, { color: '#0369A1' }]}>{formatNumberBR(hero.xp)}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.heroProgressCircle}>
                    <Text style={styles.heroProgressText}>{currentLevelProgressPct}%</Text>
                  </View>
                </TouchableOpacity>

                {/* Search Box */}
                <View style={styles.searchBoxWrapper}>
                  <Search size={17} color="#6366F1" strokeWidth={2.2} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Pesquisar tarefa..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                      <X size={17} color="#64748B" strokeWidth={2.2} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Filter & Sort Buttons */}
                <View style={styles.filterActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.pillBtn,
                      statusFilter !== 'pending' && styles.pillBtnActive,
                    ]}
                    onPress={() => setShowFilterModal(true)}
                  >
                    <SlidersHorizontal
                      size={15}
                      color={statusFilter !== 'pending' ? '#FFFFFF' : '#4F46E5'}
                      strokeWidth={2.2}
                    />
                    <Text
                      style={[
                        styles.pillBtnText,
                        statusFilter !== 'pending' && styles.pillBtnTextActive,
                      ]}
                    >
                      {statusFilter === 'pending'
                        ? 'Filtros'
                        : statusFilter === 'completed'
                        ? 'Concluídas'
                        : statusFilter === 'failed'
                        ? 'Falhadas'
                        : 'Todas'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pillBtn}
                    onPress={() => setShowSortModal(true)}
                  >
                    <ArrowUpDown size={15} color="#4F46E5" strokeWidth={2.2} />
                    <Text style={styles.pillBtnText}>
                      {sortBy === 'recent'
                        ? 'Ordenação'
                        : sortBy === 'reward'
                        ? 'Por Ouro'
                        : sortBy === 'difficulty'
                        ? 'Dificuldade'
                        : 'A-Z'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Task List */}
                {filteredTasks.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <CheckCircle2 size={24} color="#6366F1" strokeWidth={2} style={{ marginBottom: 8 }} />
                    <Text style={styles.emptyBoxTitle}>Nenhuma tarefa encontrada</Text>
                    <Text style={styles.emptyBoxSub}>
                      Toque no botão + para cadastrar uma nova tarefa ou altere o filtro atual.
                    </Text>
                  </View>
                ) : (
                  filteredTasks.map((task) => {
                    const isMenuOpen = openMenuTaskId === task.id;
                    const isCompleted = task.status === 'completed';
                    const isFailed = task.status === 'failed';

                    return (
                      <View key={task.id} style={styles.taskItemWrapper}>
                        <View
                          style={[
                            styles.taskItem,
                            isCompleted && styles.taskItemCompleted,
                            isFailed && styles.taskItemFailed,
                          ]}
                        >
                          <View style={styles.taskInfoCol}>
                            <Text
                              style={[
                                styles.taskTitle,
                                isCompleted && styles.taskTitleCompleted,
                              ]}
                            >
                              {task.title}
                            </Text>
                            <View style={styles.taskDateRow}>
                              <Calendar size={12} color="#6366F1" strokeWidth={2} />
                              <Text style={styles.taskDate}>
                                {task.startDate}
                                {task.repeat && task.repeat !== 'Não repetir'
                                  ? ` • ${task.repeat}`
                                  : ''}
                              </Text>
                            </View>
                            <View style={styles.taskRewardsBadgeRow}>
                              <View style={[styles.miniTag, styles.miniTagGold]}>
                                <Coins size={11} color="#D97706" strokeWidth={2.2} />
                                <Text style={[styles.miniTagText, { color: '#B45309' }]}>+{task.goldReward}</Text>
                              </View>
                              <View style={[styles.miniTag, styles.miniTagXp]}>
                                <XpIcon size={11} color="#0284C7" bgColor="#E0F2FE" />
                                <Text style={[styles.miniTagText, { color: '#0369A1' }]}>
                                  +{formatNumberBR(task.xpReward)}
                                </Text>
                              </View>
                              {isFailed && (
                                <View style={[styles.miniTag, styles.miniTagDanger]}>
                                  <Text style={styles.miniTagTextInverted}>FALHOU</Text>
                                </View>
                              )}
                              {isCompleted && (
                                <View style={[styles.miniTag, styles.miniTagSuccess]}>
                                  <Text style={styles.miniTagTextInverted}>CONCLUÍDA</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          <View style={styles.taskActionsCol}>
                            <TouchableOpacity
                              style={[
                                styles.checkBox,
                                isCompleted && styles.checkBoxChecked,
                                isFailed && styles.checkBoxFailed,
                              ]}
                              onPress={() => {
                                if (isCompleted || isFailed) {
                                  handleReopenTask(task);
                                } else {
                                  setConfirmTaskModal({ task, action: 'complete' });
                                }
                              }}
                            >
                              {isCompleted ? (
                                <Check size={16} color="#FFFFFF" strokeWidth={3} />
                              ) : isFailed ? (
                                <AlertTriangle size={14} color="#DC2626" strokeWidth={2.5} />
                              ) : (
                                <Check size={16} color="#10B981" strokeWidth={2.5} />
                              )}
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.menuDotsBtn,
                                isMenuOpen && styles.menuDotsBtnActive,
                              ]}
                              onPress={() =>
                                setOpenMenuTaskId(isMenuOpen ? null : task.id)
                              }
                            >
                              <MoreVertical
                                size={18}
                                color={isMenuOpen ? '#FFFFFF' : '#475569'}
                                strokeWidth={2.2}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Context Menu (Editar / Falhar / Excluir) */}
                        {isMenuOpen && (
                          <View style={styles.contextMenu}>
                            <TouchableOpacity
                              style={styles.contextMenuItem}
                              onPress={() => handleEditTask(task)}
                            >
                              <Edit3 size={14} color="#4F46E5" strokeWidth={2.2} />
                              <Text style={[styles.contextMenuText, { color: '#4F46E5' }]}>Editar</Text>
                            </TouchableOpacity>

                            {task.status === 'pending' ? (
                              <TouchableOpacity
                                style={styles.contextMenuItem}
                                onPress={() =>
                                  setConfirmTaskModal({ task, action: 'fail' })
                                }
                              >
                                <XCircle size={14} color="#EA580C" strokeWidth={2.2} />
                                <Text style={[styles.contextMenuText, { color: '#EA580C' }]}>Falhar</Text>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                style={styles.contextMenuItem}
                                onPress={() => handleReopenTask(task)}
                              >
                                <RotateCcw size={14} color="#0284C7" strokeWidth={2.2} />
                                <Text style={[styles.contextMenuText, { color: '#0284C7' }]}>Reabrir</Text>
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity
                              style={[styles.contextMenuItem, styles.contextMenuItemLast]}
                              onPress={() =>
                                setConfirmTaskModal({ task, action: 'delete' })
                              }
                            >
                              <Trash2 size={14} color="#DC2626" strokeWidth={2.2} />
                              <Text style={[styles.contextMenuText, { color: '#DC2626' }]}>Excluir</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>

              {/* Floating Action Button (+) */}
              <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.85}
                onPress={handleStartNewTask}
              >
                <Plus size={26} color="#FFFFFF" strokeWidth={2.8} />
              </TouchableOpacity>
            </View>
          )}

          {/* ==================== TELA 2: CADASTRO ETAPA 1 ==================== */}
          {currentScreen === 'step1' && (
            <View style={styles.screenContainer}>
              <ScrollView
                contentContainerStyle={styles.scrollContentWithFooter}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.pageHeader}>
                  <TouchableOpacity
                    style={styles.backLink}
                    onPress={() => setCurrentScreen('home')}
                  >
                    <ArrowLeft size={17} color="#4F46E5" strokeWidth={2.5} />
                  </TouchableOpacity>
                  <Text style={styles.pageHeaderTitle}>
                    {editingTaskId ? 'Editar Tarefa (1/2)' : 'Nova Tarefa (1/2)'}
                  </Text>
                </View>

                {/* Título */}
                <View style={styles.formGroup}>
                  <View style={styles.formLabelRow}>
                    <FileText size={13} color="#4F46E5" strokeWidth={2.3} />
                    <Text style={styles.formLabel}>TÍTULO</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={formTitle}
                    onChangeText={setFormTitle}
                    placeholder="Ex: Lavar louça"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                {/* Descrição */}
                <View style={styles.formGroup}>
                  <View style={styles.formLabelRow}>
                    <AlignLeft size={13} color="#4F46E5" strokeWidth={2.3} />
                    <Text style={styles.formLabel}>DESCRIÇÃO</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={formDescription}
                    onChangeText={setFormDescription}
                    placeholder="Detalhes opcionais..."
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                {/* Repetição */}
                <View style={styles.formGroup}>
                  <View style={styles.formLabelRow}>
                    <Repeat size={13} color="#4F46E5" strokeWidth={2.3} />
                    <Text style={styles.formLabel}>REPETIÇÃO</Text>
                  </View>
                  <Text style={styles.instructionText}>
                    Aqui você pode definir se a tarefa vai repetir e como vai repetir
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setShowRepeatDropdown(!showRepeatDropdown)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Repeat size={15} color="#4F46E5" strokeWidth={2.2} />
                      <Text style={styles.dropdownTriggerText}>{formRepeat}</Text>
                    </View>
                    {showRepeatDropdown ? (
                      <ChevronUp size={18} color="#4F46E5" strokeWidth={2.5} />
                    ) : (
                      <ChevronDown size={18} color="#4F46E5" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>

                  {showRepeatDropdown && (
                    <View style={styles.dropdownList}>
                      {REPEAT_OPTIONS.map((option, idx) => {
                        const isSelected = formRepeat === option;
                        return (
                          <TouchableOpacity
                            key={option}
                            style={[
                              styles.dropdownItem,
                              isSelected && styles.dropdownItemSelected,
                              idx === REPEAT_OPTIONS.length - 1 && { borderBottomWidth: 0 },
                            ]}
                            onPress={() => {
                              setFormRepeat(option);
                              setShowRepeatDropdown(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                isSelected && styles.dropdownItemTextSelected,
                              ]}
                            >
                              {option}
                            </Text>
                            {isSelected && (
                              <Check size={14} color="#FFFFFF" strokeWidth={2.8} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Data de Início */}
                <View style={styles.formGroup}>
                  <View style={styles.formLabelRow}>
                    <Calendar size={13} color="#4F46E5" strokeWidth={2.3} />
                    <Text style={styles.formLabel}>DATA DE INÍCIO</Text>
                  </View>
                  <View style={styles.inputWithIconWrapper}>
                    <Calendar size={15} color="#4F46E5" strokeWidth={2.2} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.inputWithIconField}
                      value={formStartDate}
                      onChangeText={setFormStartDate}
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* Dia inteiro */}
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setFormAllDay(!formAllDay)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Clock size={16} color="#4F46E5" strokeWidth={2.2} />
                    <Text style={styles.toggleRowLabel}>Dia inteiro</Text>
                  </View>
                  <View style={[styles.checkBox, formAllDay && styles.checkBoxChecked]}>
                    {formAllDay && <Check size={15} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>

                {/* Lembretes */}
                {formReminders.length > 0 && (
                  <View style={styles.remindersList}>
                    {formReminders.map((rem, index) => (
                      <View key={`${rem}_${index}`} style={styles.reminderChip}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Bell size={13} color="#D97706" strokeWidth={2.2} />
                          <Text style={styles.reminderChipText}>{rem}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            setFormReminders((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                        >
                          <X size={15} color="#DC2626" strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {showReminderInput ? (
                  <View style={styles.reminderInputRow}>
                    <TextInput
                      style={[styles.formInput, { flex: 1 }]}
                      value={newReminderInput}
                      onChangeText={setNewReminderInput}
                      placeholder="Ex: 30 min antes, 08:00..."
                      placeholderTextColor="#94A3B8"
                    />
                    <TouchableOpacity
                      style={[styles.btn, styles.btnPrimary, { flex: 0, paddingHorizontal: 16 }]}
                      onPress={() => {
                        if (newReminderInput.trim()) {
                          setFormReminders((prev) => [...prev, newReminderInput.trim()]);
                          setNewReminderInput('');
                        }
                        setShowReminderInput(false);
                      }}
                    >
                      <Text style={styles.btnPrimaryText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.pillBtn, { width: '100%', marginTop: 8 }]}
                    onPress={() => setShowReminderInput(true)}
                  >
                    <Bell size={15} color="#D97706" strokeWidth={2.2} />
                    <Text style={styles.pillBtnText}>Adicionar lembrete</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              {/* Fixed Footer Actions */}
              <View style={styles.fixedFooterActions}>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => setCurrentScreen('home')}
                >
                  <X size={15} color="#475569" strokeWidth={2.5} />
                  <Text style={styles.btnText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={() => setCurrentScreen('step2')}
                >
                  <Text style={styles.btnPrimaryText}>Próxima Etapa</Text>
                  <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ==================== TELA 3: CADASTRO ETAPA 2 (RPG) ==================== */}
          {currentScreen === 'step2' && (
            <View style={styles.screenContainer}>
              <ScrollView
                contentContainerStyle={styles.scrollContentWithFooter}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.pageHeader}>
                  <TouchableOpacity
                    style={styles.backLink}
                    onPress={() => setCurrentScreen('step1')}
                  >
                    <ArrowLeft size={17} color="#4F46E5" strokeWidth={2.5} />
                  </TouchableOpacity>
                  <Text style={styles.pageHeaderTitle}>Elementos de RPG (2/2)</Text>
                </View>

                {/* Slider Dificuldade */}
                <View style={[styles.sliderContainer, { borderColor: '#FDBA74', backgroundColor: '#FFF7ED' }]}>
                  <View style={styles.sliderHeader}>
                    <View style={styles.sliderTitleRow}>
                      <Flame size={15} color="#EA580C" strokeWidth={2.2} />
                      <Text style={[styles.sliderHeaderText, { color: '#9A3412' }]}>Dificuldade</Text>
                    </View>
                    <Text style={[styles.sliderHeaderText, { color: '#EA580C' }]}>{formDifficulty}%</Text>
                  </View>
                  <View style={styles.customSliderBarWrapper}>
                    <View style={[styles.staticSliderTrack, { borderColor: '#EA580C', backgroundColor: '#FFEDD5' }]}>
                      <View
                        style={[
                          styles.staticSliderFill,
                          { width: `${formDifficulty}%`, backgroundColor: '#EA580C' },
                        ]}
                      />
                    </View>
                    <Slider
                      style={styles.nativeSlider}
                      minimumValue={0}
                      maximumValue={100}
                      step={1}
                      value={formDifficulty}
                      onValueChange={setFormDifficulty}
                      minimumTrackTintColor="#EA580C"
                      maximumTrackTintColor="#FED7AA"
                      thumbTintColor="#EA580C"
                    />
                  </View>
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabelText}>0%</Text>
                    <Text style={styles.sliderLabelText}>50%</Text>
                    <Text style={styles.sliderLabelText}>100%</Text>
                  </View>
                </View>

                {/* Slider Importância */}
                <View style={[styles.sliderContainer, { borderColor: '#FDE047', backgroundColor: '#FEFCE8' }]}>
                  <View style={styles.sliderHeader}>
                    <View style={styles.sliderTitleRow}>
                      <Star size={15} color="#D97706" strokeWidth={2.2} />
                      <Text style={[styles.sliderHeaderText, { color: '#92400E' }]}>Importância</Text>
                    </View>
                    <Text style={[styles.sliderHeaderText, { color: '#D97706' }]}>{formImportance}%</Text>
                  </View>
                  <View style={styles.customSliderBarWrapper}>
                    <View style={[styles.staticSliderTrack, { borderColor: '#D97706', backgroundColor: '#FEF3C7' }]}>
                      <View
                        style={[
                          styles.staticSliderFill,
                          { width: `${formImportance}%`, backgroundColor: '#D97706' },
                        ]}
                      />
                    </View>
                    <Slider
                      style={styles.nativeSlider}
                      minimumValue={0}
                      maximumValue={100}
                      step={1}
                      value={formImportance}
                      onValueChange={setFormImportance}
                      minimumTrackTintColor="#D97706"
                      maximumTrackTintColor="#FDE68A"
                      thumbTintColor="#D97706"
                    />
                  </View>
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabelText}>0%</Text>
                    <Text style={styles.sliderLabelText}>50%</Text>
                    <Text style={styles.sliderLabelText}>100%</Text>
                  </View>
                </View>

                {/* Slider Medo */}
                <View style={[styles.sliderContainer, { borderColor: '#D8B4FE', backgroundColor: '#FAF5FF' }]}>
                  <View style={styles.sliderHeader}>
                    <View style={styles.sliderTitleRow}>
                      <Skull size={15} color="#9333EA" strokeWidth={2.2} />
                      <Text style={[styles.sliderHeaderText, { color: '#6B21A8' }]}>Medo</Text>
                    </View>
                    <Text style={[styles.sliderHeaderText, { color: '#9333EA' }]}>{formFear}%</Text>
                  </View>
                  <View style={styles.customSliderBarWrapper}>
                    <View style={[styles.staticSliderTrack, { borderColor: '#9333EA', backgroundColor: '#F3E8FF' }]}>
                      <View
                        style={[
                          styles.staticSliderFill,
                          { width: `${formFear}%`, backgroundColor: '#9333EA' },
                        ]}
                      />
                    </View>
                    <Slider
                      style={styles.nativeSlider}
                      minimumValue={0}
                      maximumValue={100}
                      step={1}
                      value={formFear}
                      onValueChange={setFormFear}
                      minimumTrackTintColor="#9333EA"
                      maximumTrackTintColor="#E9D5FF"
                      thumbTintColor="#9333EA"
                    />
                  </View>
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabelText}>0%</Text>
                    <Text style={styles.sliderLabelText}>50%</Text>
                    <Text style={styles.sliderLabelText}>100%</Text>
                  </View>
                </View>

                {/* Vincular EXP e Ouro */}
                <View style={styles.rpgRewardBox}>
                  <TouchableOpacity
                    style={styles.rpgRewardHeaderRow}
                    onPress={() => setFormLinkExpGold(!formLinkExpGold)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Link size={15} color="#4F46E5" strokeWidth={2.2} />
                      <Text style={styles.rpgRewardTitle}>Vincular EXP e Ouro</Text>
                    </View>
                    <View
                      style={[
                        styles.checkBox,
                        formLinkExpGold && styles.checkBoxChecked,
                      ]}
                    >
                      {formLinkExpGold && (
                        <Check size={15} color="#FFFFFF" strokeWidth={3} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {formLinkExpGold ? (
                    <View style={{ gap: 6, marginTop: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <XpIcon size={13} color="#0284C7" bgColor="#E0F2FE" />
                        <Text style={[styles.rpgRewardLine, { color: '#0369A1' }]}>
                          + {formatNumberBR(computedFormRewards.xp)} XP
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Coins size={14} color="#D97706" strokeWidth={2.2} />
                        <Text style={[styles.rpgRewardLine, { color: '#B45309' }]}>
                          Recompensa: {computedFormRewards.gold} de ouro
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.customRewardInputsRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.formLabel}>XP MANUAL</Text>
                        <TextInput
                          style={styles.formInput}
                          keyboardType="numeric"
                          value={formCustomXp}
                          onChangeText={setFormCustomXp}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.formLabel}>OURO MANUAL</Text>
                        <TextInput
                          style={styles.formInput}
                          keyboardType="numeric"
                          value={formCustomGold}
                          onChangeText={setFormCustomGold}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* Penalidade de falha */}
                <View style={styles.penaltyBox}>
                  <AlertTriangle size={15} color="#DC2626" strokeWidth={2.2} />
                  <Text style={styles.penaltyText}>
                    Penalidade de falha: {formatNumberBR(computedFormRewards.xp)} XP e{' '}
                    {computedFormRewards.gold} de ouro perdidos ao falhar.
                  </Text>
                </View>

                {/* Aumentar Habilidade */}
                <TouchableOpacity
                  style={[styles.pillBtn, { width: '100%', marginBottom: 8, justifyContent: 'space-between', paddingHorizontal: 14, borderColor: '#10B981', backgroundColor: '#ECFDF5' }]}
                  onPress={() =>
                    setShowIncreaseSkillDropdown(!showIncreaseSkillDropdown)
                  }
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={15} color="#059669" strokeWidth={2.2} />
                    <Text style={[styles.pillBtnText, { color: '#065F46' }]}>
                      Aumentar Habilidade: {formIncreaseSkill}
                    </Text>
                  </View>
                  <ChevronDown size={16} color="#059669" strokeWidth={2.2} />
                </TouchableOpacity>
                {showIncreaseSkillDropdown && (
                  <View style={[styles.dropdownList, { marginBottom: 10 }]}>
                    {SKILL_NAMES.map((skill) => (
                      <TouchableOpacity
                        key={`inc_${skill}`}
                        style={[
                          styles.dropdownItem,
                          formIncreaseSkill === skill && styles.dropdownItemSelected,
                        ]}
                        onPress={() => {
                          setFormIncreaseSkill(skill);
                          setShowIncreaseSkillDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            formIncreaseSkill === skill &&
                              styles.dropdownItemTextSelected,
                          ]}
                        >
                          {skill}
                        </Text>
                        {formIncreaseSkill === skill && (
                          <Check size={14} color="#FFFFFF" strokeWidth={2.8} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Diminuir Habilidade */}
                <TouchableOpacity
                  style={[styles.pillBtn, { width: '100%', marginBottom: 12, justifyContent: 'space-between', paddingHorizontal: 14, borderColor: '#F43F5E', backgroundColor: '#FFF1F2' }]}
                  onPress={() =>
                    setShowDecreaseSkillDropdown(!showDecreaseSkillDropdown)
                  }
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TrendingDown size={15} color="#E11D48" strokeWidth={2.2} />
                    <Text style={[styles.pillBtnText, { color: '#9F1239' }]}>
                      Diminuir Habilidade: {formDecreaseSkill}
                    </Text>
                  </View>
                  <ChevronDown size={16} color="#E11D48" strokeWidth={2.2} />
                </TouchableOpacity>
                {showDecreaseSkillDropdown && (
                  <View style={[styles.dropdownList, { marginBottom: 10 }]}>
                    {SKILL_NAMES.map((skill) => (
                      <TouchableOpacity
                        key={`dec_${skill}`}
                        style={[
                          styles.dropdownItem,
                          formDecreaseSkill === skill && styles.dropdownItemSelected,
                        ]}
                        onPress={() => {
                          setFormDecreaseSkill(skill);
                          setShowDecreaseSkillDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            formDecreaseSkill === skill &&
                              styles.dropdownItemTextSelected,
                          ]}
                        >
                          {skill}
                        </Text>
                        {formDecreaseSkill === skill && (
                          <Check size={14} color="#FFFFFF" strokeWidth={2.8} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Fixed Footer Actions */}
              <View style={styles.fixedFooterActions}>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => setCurrentScreen('step1')}
                >
                  <ArrowLeft size={15} color="#475569" strokeWidth={2.5} />
                  <Text style={styles.btnText}>Anterior</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.btnSuccess]}
                  onPress={handleSaveTask}
                >
                  <Check size={15} color="#FFFFFF" strokeWidth={2.8} />
                  <Text style={styles.btnPrimaryText}>Finalizar e Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ==================== TELA 4: LOJA DE RECOMPENSAS ==================== */}
          {currentScreen === 'shop' && (
            <View style={styles.screenContainer}>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={[styles.pageHeader, { justifyContent: 'space-between' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ShoppingBag size={18} color="#D97706" strokeWidth={2.5} />
                    <Text style={styles.pageHeaderTitle}>Loja de Recompensas</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.headerActionTag, showShopSearch && styles.headerActionTagActive]}
                      onPress={() => setShowShopSearch(!showShopSearch)}
                    >
                      <Search
                        size={14}
                        color={showShopSearch ? '#FFFFFF' : '#4F46E5'}
                        strokeWidth={2.2}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.headerActionTag}
                      onPress={() => setShopSortAsc(!shopSortAsc)}
                    >
                      <ArrowUpDown size={14} color="#4F46E5" strokeWidth={2.2} />
                      <Text style={styles.headerActionTagText}>
                        {shopSortAsc ? 'Menor' : 'Maior'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {showShopSearch && (
                  <View style={styles.searchBoxWrapper}>
                    <Search size={15} color="#6366F1" strokeWidth={2.2} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Buscar recompensa..."
                      placeholderTextColor="#94A3B8"
                      value={shopSearch}
                      onChangeText={setShopSearch}
                    />
                    {shopSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setShopSearch('')}>
                        <X size={16} color="#64748B" strokeWidth={2.2} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Shop Tabs */}
                <View style={styles.shopTabs}>
                  <TouchableOpacity
                    style={[
                      styles.shopTab,
                      shopTab === 'available' && styles.shopTabActive,
                    ]}
                    onPress={() => setShopTab('available')}
                  >
                    <Gift
                      size={14}
                      color={shopTab === 'available' ? '#FFFFFF' : '#4F46E5'}
                      strokeWidth={2.2}
                    />
                    <Text
                      style={[
                        styles.shopTabText,
                        shopTab === 'available' && styles.shopTabTextActive,
                      ]}
                    >
                      Disponíveis ({rewards.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.shopTab,
                      shopTab === 'redeemed' && styles.shopTabActive,
                    ]}
                    onPress={() => setShopTab('redeemed')}
                  >
                    <CheckCircle2
                      size={14}
                      color={shopTab === 'redeemed' ? '#FFFFFF' : '#4F46E5'}
                      strokeWidth={2.2}
                    />
                    <Text
                      style={[
                        styles.shopTabText,
                        shopTab === 'redeemed' && styles.shopTabTextActive,
                      ]}
                    >
                      Resgatadas ({redeemedRewards.length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Saldo Total */}
                <View style={styles.shopBalanceBox}>
                  <Coins size={18} color="#D97706" strokeWidth={2.4} />
                  <Text style={styles.shopBalanceText}>
                    Saldo Total: {hero.gold} de ouro
                  </Text>
                </View>

                {shopTab === 'available' ? (
                  <>
                    {filteredRewards.map((item) => {
                      const canAfford = hero.gold >= item.price;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.shopItem}
                          onPress={() => setSelectedRewardToRedeem(item)}
                        >
                          <View style={styles.shopItemLeft}>
                            <View style={styles.shopItemIconCircle}>
                              <Gift size={16} color="#7C3AED" strokeWidth={2.2} />
                            </View>
                            <Text style={styles.shopItemTitle}>{item.title}</Text>
                          </View>
                          <View
                            style={[
                              styles.shopPriceBox,
                              canAfford && styles.shopPriceBoxAffordable,
                            ]}
                          >
                            <Coins
                              size={12}
                              color={canAfford ? '#FFFFFF' : '#D97706'}
                              strokeWidth={2.2}
                            />
                            <Text
                              style={[
                                styles.shopPriceText,
                                canAfford && styles.shopPriceTextAffordable,
                              ]}
                            >
                              {item.price}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                ) : redeemedRewards.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Gift size={24} color="#7C3AED" strokeWidth={2} style={{ marginBottom: 8 }} />
                    <Text style={styles.emptyBoxTitle}>
                      Nenhuma recompensa resgatada ainda
                    </Text>
                    <Text style={styles.emptyBoxSub}>
                      Complete tarefas para ganhar ouro e resgate itens na aba Disponíveis.
                    </Text>
                  </View>
                ) : (
                  redeemedRewards.map((entry) => (
                    <View key={entry.id} style={styles.shopItem}>
                      <View style={styles.shopItemLeft}>
                        <View style={[styles.shopItemIconCircle, { backgroundColor: '#DCFCE7', borderColor: '#16A34A' }]}>
                          <Check size={16} color="#15803D" strokeWidth={2.5} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.shopItemTitle}>{entry.title}</Text>
                          <Text style={styles.taskDate}>
                            Resgatado em: {entry.redeemedAt}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.shopPriceBox}>
                        <Text style={styles.shopPriceText}>-{entry.price} ouro</Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* FAB to create new reward */}
              <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.85}
                onPress={() => setShowNewRewardModal(true)}
              >
                <Plus size={26} color="#FFFFFF" strokeWidth={2.8} />
              </TouchableOpacity>
            </View>
          )}

          {/* ==================== TELA 5: MENU / PERFIL RPG ==================== */}
          {currentScreen === 'menu' && (
            <View style={styles.screenContainer}>
              <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.pageHeader}>
                  <Award size={19} color="#4F46E5" strokeWidth={2.5} />
                  <Text style={styles.pageHeaderTitle}>Perfil do Herói &amp; Menu</Text>
                </View>

                <View style={styles.rpgRewardBox}>
                  <View style={styles.formLabelRow}>
                    <User size={13} color="#4F46E5" strokeWidth={2.3} />
                    <Text style={styles.formLabel}>NOME DO HERÓI</Text>
                  </View>
                  <TextInput
                    style={[styles.formInput, { marginBottom: 10 }]}
                    value={hero.name}
                    onChangeText={(val) =>
                      setHero((prev) => ({ ...prev, name: val }))
                    }
                  />
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Shield size={14} color="#4F46E5" strokeWidth={2.2} />
                      <Text style={[styles.rpgRewardLine, { color: '#3730A3' }]}>Nível Atual: {hero.level}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <XpIcon size={13} color="#0284C7" bgColor="#E0F2FE" />
                      <Text style={[styles.rpgRewardLine, { color: '#0369A1' }]}>
                        Experiência Total: {formatNumberBR(hero.xp)} XP ({currentLevelProgressPct}% para o Nível {hero.level + 1})
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Coins size={14} color="#D97706" strokeWidth={2.2} />
                      <Text style={[styles.rpgRewardLine, { color: '#B45309' }]}>Ouro Disponível: {hero.gold}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.rpgRewardBox}>
                  <View style={[styles.formLabelRow, { marginBottom: 8 }]}>
                    <TrendingUp size={15} color="#059669" strokeWidth={2.3} />
                    <Text style={styles.rpgRewardTitle}>HABILIDADES (SKILLS)</Text>
                  </View>
                  {Object.entries(hero.skills || {}).map(([skillName, pts]) => (
                    <View
                      key={skillName}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 7,
                        borderBottomWidth: 1,
                        borderBottomColor: '#E2E8F0',
                      }}
                    >
                      <Text style={styles.rpgRewardLine}>{skillName}</Text>
                      <Text style={[styles.rpgRewardLine, { color: '#4F46E5' }]}>Nível {pts}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.rpgRewardBox}>
                  <View style={[styles.formLabelRow, { marginBottom: 8 }]}>
                    <BarChart2 size={15} color="#0284C7" strokeWidth={2.3} />
                    <Text style={styles.rpgRewardTitle}>ESTATÍSTICAS DA JORNADA</Text>
                  </View>
                  <Text style={[styles.rpgRewardLine, { color: '#4F46E5' }]}>
                    Tarefas Pendentes: {tasks.filter((t) => t.status === 'pending').length}
                  </Text>
                  <Text style={[styles.rpgRewardLine, { color: '#16A34A' }]}>
                    Tarefas Concluídas: {tasks.filter((t) => t.status === 'completed').length}
                  </Text>
                  <Text style={[styles.rpgRewardLine, { color: '#DC2626' }]}>
                    Tarefas Falhadas: {tasks.filter((t) => t.status === 'failed').length}
                  </Text>
                  <Text style={[styles.rpgRewardLine, { color: '#D97706' }]}>
                    Recompensas Resgatadas: {redeemedRewards.length}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.btn, { marginTop: 12, borderColor: '#EF4444', backgroundColor: '#FEF2F2' }]}
                  onPress={handleResetDemoData}
                >
                  <RotateCcw size={15} color="#DC2626" strokeWidth={2.2} />
                  <Text style={[styles.btnText, { color: '#DC2626' }]}>
                    Restaurar Dados Originais do Protótipo
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* ==================== BARRA INFERIOR GLOBAL ==================== */}
          {currentScreen !== 'step1' && currentScreen !== 'step2' && (
            <View style={styles.bottomNav}>
              <TouchableOpacity
                style={[
                  styles.navItem,
                  currentScreen === 'home' && styles.navItemActive,
                ]}
                onPress={() => setCurrentScreen('home')}
              >
                <Home
                  size={18}
                  color={currentScreen === 'home' ? '#FFFFFF' : '#4F46E5'}
                  strokeWidth={2.3}
                />
                <Text
                  style={[
                    styles.navItemText,
                    currentScreen === 'home' && styles.navItemTextActive,
                  ]}
                >
                  Jornada
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navItem, currentScreen === 'shop' && styles.navItemActive]}
                onPress={() => setCurrentScreen('shop')}
              >
                <ShoppingBag
                  size={18}
                  color={currentScreen === 'shop' ? '#FFFFFF' : '#4F46E5'}
                  strokeWidth={2.3}
                />
                <Text
                  style={[
                    styles.navItemText,
                    currentScreen === 'shop' && styles.navItemTextActive,
                  ]}
                >
                  Loja
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navItem, currentScreen === 'menu' && styles.navItemActive]}
                onPress={() => setCurrentScreen('menu')}
              >
                <MenuIcon
                  size={18}
                  color={currentScreen === 'menu' ? '#FFFFFF' : '#4F46E5'}
                  strokeWidth={2.3}
                />
                <Text
                  style={[
                    styles.navItemText,
                    currentScreen === 'menu' && styles.navItemTextActive,
                  ]}
                >
                  Menu
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ==================== MODAL: CONCLUIR / FALHAR / EXCLUIR TAREFA ==================== */}
        <Modal
          visible={Boolean(confirmTaskModal)}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmTaskModal(null)}
        >
          <View style={styles.modalOverlay}>
            {confirmTaskModal && (
              <View style={styles.modalBox}>
                {confirmTaskModal.action === 'complete' && (
                  <>
                    <Text style={[styles.modalTitle, { color: '#15803D' }]}>
                      Concluir tarefa com sucesso?
                    </Text>
                    <Text style={styles.modalTaskName}>
                      {confirmTaskModal.task.title}
                    </Text>
                    <View style={styles.modalRewardRow}>
                      <Coins size={15} color="#D97706" strokeWidth={2.2} />
                      <Text style={[styles.modalRewardText, { color: '#B45309' }]}>
                        + {confirmTaskModal.task.goldReward} Ouro
                      </Text>
                    </View>
                    <View style={styles.modalRewardRow}>
                      <XpIcon size={14} color="#0284C7" bgColor="#E0F2FE" />
                      <Text style={[styles.modalRewardText, { color: '#0369A1' }]}>
                        + {formatNumberBR(confirmTaskModal.task.xpReward)} EXP
                      </Text>
                    </View>
                    {confirmTaskModal.task.increaseSkill &&
                      confirmTaskModal.task.increaseSkill !== 'Nenhuma' && (
                        <Text style={[styles.modalSkillText, { color: '#059669' }]}>
                          +1 em {confirmTaskModal.task.increaseSkill}
                        </Text>
                      )}
                    <View style={styles.modalButtonsRow}>
                      <TouchableOpacity
                        style={styles.btn}
                        onPress={() => setConfirmTaskModal(null)}
                      >
                        <Text style={styles.btnText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btn, styles.btnSuccess]}
                        onPress={() => executeCompleteTask(confirmTaskModal.task)}
                      >
                        <Check size={15} color="#FFFFFF" strokeWidth={2.8} />
                        <Text style={styles.btnPrimaryText}>Completar</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {confirmTaskModal.action === 'fail' && (
                  <>
                    <Text style={[styles.modalTitle, { color: '#B91C1C' }]}>Marcar tarefa como falha?</Text>
                    <Text style={styles.modalTaskName}>
                      {confirmTaskModal.task.title}
                    </Text>
                    <Text style={[styles.modalRewardText, { color: '#DC2626' }]}>
                      Penalidade: -{confirmTaskModal.task.goldReward} Ouro | -
                      {formatNumberBR(confirmTaskModal.task.xpReward)} EXP
                    </Text>
                    <View style={styles.modalButtonsRow}>
                      <TouchableOpacity
                        style={styles.btn}
                        onPress={() => setConfirmTaskModal(null)}
                      >
                        <Text style={styles.btnText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btn, styles.btnDanger]}
                        onPress={() => executeFailTask(confirmTaskModal.task)}
                      >
                        <Text style={styles.btnPrimaryText}>Confirmar Falha</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {confirmTaskModal.action === 'delete' && (
                  <>
                    <Text style={[styles.modalTitle, { color: '#B91C1C' }]}>Excluir tarefa?</Text>
                    <Text style={styles.modalTaskName}>
                      {confirmTaskModal.task.title}
                    </Text>
                    <View style={styles.modalButtonsRow}>
                      <TouchableOpacity
                        style={styles.btn}
                        onPress={() => setConfirmTaskModal(null)}
                      >
                        <Text style={styles.btnText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btn, styles.btnDanger]}
                        onPress={() => executeDeleteTask(confirmTaskModal.task)}
                      >
                        <Trash2 size={14} color="#FFFFFF" strokeWidth={2.5} />
                        <Text style={styles.btnPrimaryText}>Excluir</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        </Modal>

        {/* ==================== MODAL: FILTROS ==================== */}
        <Modal
          visible={showFilterModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Filtrar Tarefas por Status</Text>
              {[
                { id: 'pending', label: 'Pendentes' },
                { id: 'completed', label: 'Concluídas' },
                { id: 'failed', label: 'Falhadas' },
                { id: 'all', label: 'Todas as Tarefas' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.modalOptionBtn,
                    statusFilter === opt.id && styles.modalOptionBtnSelected,
                  ]}
                  onPress={() => {
                    setStatusFilter(opt.id);
                    setShowFilterModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      statusFilter === opt.id && styles.modalOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {statusFilter === opt.id && (
                    <Check size={15} color="#FFFFFF" strokeWidth={2.8} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.btn, { marginTop: 8 }]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.btnText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ==================== MODAL: ORDENAÇÃO ==================== */}
        <Modal
          visible={showSortModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSortModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Ordenar Tarefas por</Text>
              {[
                { id: 'recent', label: 'Mais Recentes' },
                { id: 'reward', label: 'Maior Recompensa (Ouro)' },
                { id: 'difficulty', label: 'Maior Dificuldade' },
                { id: 'title', label: 'Ordem Alfabética (A-Z)' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.modalOptionBtn,
                    sortBy === opt.id && styles.modalOptionBtnSelected,
                  ]}
                  onPress={() => {
                    setSortBy(opt.id);
                    setShowSortModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      sortBy === opt.id && styles.modalOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {sortBy === opt.id && (
                    <Check size={15} color="#FFFFFF" strokeWidth={2.8} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.btn, { marginTop: 8 }]}
                onPress={() => setShowSortModal(false)}
              >
                <Text style={styles.btnText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ==================== MODAL: RESGATAR RECOMPENSA ==================== */}
        <Modal
          visible={Boolean(selectedRewardToRedeem)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedRewardToRedeem(null)}
        >
          <View style={styles.modalOverlay}>
            {selectedRewardToRedeem && (
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Resgatar Recompensa?</Text>
                <Text style={styles.modalTaskName}>
                  {selectedRewardToRedeem.title}
                </Text>
                <View style={styles.modalRewardRow}>
                  <Coins size={15} color="#D97706" strokeWidth={2.2} />
                  <Text style={[styles.modalRewardText, { color: '#B45309' }]}>
                    Saldo: {hero.gold} -&gt; {hero.gold - selectedRewardToRedeem.price} de ouro
                  </Text>
                </View>
                {hero.gold < selectedRewardToRedeem.price && (
                  <Text style={[styles.instructionText, { fontWeight: '700', marginTop: 4, color: '#DC2626' }]}>
                    Saldo insuficiente para este resgate.
                  </Text>
                )}
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() => setSelectedRewardToRedeem(null)}
                  >
                    <Text style={styles.btnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnSuccess]}
                    onPress={() => handleRedeemReward(selectedRewardToRedeem)}
                  >
                    <Check size={15} color="#FFFFFF" strokeWidth={2.8} />
                    <Text style={styles.btnPrimaryText}>Resgatar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Modal>

        {/* ==================== MODAL: NOVA RECOMPENSA NA LOJA ==================== */}
        <Modal
          visible={showNewRewardModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNewRewardModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Nova Recompensa na Loja</Text>

              <View style={styles.formGroup}>
                <View style={styles.formLabelRow}>
                  <Gift size={13} color="#7C3AED" strokeWidth={2.3} />
                  <Text style={styles.formLabel}>TÍTULO DA RECOMPENSA</Text>
                </View>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ex: Assistir 1 filme"
                  placeholderTextColor="#94A3B8"
                  value={newRewardTitle}
                  onChangeText={setNewRewardTitle}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.formLabelRow}>
                  <Coins size={13} color="#D97706" strokeWidth={2.3} />
                  <Text style={styles.formLabel}>CUSTO EM OURO</Text>
                </View>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ex: 25"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={newRewardPrice}
                  onChangeText={setNewRewardPrice}
                />
              </View>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => setShowNewRewardModal(false)}
                >
                  <Text style={styles.btnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={handleCreateReward}
                >
                  <Check size={15} color="#FFFFFF" strokeWidth={2.8} />
                  <Text style={styles.btnPrimaryText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  appFrame: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  feedbackToast: {
    backgroundColor: '#1E1B4B',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  feedbackToastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 92,
  },
  scrollContentWithFooter: {
    padding: 16,
    paddingBottom: 98,
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    marginBottom: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  heroAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontWeight: '800',
    fontSize: 16,
    color: '#1E1B4B',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroStatText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  heroStatDivider: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
  },
  heroProgressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  heroProgressText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },

  /* Search & Filter */
  searchBoxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  filterActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  pillBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  pillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  pillBtnTextActive: {
    color: '#FFFFFF',
  },

  /* Task List */
  taskItemWrapper: {
    marginBottom: 10,
    position: 'relative',
  },
  taskItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  taskItemCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  taskItemFailed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderStyle: 'dashed',
  },
  taskInfoCol: {
    flex: 1,
    paddingRight: 10,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#15803D',
  },
  taskDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  taskDate: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  taskRewardsBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  miniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  miniTagGold: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  miniTagXp: {
    backgroundColor: '#E0F2FE',
    borderColor: '#38BDF8',
  },
  miniTagSuccess: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
  },
  miniTagDanger: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  miniTagInverted: {
    backgroundColor: '#4F46E5',
  },
  miniTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  miniTagTextInverted: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  taskActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  checkBoxFailed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  menuDotsBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  menuDotsBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  contextMenu: {
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  contextMenuItem: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextMenuItemLast: {
    borderRightWidth: 0,
  },
  contextMenuText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* FAB */
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  /* Forms & Headers */
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#CBD5E1',
  },
  pageHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  backLink: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3730A3',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  formInput: {
    width: '100%',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  inputWithIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  inputWithIconField: {
    flex: 1,
    paddingVertical: 11,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
    lineHeight: 15,
  },
  dropdownTrigger: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dropdownList: {
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  dropdownItemSelected: {
    backgroundColor: '#4F46E5',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  dropdownItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  toggleRowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  remindersList: {
    marginTop: 6,
    gap: 6,
  },
  reminderChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#FFFBEB',
  },
  reminderChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  reminderInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },

  /* Sliders (Step 2) */
  sliderContainer: {
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sliderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sliderHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  customSliderBarWrapper: {
    position: 'relative',
    justifyContent: 'center',
    height: 28,
  },
  staticSliderTrack: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  staticSliderFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
  },
  nativeSlider: {
    width: '100%',
    height: 28,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  rpgRewardBox: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    marginVertical: 8,
  },
  rpgRewardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rpgRewardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  rpgRewardLine: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  customRewardInputsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  penaltyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#FEF2F2',
  },
  penaltyText: {
    flex: 1,
    fontSize: 11,
    color: '#991B1B',
    fontWeight: '600',
    lineHeight: 15,
  },

  /* Footer & Buttons */
  fixedFooterActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#CBD5E1',
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: '#4F46E5',
    borderColor: '#4338CA',
  },
  btnSuccess: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
  },
  btnDanger: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  btnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Shop */
  headerActionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  headerActionTagActive: {
    backgroundColor: '#4F46E5',
  },
  headerActionTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  shopTabs: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    marginBottom: 12,
    backgroundColor: '#EEF2FF',
    padding: 3,
    overflow: 'hidden',
  },
  shopTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  shopTabActive: {
    backgroundColor: '#4F46E5',
  },
  shopTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  shopTabTextActive: {
    color: '#FFFFFF',
  },
  shopBalanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
    marginBottom: 12,
  },
  shopBalanceText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  shopItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shopItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 8,
  },
  shopItemIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#C084FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  shopPriceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  shopPriceBoxAffordable: {
    backgroundColor: '#D97706',
    borderColor: '#B45309',
  },
  shopPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  shopPriceTextAffordable: {
    color: '#FFFFFF',
  },

  /* Bottom Navigation */
  bottomNav: {
    height: 66,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#CBD5E1',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
  },
  navItemActive: {
    backgroundColor: '#4F46E5',
  },
  navItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  navItemTextActive: {
    color: '#FFFFFF',
  },

  /* Empty State */
  emptyBox: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    backgroundColor: '#FFFFFF',
    padding: 22,
    alignItems: 'center',
    marginVertical: 8,
  },
  emptyBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 4,
  },
  emptyBoxSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#6366F1',
    padding: 20,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B4B',
    marginBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  modalTaskName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  modalRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  modalRewardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSkillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalOptionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  modalOptionBtnSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4338CA',
  },
  modalOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalOptionTextSelected: {
    color: '#FFFFFF',
  },
});
