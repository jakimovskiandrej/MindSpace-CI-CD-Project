import { supabaseAdmin } from '../config/supabaseClient.js';

/**
 * GET /api/badges
 * Целата мастер-листа на беџови (за прикажување locked/unlocked состојба).
 */
export async function listAllBadges(req, res) {
  const { data, error } = await supabaseAdmin.from('badges').select('*').order('id');
  if (error) return res.status(500).json({ error: 'Не успеа вчитувањето на беџовите.' });
  res.json({ badges: data });
}

/**
 * GET /api/badges/me
 * Беџовите што ги има освоено најавениот корисник.
 */
export async function listMyBadges(req, res) {
  const userId = req.user.id;
  const { data, error } = await supabaseAdmin
    .from('user_badges')
    .select('earned_at, badges(*)')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Не успеа вчитувањето на твоите беџови.' });
  res.json({ userBadges: data });
}
