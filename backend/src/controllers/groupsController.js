import { supabaseAdmin } from '../config/supabaseClient.js';

function generateJoinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/**
 * POST /api/groups
 * body: { name }
 * Создава нова група (на пр. клас) и автоматски го додава креаторот.
 * Во реален сценарио ова обично го прави наставникот.
 */
export async function createGroup(req, res) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name е задолжителен.' });

    const join_code = generateJoinCode();

    const { data: group, error } = await supabaseAdmin
      .from('groups')
      .insert({ name, join_code })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from('group_members').insert({ group_id: group.id, user_id: req.user.id });

    res.status(201).json({ group });
  } catch (err) {
    console.error('[createGroup] error:', err);
    res.status(500).json({ error: 'Не успеа создавањето на групата.' });
  }
}

/**
 * POST /api/groups/join
 * body: { joinCode }
 */
export async function joinGroup(req, res) {
  try {
    const { joinCode } = req.body;
    if (!joinCode) return res.status(400).json({ error: 'joinCode е задолжителен.' });

    const { data: group, error } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('join_code', joinCode.toUpperCase())
      .single();

    if (error || !group) {
      return res.status(404).json({ error: 'Не е пронајдена група со тој код.' });
    }

    const { error: joinError } = await supabaseAdmin
      .from('group_members')
      .upsert({ group_id: group.id, user_id: req.user.id }, { onConflict: 'group_id,user_id' });

    if (joinError) throw joinError;

    res.json({ group });
  } catch (err) {
    console.error('[joinGroup] error:', err);
    res.status(500).json({ error: 'Не успеа приклучувањето кон групата.' });
  }
}

/**
 * GET /api/groups/me
 * Групата(ите) на најавениот корисник, со прогрес на тековните групни предизвици.
 */
export async function getMyGroups(req, res) {
  try {
    const userId = req.user.id;

    const { data: memberships, error } = await supabaseAdmin
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', userId);

    if (error) throw error;

    const groups = await Promise.all(
      (memberships || []).map(async (m) => {
        const { count: memberCount } = await supabaseAdmin
          .from('group_members')
          .select('user_id', { count: 'exact', head: true })
          .eq('group_id', m.group_id);

        const { count: completedCount } = await supabaseAdmin
          .from('user_challenges')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', m.group_id)
          .eq('status', 'completed');

        return { ...m.groups, memberCount, completedCount };
      })
    );

    res.json({ groups });
  } catch (err) {
    console.error('[getMyGroups] error:', err);
    res.status(500).json({ error: 'Не успеа вчитувањето на групите.' });
  }
}

/**
 * DELETE /api/groups/:id
 * Само членот кој ја создал групата (first member) или секој член може да ја напушти.
 * За едноставност: секој член може да ја избрише групата ако е единствен член,
 * а ако има повеќе членови — само се отстранува себеси (напушта групата).
 * Ако по напуштањето групата останe празна, се брише автоматски.
 */
export async function deleteOrLeaveGroup(req, res) {
  try {
    const userId = req.user.id;
    const groupId = req.params.id;

    // Провери дали корисникот е воопшто член
    const { data: membership } = await supabaseAdmin
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();

    if (!membership) {
      return res.status(403).json({ error: 'Не си член на оваа група.' });
    }

    await supabaseAdmin
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

    const { count } = await supabaseAdmin
        .from('group_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('group_id', groupId);

    if (count === 0) {
      await supabaseAdmin.from('groups').delete().eq('id', groupId);
      return res.json({ deleted: true, message: 'Групата е избришана.' });
    }

    res.json({ deleted: false, message: 'Ја напуштивте групата.' });
  } catch (err) {
    console.error('[deleteOrLeaveGroup] error:', err);
    res.status(500).json({ error: 'Не успеа бришењето на групата.' });
  }
}

/**
 * GET /api/groups/:id/leaderboard
 * Анонимен лидерборд — само XP и ниво, без имиња.
 */
export async function getGroupLeaderboard(req, res) {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;

    const { data: membership } = await supabaseAdmin
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();

    if (!membership) {
      return res.status(403).json({ error: 'Не си член на оваа група.' });
    }

    const { data: members, error } = await supabaseAdmin
        .from('group_members')
        .select('profiles(xp_points, level)')
        .eq('group_id', groupId);

    if (error) throw error;

    const entries = (members || [])
        .map((m) => ({ xp: m.profiles?.xp_points || 0, level: m.profiles?.level || 1 }))
        .sort((a, b) => b.xp - a.xp);

    res.json({ entries });
  } catch (err) {
    console.error('[getGroupLeaderboard] error:', err);
    res.status(500).json({ error: 'Не успеа вчитувањето на лидерборд.' });
  }
}