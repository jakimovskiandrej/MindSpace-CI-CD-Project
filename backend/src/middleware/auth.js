import { supabaseAdmin } from '../config/supabaseClient.js';

/**
 * Го очекува Supabase access token-от во "Authorization: Bearer <token>" заглавието
 * (фронтендот автоматски го праќа преку supabase.auth.getSession()).
 * Го верификува токенот со Supabase Auth и го прикачува корисникот на req.user.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Недостасува access token.' });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Невалиден или истечен token.' });
    }

    req.user = data.user;
    next();
  } catch (err) {
    console.error('[requireAuth] error:', err);
    res.status(500).json({ error: 'Грешка при проверка на автентикација.' });
  }
}

/**
 * Дозволува пристап само на корисници со улога 'teacher' или 'psychologist'
 * (за Admin Dashboard рутите). Мора да се користи по requireAuth.
 */
export async function requireStaff(req, res, next) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(403).json({ error: 'Профилот не е пронајден.' });
    }

    if (!['teacher', 'psychologist'].includes(profile.role)) {
      return res.status(403).json({ error: 'Немаш дозвола за овој ресурс.' });
    }

    next();
  } catch (err) {
    console.error('[requireStaff] error:', err);
    res.status(500).json({ error: 'Грешка при проверка на дозволи.' });
  }
}
