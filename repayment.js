// Egern 每月還款倒數 Widget
// 無網路請求、無廣告、無分析或資料上報。

const COLORS = {
  background: { light: '#F4F6FA', dark: '#0E1016' },
  card: { light: '#FFFFFF', dark: '#191C25' },
  text: { light: '#182033', dark: '#F4F6FF' },
  secondary: { light: '#667085', dark: '#A6ADBD' },
  line: { light: '#E5E9F0', dark: '#2B3040' },
  normal: { light: '#2563EB', dark: '#74A7FF' },
  soon: { light: '#D97706', dark: '#FFBE55' },
  urgent: { light: '#DC2626', dark: '#FF766C' },
  ok: { light: '#15803D', dark: '#63D88B' },
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ITEMS = 20;

function text(value, size, weight = 'regular', color = COLORS.text, extra = {}) {
  return {
    type: 'text',
    text: String(value),
    font: { size, weight },
    textColor: color,
    maxLines: 1,
    minScale: 0.55,
    ...extra,
  };
}

function icon(name, color, size = 16) {
  return {
    type: 'image',
    src: `sf-symbol:${name}`,
    color,
    width: size,
    height: size,
  };
}

function calendarSerial(date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

function daysBetween(from, to) {
  return calendarSerial(to) - calendarSerial(from);
}

function lastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function dueDateInMonth(year, month, configuredDay) {
  const actualDay = Math.min(configuredDay, lastDayOfMonth(year, month));
  return new Date(year, month, actualDay);
}

function nextDueDate(now, configuredDay) {
  let year = now.getFullYear();
  let month = now.getMonth();
  let due = dueDateInMonth(year, month, configuredDay);

  if (daysBetween(now, due) < 0) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    due = dueDateInMonth(year, month, configuredDay);
  }

  return {
    date: due,
    remaining: daysBetween(now, due),
    configuredDay,
    adjusted: due.getDate() !== configuredDay,
  };
}

function splitEntry(entry) {
  const colon = Math.max(entry.lastIndexOf(':'), entry.lastIndexOf('：'));
  if (colon <= 0) return null;
  return [entry.slice(0, colon).trim(), entry.slice(colon + 1).trim()];
}

function parseCards(value, now) {
  const raw = String(value || '').trim();
  if (!raw) return { cards: [], invalidCount: 0 };

  const entries = raw
    .split(/[;；\n]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, MAX_ITEMS);

  const cards = [];
  let invalidCount = 0;

  for (const entry of entries) {
    const parts = splitEntry(entry);
    if (!parts) {
      invalidCount += 1;
      continue;
    }

    const name = parts[0].slice(0, 24);
    const day = Number(parts[1]);
    if (!name || !Number.isInteger(day) || day < 1 || day > 31) {
      invalidCount += 1;
      continue;
    }

    cards.push({ name, ...nextDueDate(now, day) });
  }

  cards.sort((a, b) => a.remaining - b.remaining || a.configuredDay - b.configuredDay || a.name.localeCompare(b.name));
  return { cards, invalidCount };
}

function dateLabel(date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function countdownLabel(remaining) {
  if (remaining === 0) return '今天';
  if (remaining === 1) return '明天';
  return `${remaining} 天`;
}

function urgencyColor(remaining) {
  if (remaining <= 3) return COLORS.urgent;
  if (remaining <= 7) return COLORS.soon;
  return COLORS.normal;
}

function setupWidget(invalidCount = 0) {
  const detail = invalidCount > 0
    ? `有 ${invalidCount} 項格式錯誤，請使用 名稱:日期`
    : '請在模組設定填寫：名稱:每月日期';

  return {
    type: 'widget',
    padding: 14,
    gap: 8,
    backgroundColor: COLORS.background,
    children: [
      icon('creditcard.fill', COLORS.normal, 22),
      text('設定每月還款日', 13, 'bold'),
      text(detail, 10, 'medium', invalidCount > 0 ? COLORS.urgent : COLORS.secondary, { maxLines: 2 }),
      text('例：信用卡 A:10;信用卡 B:25', 9, 'regular', COLORS.secondary, { maxLines: 2 }),
    ],
  };
}

function compactRow(card, size = 10) {
  const color = urgencyColor(card.remaining);
  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    gap: 5,
    padding: [6, 8],
    backgroundColor: COLORS.card,
    borderRadius: 8,
    children: [
      icon('creditcard.fill', color, 13),
      text(card.name, size, 'semibold', COLORS.text, { flex: 1 }),
      text(dateLabel(card.date), size - 1, 'medium', COLORS.secondary),
      text(countdownLabel(card.remaining), size, 'bold', color),
    ],
  };
}

function detailCard(card) {
  const color = urgencyColor(card.remaining);
  const monthly = card.adjusted
    ? `每月 ${card.configuredDay} 日（本月月底）`
    : `每月 ${card.configuredDay} 日`;

  return {
    type: 'stack',
    direction: 'column',
    flex: 1,
    gap: 3,
    padding: [9, 10],
    backgroundColor: COLORS.card,
    borderRadius: 10,
    children: [
      {
        type: 'stack',
        direction: 'row',
        alignItems: 'center',
        gap: 5,
        children: [
          icon('creditcard.fill', color, 14),
          text(card.name, 10, 'bold', COLORS.text, { flex: 1 }),
        ],
      },
      {
        type: 'stack',
        direction: 'row',
        alignItems: 'end',
        children: [
          text(countdownLabel(card.remaining), 23, 'bold', color),
          { type: 'spacer' },
          text(dateLabel(card.date), 9, 'semibold', COLORS.secondary),
        ],
      },
      text(monthly, 8, 'medium', COLORS.secondary),
    ],
  };
}

function header(total, invalidCount) {
  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    gap: 5,
    children: [
      icon('calendar.badge.clock', COLORS.normal, 14),
      text('每月還款倒數', 11, 'bold'),
      { type: 'spacer' },
      text(`${total} 項${invalidCount ? ` · 忽略 ${invalidCount} 項` : ''}`, 8, 'medium', invalidCount ? COLORS.urgent : COLORS.secondary),
    ],
  };
}

function standardWidget(cards, invalidCount, family) {
  const limits = {
    systemSmall: 2,
    systemMedium: 3,
    systemLarge: 6,
    systemExtraLarge: 8,
  };
  const visible = cards.slice(0, limits[family] || 6);

  if (family === 'systemSmall') {
    return {
      type: 'widget',
      padding: 10,
      gap: 5,
      backgroundColor: COLORS.background,
      children: [
        header(cards.length, invalidCount),
        ...visible.map((card) => compactRow(card, 9)),
      ],
    };
  }

  const children = [header(cards.length, invalidCount)];
  for (let index = 0; index < visible.length; index += 2) {
    const pair = visible.slice(index, index + 2);
    const rowChildren = pair.map(detailCard);
    if (rowChildren.length === 1) {
      rowChildren.push({ type: 'stack', flex: 1, children: [] });
    }
    children.push({
      type: 'stack',
      direction: 'row',
      gap: 7,
      children: rowChildren,
    });
  }

  return {
    type: 'widget',
    padding: 10,
    gap: 6,
    backgroundColor: COLORS.background,
    children,
  };
}

function accessoryWidget(cards, family) {
  const first = cards[0];
  if (family === 'accessoryInline') {
    return {
      type: 'widget',
      children: [text(`${first.name} ${countdownLabel(first.remaining)}`, 11, 'semibold')],
    };
  }

  return {
    type: 'widget',
    padding: 6,
    gap: 2,
    children: [
      text('每月還款倒數', 11, 'bold'),
      text(
        cards.slice(0, 3).map((card) => `${card.name} ${countdownLabel(card.remaining)}`).join(' · '),
        9,
        'semibold',
        urgencyColor(first.remaining),
        { maxLines: 2 },
      ),
    ],
  };
}

export default async function(ctx) {
  const now = ctx && ctx.now instanceof Date ? ctx.now : new Date();
  const env = ctx && ctx.env ? ctx.env : {};
  const { cards, invalidCount } = parseCards(env.REPAYMENT_CARDS, now);

  if (cards.length === 0) return setupWidget(invalidCount);

  const family = ctx && ctx.widgetFamily ? ctx.widgetFamily : 'systemMedium';
  if (family === 'accessoryInline' || family === 'accessoryRectangular') {
    return accessoryWidget(cards, family);
  }

  return standardWidget(cards, invalidCount, family);
}
