import PDFDocument from 'pdfkit';
import { supabaseAdmin } from '../config/supabaseClient.js';

const FONT_REGULAR= 'node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf';
const FONT_BOLD= 'node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf';
const FONT_MONO= 'node_modules/dejavu-fonts-ttf/ttf/DejaVuSansMono.ttf';
const MOOD_LABELS= { 1: 'Многу тешко', 2: 'Тешко', 3: 'Неутрално', 4: 'Добро', 5: 'Одлично' };
const MOOD_COLORS= { 1: '#D96C4F', 2: '#E3A23A', 3: '#5C6E66', 4: '#2B5F5A', 5: '#4C9A6A' };
const PAGE_W= 595;
const MARGIN= 50;
const CONTENT_W= PAGE_W - MARGIN * 2;

function headerBar(doc) {
  doc.rect(0, 0, PAGE_W, 8).fill('#2B5F5A');
}

function footerLine(doc, pageNum) {
  const y = doc.page.height - 38;
  doc.rect(MARGIN, y, CONTENT_W, 0.5).fill('#D8E2DC');
  doc.font('Regular').fontSize(8).fillColor('#8FA99E')
      .text('MindSpace — Личен извештај · Доверливо · Генерирано само за тебе', MARGIN, y + 7, { width: CONTENT_W - 60 })
      .text(`Страна ${pageNum}`, MARGIN, y + 7, { width: CONTENT_W, align: 'right' });
}

function sectionTitle(doc, text) {
  doc.moveDown(0.6);
  doc.rect(MARGIN, doc.y, 3, 14).fill('#2B5F5A');
  doc.font('Bold').fontSize(12).fillColor('#1A413D')
      .text(text, MARGIN + 10, doc.y - 1);
  doc.moveDown(0.6);
}

function statBox(doc, x, y, w, h, label, value, subtext, color) {
  doc.rect(x, y, w, h).fill('#EEF3F0').stroke('#D8E2DC');
  doc.rect(x, y, w, 3).fill(color);
  doc.font('Bold').fontSize(9).fillColor('#5C6E66')
      .text(label.toUpperCase(), x + 10, y + 10, { width: w - 20 });
  doc.font('Bold').fontSize(18).fillColor(color)
      .text(value, x + 10, y + 24, { width: w - 20 });
  if (subtext) {
    doc.font('Regular').fontSize(8).fillColor('#8FA99E')
        .text(subtext, x + 10, y + 47, { width: w - 20 });
  }
}

function moodBar(doc, x, y, score, width = 120) {
  const pct = score / 5;
  const color = MOOD_COLORS[score] || '#5C6E66';
  doc.rect(x, y, width, 7).fill('#E4EBE5');
  doc.rect(x, y, width * pct, 7).fill(color);
}

export async function generateWeeklyReport(req, res) {
  try {
    const userId = req.user.id;
    const days= Math.min(Number(req.query.days) || 30, 90);
    const since= new Date();
    since.setUTCDate(since.getUTCDate() - days);

    const [
      { data: profile },
      { data: logs, error: logsError },
      { data: userChallenges },
      { data: userBadges },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
      supabaseAdmin.from('daily_logs').select('*').eq('user_id', userId)
          .gte('created_at', since.toISOString()).order('created_at', { ascending: true }),
      supabaseAdmin.from('user_challenges').select('*, challenges(*)')
          .eq('user_id', userId).eq('status', 'completed')
          .gte('updated_at', since.toISOString()),
      supabaseAdmin.from('user_badges').select('*, badges(*)').eq('user_id', userId),
    ]);

    if (logsError) throw logsError;

    const rows= logs || [];
    const avg = (key) => rows.length ? rows.reduce((s, r) => s + (Number(r[key]) || 0), 0) / rows.length : null;
    const avgMood = avg('mood_score');
    const avgScreen = avg('screen_time_hours');
    const sleepRows= rows.filter((r) => r.sleep_hours != null);
    const avgSleep= sleepRows.length ? sleepRows.reduce((s, r) => s + Number(r.sleep_hours), 0) / sleepRows.length : null;
    const stressDays= rows.filter((r) => r.stress_flag).length;
    const stressPct= rows.length ? Math.round((stressDays / rows.length) * 100) : 0;
    const positiveDays= rows.filter((r) => r.sentiment_label === 'positive').length;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
        `attachment; filename="mindspace-izvestaj-${new Date().toISOString().slice(0, 10)}.pdf"`);

    const doc= new PDFDocument({ margin: MARGIN, size: 'A4', bufferPages: true });
    doc.registerFont('Regular', FONT_REGULAR);
    doc.registerFont('Bold', FONT_BOLD);
    doc.registerFont('Mono', FONT_MONO);
    doc.pipe(res);

    headerBar(doc);

    doc.moveDown(0.5);
    doc.font('Bold').fontSize(26).fillColor('#1A413D').text('MindSpace', MARGIN, 28);
    doc.font('Regular').fontSize(11).fillColor('#5C6E66')
        .text('Личен извештај за дигитална благосостојба', MARGIN, 58);

    doc.moveDown(0.5);
    doc.rect(MARGIN, doc.y, CONTENT_W, 1).fill('#D8E2DC');
    doc.moveDown(0.8);

    const metaY = doc.y;
    doc.font('Bold').fontSize(10).fillColor('#1E2D27').text('Ученик:', MARGIN, metaY);
    doc.font('Regular').fontSize(10).fillColor('#1E2D27')
        .text(profile?.username || '—', MARGIN + 60, metaY);

    doc.font('Bold').fontSize(10).fillColor('#1E2D27')
        .text('Класа:', MARGIN, metaY + 16);
    doc.font('Regular').fontSize(10).fillColor('#1E2D27')
        .text(profile?.class_code || '—', MARGIN + 60, metaY + 16);

    doc.font('Bold').fontSize(10).fillColor('#1E2D27')
        .text('Период:', MARGIN, metaY + 32);
    doc.font('Regular').fontSize(10).fillColor('#1E2D27')
        .text(`Последни ${days} денови`, MARGIN + 60, metaY + 32);

    doc.font('Bold').fontSize(10).fillColor('#1E2D27')
        .text('Датум:', MARGIN, metaY + 48);
    doc.font('Regular').fontSize(10).fillColor('#1E2D27')
        .text(new Date().toLocaleDateString('mk-MK', { day: '2-digit', month: 'long', year: 'numeric' }),
            MARGIN + 60, metaY + 48);

    doc.font('Bold').fontSize(10).fillColor('#1E2D27')
        .text('Ниво:', MARGIN, metaY + 64);
    doc.font('Mono').fontSize(10).fillColor('#2B5F5A')
        .text(`Ниво ${profile?.level ?? 1}  ·  ${profile?.xp_points ?? 0} XP`,
            MARGIN + 60, metaY + 64);

    doc.rect(PAGE_W - MARGIN - 130, metaY - 8, 130, 88).fill('#EEF3F0').stroke('#D8E2DC');
    doc.font('Bold').fontSize(9).fillColor('#5C6E66')
        .text('ЗАПИШАНИ ДЕНОВИ', PAGE_W - MARGIN - 120, metaY + 4, { width: 110, align: 'center' });
    doc.font('Bold').fontSize(32).fillColor('#2B5F5A')
        .text(String(rows.length), PAGE_W - MARGIN - 120, metaY + 20, { width: 110, align: 'center' });
    doc.font('Regular').fontSize(8).fillColor('#8FA99E')
        .text(`од вкупно ${days} денови`, PAGE_W - MARGIN - 120, metaY + 58, { width: 110, align: 'center' });

    doc.moveDown(5);

    sectionTitle(doc, 'Резиме на периодот');

    const boxY  = doc.y;
    const boxW= 118;
    const boxH= 68;
    const gap= 7;

    statBox(doc, MARGIN, boxY, boxW, boxH,
        'Расположение',
        avgMood != null ? `${avgMood.toFixed(1)} / 5` : '—',
        avgMood != null ? MOOD_LABELS[Math.round(avgMood)] : 'нема записи',
        MOOD_COLORS[Math.round(avgMood)] || '#5C6E66');

    statBox(doc, MARGIN + boxW + gap, boxY, boxW, boxH,
        'Screen-time',
        avgScreen != null ? `${avgScreen.toFixed(1)} ч` : '—',
        'просечно дневно',
        avgScreen != null && avgScreen > 4 ? '#D96C4F' : '#2B5F5A');

    statBox(doc, MARGIN + (boxW + gap)*2, boxY, boxW, boxH,
        'Сон',
        avgSleep != null ? `${avgSleep.toFixed(1)} ч` : '—',
        avgSleep != null && avgSleep < 7 ? '⚠ под препорачано' : 'просечно дневно',
        avgSleep != null && avgSleep < 7 ? '#E3A23A' : '#4C9A6A');

    statBox(doc, MARGIN + (boxW + gap)*3, boxY, boxW, boxH,
        'Стресни денови',
        `${stressDays} (${stressPct}%)`,
        stressPct > 40 ? '⚠ зачестено' : 'во периодот',
        stressPct > 40 ? '#D96C4F' : '#5C6E66');

    doc.y = boxY + boxH + 16;

    sectionTitle(doc, 'Постигнувања');

    const achY = doc.y;
    doc.font('Regular').fontSize(10).fillColor('#1E2D27');
    doc.text(`✅  Завршени предизвици во периодот: `, MARGIN, achY, { continued: true });
    doc.font('Bold').text(String(userChallenges?.length ?? 0));

    doc.font('Regular').fontSize(10).fillColor('#1E2D27');
    doc.text(`🏅  Освоени беџови вкупно: `, MARGIN, doc.y + 4, { continued: true });
    doc.font('Bold').text(String(userBadges?.length ?? 0));

    if (userBadges?.length) {
      doc.font('Mono').fontSize(9).fillColor('#5C6E66')
          .text(userBadges.map((b) => b.badges?.title).filter(Boolean).join('  ·  '),
              MARGIN, doc.y + 3, { width: CONTENT_W });
    }

    doc.font('Regular').fontSize(10).fillColor('#1E2D27');
    doc.text(`😊  Позитивни денови: `, MARGIN, doc.y + 4, { continued: true });
    doc.font('Bold').text(`${positiveDays} (${rows.length ? Math.round(positiveDays/rows.length*100) : 0}%)`);

    doc.moveDown(1);

    if (rows.length > 0) {
      doc.addPage();
      headerBar(doc);
      doc.moveDown(0.5);

      sectionTitle(doc, 'Дневни записи');

      const col = { date: MARGIN, mood: MARGIN+90, screen: MARGIN+260, sleep: MARGIN+320, stress: MARGIN+375 };
      const thY = doc.y;

      doc.rect(MARGIN, thY - 4, CONTENT_W, 18).fill('#EEF3F0');
      doc.font('Bold').fontSize(8).fillColor('#5C6E66');
      doc.text('ДАТУМ',        col.date,   thY, { width: 85 });
      doc.text('РАСПОЛОЖЕНИЕ', col.mood,   thY, { width: 155 });
      doc.text('SCREEN-TIME',  col.screen, thY, { width: 55 });
      doc.text('СОН',          col.sleep,  thY, { width: 50 });
      doc.text('СТРЕС',        col.stress, thY, { width: 45 });
      doc.moveDown(0.8);

      let pageNum = 2;
      let altRow  = false;

      for (const r of rows) {
        if (doc.y > 760) {
          footerLine(doc, pageNum++);
          doc.addPage();
          headerBar(doc);
          doc.moveDown(0.5);
        }

        const rY = doc.y;
        if (altRow) doc.rect(MARGIN, rY - 2, CONTENT_W, 16).fill('#F5F9F6');
        altRow = !altRow;

        doc.font('Regular').fontSize(8.5).fillColor('#1E2D27');
        doc.text(new Date(r.created_at).toLocaleDateString('mk-MK', { day:'2-digit', month:'2-digit', year:'numeric' }),
            col.date, rY, { width: 85 });

        const moodLabel = MOOD_LABELS[r.mood_score] || '';
        doc.font('Bold').fontSize(8.5).fillColor(MOOD_COLORS[r.mood_score] || '#1E2D27')
            .text(`${r.mood_score}/5`, col.mood, rY, { width: 28 });
        doc.font('Regular').fontSize(8.5).fillColor('#1E2D27')
            .text(MOOD_LABELS[r.mood_score] || '', col.mood + 32, rY, { width: 55 });
        moodBar(doc, col.mood + 90, rY + 5, r.mood_score, 55);

        doc.font('Regular').fontSize(8.5).fillColor(Number(r.screen_time_hours) > 4 ? '#D96C4F' : '#1E2D27')
            .text(`${r.screen_time_hours} ч`, col.screen, rY, { width: 55 });

        doc.font('Regular').fontSize(8.5).fillColor(r.sleep_hours != null && r.sleep_hours < 7 ? '#E3A23A' : '#1E2D27')
            .text(r.sleep_hours != null ? `${r.sleep_hours} ч` : '—', col.sleep, rY, { width: 50 });

        doc.font('Bold').fontSize(8.5).fillColor(r.stress_flag ? '#D96C4F' : '#4C9A6A')
            .text(r.stress_flag ? 'Да' : 'Не', col.stress, rY, { width: 40 });

        doc.moveDown(0.5);
      }

      footerLine(doc, pageNum);
    }

    const range= doc.bufferedPageRange();
    doc.switchToPage(range.start);
    footerLine(doc, 1);

    doc.flushPages();
    doc.end();

  } catch (err) {
    console.error('[generateWeeklyReport] error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Не успеа генерирањето на извештајот.' });
    } else {
      res.end();
    }
  }
}