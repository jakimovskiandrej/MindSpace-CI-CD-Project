import { analyzeDiaryEntry } from '../services/sentimentService.js';

/**
 * POST /api/sentiment/analyze
 * body: { text }
 * Овозможува "live" преглед на анализата додека корисникот сè уште пишува,
 * пред да го зачува записот (на пр. за да прикажеш сугестија веднаш).
 */
export function analyzeSentiment(req, res) {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Текстот е празен.' });
  }

  const result = analyzeDiaryEntry(text);
  res.json(result);
}
