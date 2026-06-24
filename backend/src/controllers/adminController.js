import { supabaseAdmin } from '../config/supabaseClient.js';

/**
 * GET /api/admin/stats?classCode=VII-a
 *
 * Користи ја "class_weekly_stats" view-от (дефиниран во supabase/schema.sql) кој
 * веќе ги агрегира податоците на ниво на клас/недела — НИКОГАШ не се читаат
 * поединечни daily_logs записи овде, со цел заштита на приватноста на учениците.
 */
export async function getClassStats(req, res) {
  try {
    const { classCode } = req.query;

    let query = supabaseAdmin
      .from('class_weekly_stats')
      .select('*')
      .order('week_start', { ascending: true });

    if (classCode) {
      query = query.eq('class_code', classCode);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ stats: data });
  } catch (err) {
    console.error('[getClassStats] error:', err);
    res.status(500).json({ error: 'Не успеа вчитувањето на статистиката.' });
  }
}

/**
 * GET /api/admin/classes
 * Листа на сите класови (class_code вредности) за филтер dropdown во Admin Dashboard.
 */
export async function listClasses(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('class_code')
      .not('class_code', 'is', null);

    if (error) throw error;

    const uniqueClasses = [...new Set((data || []).map((p) => p.class_code))].sort();
    res.json({ classes: uniqueClasses });
  } catch (err) {
    console.error('[listClasses] error:', err);
    res.status(500).json({ error: 'Не успеа вчитувањето на класовите.' });
  }
}

/**
 * GET /api/admin/overview
 * Општ преглед: вкупен број ученици, просечно расположение/недела, % со висок стрес.
 */
export async function getOverview(req, res) {
  try {
    const { data, error } = await supabaseAdmin.from('class_weekly_stats').select('*');
    if (error) throw error;

    const rows = data || [];
    const totalStudents = new Set();
    let moodSum = 0;
    let stressSum = 0;

    rows.forEach((r) => {
      moodSum += Number(r.avg_mood || 0);
      stressSum += Number(r.pct_high_stress || 0);
    });

    res.json({
      classesTracked: new Set(rows.map((r) => r.class_code)).size,
      avgMoodAcrossSchool: rows.length ? (moodSum / rows.length).toFixed(2) : null,
      avgHighStressPct: rows.length ? (stressSum / rows.length).toFixed(1) : null,
      weeksOfData: new Set(rows.map((r) => r.week_start)).size,
    });
  } catch (err) {
    console.error('[getOverview] error:', err);
    res.status(500).json({ error: 'Не успеа вчитувањето на прегледот.' });
  }
}
