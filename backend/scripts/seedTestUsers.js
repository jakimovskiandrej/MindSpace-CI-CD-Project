import { supabaseAdmin } from '../src/config/supabaseClient.js';

const TEST_USERS = [
  {
    email: 'admin@gmail.com',
    password: 'Admin123!',
    username: 'Психолог Админ',
    role: 'psychologist',
    class_code: null,
  },
  {
    email: 'user@gmail.com',
    password: 'User123!',
    username: 'Тест Ученик',
    role: 'student',
    class_code: 'VIII-в',
  },
];

async function findExistingUserId(email) {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureUser({ email, password, username, role, class_code }) {
  let userId = await findExistingUserId(email);

  if (userId) {
    console.log(`[seed] ${email} веќе постои (id: ${userId}) — прескокнувам создавање.`);
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`[seed] Создаден auth акаунт: ${email} (id: ${userId})`);
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert(
      { id: userId, username, role, class_code },
      { onConflict: 'id' }
    );
  if (profileError) throw profileError;

  console.log(`[seed] Профил подготвен: ${email} → улога "${role}"${class_code ? `, клас "${class_code}"` : ''}`);
}

async function main() {
  console.log('[seed] Почнувам сеедирање на тест-акаунти...\n');
  for (const user of TEST_USERS) {
    await ensureUser(user);
  }
  console.log('\n[seed] Готово! Може да се најавиш со:');
  TEST_USERS.forEach((u) => console.log(`  • ${u.email} / ${u.password}  (${u.role})`));
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] Грешка:', err.message || err);
  process.exit(1);
});
