import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { supabase } from '../config/supabase';
import { authService } from '../services/authService';

const { width } = Dimensions.get('window');

const BLUE = '#2563EB'; const YELLOW = '#FACC15'; const RED = '#EF4444';
const GREEN = '#22C55E'; const PURPLE = '#8B5CF6'; const WHITE = '#FFFFFF';
const BG = '#F3F4F6'; const TEXT = '#111827'; const MUTED = '#4B5563';

const DAILY_TIPS = [
  { icon: 'hardware-chip', color: BLUE,   tip: 'The CPU is the brain of the computer. More cores = better multitasking.' },
  { icon: 'battery-charging', color: GREEN, tip: 'A PSU that is too weak can cause random shutdowns and hardware damage.' },
  { icon: 'layers', color: PURPLE,         tip: 'RAM is temporary storage. Closing apps frees up RAM immediately.' },
  { icon: 'save', color: RED,              tip: 'SSDs are up to 10x faster than HDDs because they have no moving parts.' },
  { icon: 'thermometer', color: '#F97316', tip: 'Thermal paste between the CPU and cooler prevents overheating.' },
  { icon: 'grid', color: BLUE,             tip: 'The motherboard connects all components. Compatibility matters when upgrading.' },
  { icon: 'desktop', color: GREEN,         tip: 'GPU handles graphics. A dedicated GPU is essential for gaming and video editing.' },
];

function AnimatedCard({ onPress, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [lastScore, setLastScore] = useState(null);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const tipIndex = new Date().getDate() % DAILY_TIPS.length;
  const tip = DAILY_TIPS[tipIndex];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const u = await authService.getCurrentUser();
      setUser(u);

      // Load assigned quizzes
      const { data: classStudents } = await supabase
        .from('class_students').select('class_id').eq('student_id', u.id);
      const classIds = classStudents?.map(cs => cs.class_id) || [];

      if (classIds.length > 0) {
        const { data: assignments } = await supabase
          .from('quiz_assignments').select('quiz_id').in('class_id', classIds);
        const quizIds = assignments?.map(a => a.quiz_id) || [];

        if (quizIds.length > 0) {
          const { data: quizData } = await supabase
            .from('quizzes').select('*').in('id', quizIds).limit(3);
          setQuizzes(quizData || []);
        }
      }

      // Load last quiz attempt
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('score, created_at, quiz_id')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (attempts?.length > 0) {
        const { data: quizInfo } = await supabase
          .from('quizzes').select('title').eq('id', attempts[0].quiz_id).single();
        setLastScore({ score: attempts[0].score, title: quizInfo?.title || 'Quiz' });
      }
    } catch {}
    finally { setLoadingQuizzes(false); }
  };

  const displayName = user?.user_metadata?.full_name || user?.profile?.full_name || 'Student';
  const firstName = displayName.split(' ')[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greetingText}>{getGreeting()}, {firstName} 👋</Text>
          <Text style={styles.greetingSubText}>What are you learning today?</Text>
        </View>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>⚡ 240 XP</Text>
        </View>
      </View>

      {/* Daily Tip */}
      <View style={styles.tipCard}>
        <View style={[styles.tipIconWrap, { backgroundColor: tip.color }]}>
          <Ionicons name={tip.icon} size={20} color={WHITE} />
        </View>
        <View style={styles.tipContent}>
          <Text style={styles.tipLabel}>💡 Tip of the Day</Text>
          <Text style={styles.tipText}>{tip.tip}</Text>
        </View>
      </View>

      {/* My Quizzes */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Quizzes</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Quiz')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {loadingQuizzes ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={BLUE} />
        </View>
      ) : quizzes.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={32} color={MUTED} />
          <Text style={styles.emptyText}>No quizzes assigned yet</Text>
          <Text style={styles.emptySubText}>Your lecturer will assign quizzes to your class</Text>
        </View>
      ) : (
        quizzes.map(q => (
          <AnimatedCard key={q.id} onPress={() => navigation.navigate('Quiz', { quizId: q.id })}>
            <View style={styles.quizCard}>
              <View style={styles.quizIconWrap}>
                <Ionicons name="document-text" size={22} color={WHITE} />
              </View>
              <View style={styles.quizInfo}>
                <Text style={styles.quizTitle}>{q.title}</Text>
                <Text style={styles.quizMeta}>Passing score: {q.passing_score}%</Text>
              </View>
              <View style={styles.quizArrow}>
                <Ionicons name="chevron-forward" size={18} color={MUTED} />
              </View>
            </View>
          </AnimatedCard>
        ))
      )}

      {/* Last Score */}
      {lastScore && (
        <>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.scoreCard}>
            <View style={[styles.scoreIconWrap, { backgroundColor: lastScore.score >= 80 ? GREEN : lastScore.score >= 60 ? YELLOW : RED }]}>
              <Ionicons name="trophy" size={20} color={WHITE} />
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreTitle}>{lastScore.title}</Text>
              <Text style={styles.scoreSub}>Last attempt</Text>
            </View>
            <Text style={[styles.scoreValue, { color: lastScore.score >= 80 ? GREEN : lastScore.score >= 60 ? YELLOW : RED }]}>
              {lastScore.score}%
            </Text>
          </View>
        </>
      )}

      {/* Game card */}
      <Text style={styles.sectionTitle}>Play & Learn</Text>
      <AnimatedCard onPress={() => navigation.navigate('Game')} style={{ marginBottom: 16 }}>
        <LinearGradient colors={['#7C3AED', '#4F46E5']} style={styles.gameCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.gameCardLeft}>
            <View style={styles.gameBadge}><Text style={styles.gameBadgeText}>🎮 NEW</Text></View>
            <Text style={styles.gameCardTitle}>CompuRunner</Text>
            <Text style={styles.gameCardDesc}>Run, dodge obstacles & collect PC components. Answer questions to survive!</Text>
            <View style={styles.gamePlayBtn}>
              <Text style={styles.gamePlayBtnText}>Play Now →</Text>
            </View>
          </View>
          <Text style={styles.gameCardEmoji}>🏃</Text>
        </LinearGradient>
      </AnimatedCard>

      {/* Quick Access */}
      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.quickRow}>
        {[
          { label: 'PC Lab',      icon: 'hardware-chip',        color: BLUE,   screen: 'PC Lab' },
          { label: 'Materials',   icon: 'book',                 color: PURPLE, screen: 'Materials' },
          { label: 'CompuBot',    icon: 'chatbubble-ellipses',  color: GREEN,  screen: 'Chatbot' },
          { label: 'Troubleshoot',icon: 'bug',                  color: RED,    screen: 'Troubleshoot' },
        ].map((item, i) => (
          <AnimatedCard key={i} onPress={() => navigation.navigate(item.screen)} style={{ flex: 1 }}>
            <View style={styles.quickCard}>
              <View style={[styles.quickIconWrap, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={18} color={WHITE} />
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </View>
          </AnimatedCard>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { paddingTop: 8 },

  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  greetingText: { fontSize: 22, fontWeight: '900', color: TEXT },
  greetingSubText: { fontSize: 13, color: MUTED, marginTop: 2 },
  xpBadge: { backgroundColor: YELLOW, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  xpText: { fontSize: 12, fontWeight: '900', color: TEXT },

  tipCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, marginHorizontal: 16, marginBottom: 20, borderRadius: 16, padding: 14, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  tipIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tipContent: { flex: 1 },
  tipLabel: { fontSize: 11, fontWeight: '800', color: MUTED, marginBottom: 4 },
  tipText: { fontSize: 13, color: TEXT, lineHeight: 19, fontWeight: '500' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: TEXT, marginHorizontal: 16, marginBottom: 10 },
  seeAll: { fontSize: 13, fontWeight: '700', color: BLUE },

  loadingWrap: { alignItems: 'center', paddingVertical: 24 },
  emptyCard: { alignItems: 'center', backgroundColor: WHITE, marginHorizontal: 16, borderRadius: 16, padding: 24, marginBottom: 20, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '700', color: TEXT },
  emptySubText: { fontSize: 12, color: MUTED, textAlign: 'center' },

  quizCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 14, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  quizIconWrap: { width: 46, height: 46, borderRadius: 12, backgroundColor: YELLOW, alignItems: 'center', justifyContent: 'center' },
  quizInfo: { flex: 1 },
  quizTitle: { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 3 },
  quizMeta: { fontSize: 12, color: MUTED },
  quizArrow: {},

  scoreCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, marginHorizontal: 16, marginBottom: 20, borderRadius: 16, padding: 14, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  scoreIconWrap: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scoreInfo: { flex: 1 },
  scoreTitle: { fontSize: 14, fontWeight: '700', color: TEXT },
  scoreSub: { fontSize: 12, color: MUTED, marginTop: 2 },
  scoreValue: { fontSize: 22, fontWeight: '900' },

  gameCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 20, marginHorizontal: 16, justifyContent: 'space-between' },
  gameCardLeft: { flex: 1 },
  gameBadge: { backgroundColor: YELLOW, alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  gameBadgeText: { fontSize: 10, fontWeight: '900', color: TEXT },
  gameCardTitle: { fontSize: 22, fontWeight: '900', color: WHITE, marginBottom: 6 },
  gameCardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18, marginBottom: 14 },
  gamePlayBtn: { backgroundColor: WHITE, alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  gamePlayBtnText: { fontSize: 13, fontWeight: '800', color: '#4F46E5' },
  gameCardEmoji: { fontSize: 56, marginLeft: 12 },

  quickRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  quickCard: { backgroundColor: WHITE, borderRadius: 14, padding: 14, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  quickIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 10, fontWeight: '700', color: TEXT, textAlign: 'center' },
});
