import { supabaseAdmin } from '../config/supabaseClient.js';
import { analyzeDiaryEntry } from '../services/sentimentService.js';
import { checkAndAwardBadges } from '../services/badgeService.js';

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * POST /api/logs
 *
 * UPSERT по (user_id, log_date) — ако ученикот веќе внел запис денес,
 * овој повик го АЖУРИРА постоечкиот запис наместо да фрла грешка за дупликат.
 * Ова бара log_date колона + unique ограничување на (user_id, log_date) во базата
 * (виж supabase/migrations/001_log_date_unique.sql).
 */
export async function upsertDailyLog(req, res) {
  try {
    const userId = req.user.id;
    const {
      mood_score,
      screen_time_hours,
      offline_activities_hours,
      sleep_hours,
      diary_entry,
    } = req.body;

    if (mood_score == null || mood_score < 1 || mood_score > 5) {
      return res.status(400).json({ error: 'mood_score мора да биде помеѓу 1 и 5.' });
    }

    let sentiment = null;
    if (diary_entry && diary_entry.trim().length > 0) {
      sentiment = analyzeDiaryEntry(diary_entry);
    }

    const today = todayDateString();
    const payload = {
      mood_score,
      screen_time_hours: screen_time_hours ?? 0,
      offline_activities_hours: offline_activities_hours ?? 0,
      sleep_hours: sleep_hours ?? null,
      diary_entry: diary_entry ?? null,
      sentiment_label: sentiment?.label ?? null,
      sentiment_score: sentiment?.score ?? null,
      stress_flag: sentiment?.stressDetected ?? false,
    };

    const { data: existing } = await supabaseAdmin
        .from('daily_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('log_date', today)
        .maybeSingle();

    let log, dbError;

    if (existing) {
      ({ data: log, error: dbError } = await supabaseAdmin
          .from('daily_logs')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single());
    } else {
      ({ data: log, error: dbError } = await supabaseAdmin
          .from('daily_logs')
          .insert({ user_id: userId, ...payload })
          .select()
          .single());
    }

    if (dbError) {
      console.error('[upsertDailyLog] db error:', dbError);
      return res.status(500).json({ error: 'Не успеа зачувувањето на записот.' });
    }

    const newBadges = await checkAndAwardBadges(userId);

    res.status(201).json({ log, sentiment, newBadges });
  } catch (err) {
    console.error('[upsertDailyLog] error:', err);
    res.status(500).json({ error: 'Серверска грешка.' });
  }
}

export async function getTodayLog(req, res) {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', todayDateString())
      .maybeSingle();

    if (error) throw error;

    res.json({ log: data || null });
  } catch (err) {
    console.error('[getTodayLog] error:', err);
    res.status(500).json({ error: 'Не успеа проверката на денешниот запис.' });
  }
}

export async function getStreak(req, res) {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('daily_logs')
      .select('log_date')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(60);

    if (error) throw error;

    const dates = new Set((data || []).map((r) => r.log_date));
    let streak = 0;
    const cursor = new Date();

    if (!dates.has(todayDateString())) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    while (true) {
      const cursorStr = cursor.toISOString().slice(0, 10);
      if (!dates.has(cursorStr)) break;
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    res.json({ streak });
  } catch (err) {
    console.error('[getStreak] error:', err);
    res.status(500).json({ error: 'Не успеа пресметката на streak-от.' });
  }
}

/**
 * GET /api/logs/me?limit=14
 * Враќа ги последните N записи на најавениот корисник (за Analytics графиконите).
 */
export async function getMyLogs(req, res) {
  try {
    const userId = req.user.id;
    const limit = Math.min(Number(req.query.limit) || 14, 90);

    const { data, error } = await supabaseAdmin
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    res.json({ logs: data });
  } catch (err) {
    console.error('[getMyLogs] error:', err);
    res.status(500).json({ error: 'Не успеа вчитувањето на записите.' });
  }
}
