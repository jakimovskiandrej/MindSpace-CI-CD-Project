import { supabaseAdmin } from '../config/supabaseClient.js';
import { checkAndAwardBadges } from '../services/badgeService.js';

const XP_PER_LEVEL = 100;

/**
 * GET /api/challenges
 * Целата листа на можни предизвици (за прелистување/историја).
 */
export async function listChallenges(req, res) {
  const { data, error } = await supabaseAdmin.from('challenges').select('*').order('id');
  if (error) return res.status(500).json({ error: 'Не успеа вчитувањето на предизвиците.' });
  res.json({ challenges: data });
}

/**
 * GET /api/challenges/me
 * Активните и завршените предизвици на најавениот корисник.
 */
export async function listMyChallenges(req, res) {
  const userId = req.user.id;
  const { data, error } = await supabaseAdmin
    .from('user_challenges')
    .select('*, challenges(*)')
    .eq('user_id', userId)
    .order('assigned_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Не успеа вчитувањето на твоите предизвици.' });
  res.json({ userChallenges: data });
}

/**
 * POST /api/challenges/generate
 *
 * Алгоритам:
 *  1. Ги зема последните 3 дневни записи на корисникот.
 *  2. Пресметува просечен screen_time, просечно расположение и просечен сон.
 *  3. Избира категорија на предизвик според најслабата точка:
 *     - висок screen-time -> 'digital_detox'
 *     - ниско расположение / висок стрес -> 'mindfulness'
 *     - малку сон -> 'sleep'
 *     - инаку -> рандом категорија ('study_balance' / 'social') за разновидност.
 *  5. Доделува предизвик од таа категорија кој корисникот сè уште нема активен/завршен.
 */
export async function generateChallenge(req, res) {
  try {
    const userId = req.user.id;

    const { data: recentLogs, error: logsError } = await supabaseAdmin
      .from('daily_logs')
      .select('mood_score, screen_time_hours, sleep_hours, stress_flag')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (logsError) throw logsError;

    const { data: membership } = await supabaseAdmin
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    const groupId = membership?.group_id ?? null;

    const category = pickCategory(recentLogs || []);

    const { data: alreadyAssigned } = await supabaseAdmin
      .from('user_challenges')
      .select('challenge_id')
      .eq('user_id', userId);

    const excludedIds = (alreadyAssigned || []).map((c) => c.challenge_id);

    let query = supabaseAdmin.from('challenges').select('*').eq('category', category);
    if (excludedIds.length > 0) {
      query = query.not('id', 'in', `(${excludedIds.join(',')})`);
    }

    const { data: candidates, error: candidatesError } = await query;
    if (candidatesError) throw candidatesError;

    let chosen = candidates && candidates.length > 0 ? randomItem(candidates) : null;

    if (!chosen) {
      let fallbackQuery = supabaseAdmin.from('challenges').select('*');
      if (excludedIds.length > 0) {
        fallbackQuery = fallbackQuery.not('id', 'in', `(${excludedIds.join(',')})`);
      }
      const { data: fallbackCandidates } = await fallbackQuery;
      chosen = fallbackCandidates && fallbackCandidates.length > 0 ? randomItem(fallbackCandidates) : null;
    }

    if (!chosen) {
      return res.status(200).json({ message: 'Веќе ги имаш сите достапни предизвици!', userChallenge: null });
    }

    const { data: userChallenge, error: insertError } = await supabaseAdmin
      .from('user_challenges')
      .insert({ user_id: userId, challenge_id: chosen.id, status: 'active', group_id: groupId })
      .select('*, challenges(*)')
      .single();

    if (insertError) throw insertError;

    res.status(201).json({ userChallenge, reason: categoryReason(category) });
  } catch (err) {
    console.error('[generateChallenge] error:', err);
    res.status(500).json({ error: 'Не успеа генерирањето на предизвик.' });
  }
}

function pickCategory(logs) {
  if (!logs || logs.length === 0) return randomItem(['mindfulness', 'digital_detox']);

  const avg = (key) => logs.reduce((sum, l) => sum + (Number(l[key]) || 0), 0) / logs.length;

  const avgScreenTime = avg('screen_time_hours');
  const avgMood = avg('mood_score');
  const sleepLogs = logs.filter((l) => l.sleep_hours != null);
  const avgSleep = sleepLogs.length ? avg('sleep_hours') : null;
  const stressyDays = logs.filter((l) => l.stress_flag).length;

  if (avgScreenTime >= 4) return 'digital_detox';
  if (avgMood <= 2.5 || stressyDays >= 2) return 'mindfulness';
  if (avgSleep != null && avgSleep < 6) return 'sleep';

  return randomItem(['study_balance', 'social', 'mindfulness']);
}

function categoryReason(category) {
  const reasons = {
    digital_detox: 'Забележавме повисоко време пред екран во последните денови — еве предизвик за дигитален детокс.',
    mindfulness: 'Забележавме знаци на стрес/пониско расположение — еве предизвик за смирување.',
    sleep: 'Забележавме малку сон во последните денови — еве предизвик за подобра рутина пред спиење.',
    study_balance: 'Еве предизвик за подобра рамнотежа меѓу учењето и паузите.',
    social: 'Еве социјален предизвик за поврзување со другите.',
  };
  return reasons[category] || 'Еве нов предизвик за тебе!';
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * POST /api/challenges/complete
 * body: { userChallengeId }
 *
 * Ја менува состојбата во 'completed', додава XP поени во profiles,
 * прерачунува level и проверува дали се отклучени нови беџови.
 */
export async function completeChallenge(req, res) {
  try {
    const userId = req.user.id;
    const { userChallengeId } = req.body;

    if (!userChallengeId) {
      return res.status(400).json({ error: 'userChallengeId е задолжителен.' });
    }

    const { data: userChallenge, error: fetchError } = await supabaseAdmin
      .from('user_challenges')
      .select('*, challenges(*)')
      .eq('id', userChallengeId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !userChallenge) {
      return res.status(404).json({ error: 'Предизвикот не е пронајден.' });
    }

    if (userChallenge.status === 'completed') {
      return res.status(409).json({ error: 'Предизвикот е веќе завршен.' });
    }

    const { error: updateError } = await supabaseAdmin
      .from('user_challenges')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', userChallengeId);

    if (updateError) throw updateError;

    const xpReward = userChallenge.challenges?.xp_reward ?? 10;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('xp_points, level')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const newXp = (profile.xp_points || 0) + xpReward;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
    const leveledUp = newLevel > (profile.level || 1);

    const { error: xpUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ xp_points: newXp, level: newLevel })
      .eq('id', userId);

    if (xpUpdateError) throw xpUpdateError;

    const newBadges = await checkAndAwardBadges(userId);

    res.json({
      message: 'Предизвикот е завршен! 🎉',
      xpAwarded: xpReward,
      totalXp: newXp,
      level: newLevel,
      leveledUp,
      newBadges,
    });
  } catch (err) {
    console.error('[completeChallenge] error:', err);
    res.status(500).json({ error: 'Не успеа означувањето на предизвикот како завршен.' });
  }
}
