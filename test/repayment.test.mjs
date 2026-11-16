import assert from 'node:assert/strict';
import test from 'node:test';
import widget from '../repayment.js';

function allText(node, result = []) {
  if (!node || typeof node !== 'object') return result;
  if (node.type === 'text') result.push(node.text);
  if (Array.isArray(node.children)) {
    for (const child of node.children) allText(child, result);
  }
  return result;
}

async function render(value, now, family = 'systemSmall') {
  return widget({
    env: { REPAYMENT_CARDS: value },
    now,
    widgetFamily: family,
  });
}

test('empty configuration asks for local setup', async () => {
  const output = await render('', new Date(2026, 0, 1));
  assert.ok(allText(output).includes('設定每月還款日'));
});

test('today, tomorrow and later items are sorted by countdown', async () => {
  const output = await render('較晚:20;今天:10;明天:11', new Date(2026, 0, 10), 'systemMedium');
  const content = allText(output).join('|');
  assert.match(content, /今天\|今天\|1月10日/);
  assert.match(content, /明天\|明天\|1月11日/);
  assert.ok(content.indexOf('今天') < content.indexOf('較晚'));
});

test('passed date rolls into the next month and across the year', async () => {
  const output = await render('帳單:1', new Date(2026, 11, 31));
  const content = allText(output).join('|');
  assert.match(content, /1月1日\|明天/);
});

test('day 31 is clamped to the last day of a short month', async () => {
  const output = await render('月底卡:31', new Date(2026, 1, 28), 'systemMedium');
  const content = allText(output).join('|');
  assert.match(content, /今天/);
  assert.match(content, /2月28日/);
  assert.match(content, /每月 31 日（本月月底）/);
});

test('invalid entries are ignored without echoing their content', async () => {
  const output = await render('正常卡:15;PRIVATE-TEXT:not-a-day', new Date(2026, 0, 1));
  const content = allText(output).join('|');
  assert.match(content, /忽略 1 項/);
  assert.doesNotMatch(content, /PRIVATE-TEXT/);
});
