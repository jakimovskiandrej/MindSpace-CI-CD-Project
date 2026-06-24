import { supabaseAdmin } from '../config/supabaseClient.js';
import { checkAndAwardBadges } from '../services/badgeService.js';

export async function listWallPosts(req, res) {
  try {
    const isStaff = req.isStaff === true;

    const query = supabaseAdmin
        .from('wall_posts')
        .select(
            isStaff
                ? 'id, message, reaction_count, created_at, pinned, user_id, profiles!wall_posts_user_id_fkey(username)'
                : 'id, message, reaction_count, created_at, pinned'
        )
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

    const { data, error } = await query;
    if (error) throw error;
    const posts = isStaff
        ? (data || [])
        : (data || []).map(({ user_id, ...rest }) => rest);

    res.json({ posts });
  } catch (err) {
    console.error('[listWallPosts] error:', err);
    res.status(500).json({ error: 'Не успеа вчитувањето на ѕидот.' });
  }
}

export async function createWallPost(req, res) {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Пораката е празна.' });
    if (message.length > 280) return res.status(400).json({ error: 'Пораката е предолга (макс. 280 карактери).' });

    const { data: post, error } = await supabaseAdmin
        .from('wall_posts')
        .insert({ user_id: req.user.id, message: message.trim() })
        .select('id, message, reaction_count, created_at, pinned')
        .single();

    if (error) throw error;
    checkAndAwardBadges(req.user.id).catch(console.error);
    res.status(201).json({ post });
  } catch (err) {
    console.error('[createWallPost] error:', err);
    res.status(500).json({ error: 'Не успеа објавувањето на пораката.' });
  }
}

export async function reactToPost(req, res) {
  try {
    const { postId } = req.params;
    const { reaction = 'heart' } = req.body;

    await supabaseAdmin
        .from('wall_reactions')
        .upsert(
            { post_id: postId, user_id: req.user.id, reaction },
            { onConflict: 'post_id,user_id' }
        );

    const { count } = await supabaseAdmin
        .from('wall_reactions')
        .select('post_id', { count: 'exact', head: true })
        .eq('post_id', postId);

    await supabaseAdmin
        .from('wall_posts')
        .update({ reaction_count: count || 0 })
        .eq('id', postId);

    res.json({ reaction_count: count || 0 });
  } catch (err) {
    console.error('[reactToPost] error:', err);
    res.status(500).json({ error: 'Не успеа додавањето на реакција.' });
  }
}

export async function adminEditPost(req, res) {
  try {
    const { postId } = req.params;
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Пораката е празна.' });
    if (message.length > 280) return res.status(400).json({ error: 'Пораката е предолга (макс. 280 карактери).' });

    const { data: post, error } = await supabaseAdmin
        .from('wall_posts')
        .update({ message: message.trim() })
        .eq('id', postId)
        .select('id, message, reaction_count, created_at, pinned, user_id, profiles!wall_posts_user_id_fkey(username)')
        .single();

    if (error) throw error;
    res.json({ post });
  } catch (err) {
    console.error('[adminEditPost] error:', err);
    res.status(500).json({ error: 'Не успеа уредувањето на пораката.' });
  }
}

export async function adminDeletePost(req, res) {
  try {
    const { postId } = req.params;
    await supabaseAdmin.from('wall_reactions').delete().eq('post_id', postId);
    const { error } = await supabaseAdmin.from('wall_posts').delete().eq('id', postId);
    if (error) throw error;
    res.json({ deleted: true });
  } catch (err) {
    console.error('[adminDeletePost] error:', err);
    res.status(500).json({ error: 'Не успеа бришењето на пораката.' });
  }
}

export async function adminPinPost(req, res) {
  try {
    const { postId } = req.params;

    const { data: existing } = await supabaseAdmin
        .from('wall_posts')
        .select('pinned')
        .eq('id', postId)
        .single();

    const { data: post, error } = await supabaseAdmin
        .from('wall_posts')
        .update({ pinned: !existing?.pinned })
        .eq('id', postId)
        .select('id, pinned')
        .single();

    if (error) throw error;
    res.json({ post });
  } catch (err) {
    console.error('[adminPinPost] error:', err);
    res.status(500).json({ error: 'Не успеа пинувањето на пораката.' });
  }
}

/**
 * DELETE /api/wall/:postId/mine
 * Корисникот ја брише само сопствената порака.
 */
export async function deleteOwnPost(req, res) {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const { data: post } = await supabaseAdmin
        .from('wall_posts')
        .select('user_id')
        .eq('id', postId)
        .single();

    if (!post) return res.status(404).json({ error: 'Пораката не постои.' });
    if (post.user_id !== userId) return res.status(403).json({ error: 'Не можеш да ја избришеш туѓа порака.' });

    await supabaseAdmin.from('wall_reactions').delete().eq('post_id', postId);
    await supabaseAdmin.from('wall_posts').delete().eq('id', postId);

    res.json({ deleted: true });
  } catch (err) {
    console.error('[deleteOwnPost] error:', err);
    res.status(500).json({ error: 'Не успеа бришењето.' });
  }
}