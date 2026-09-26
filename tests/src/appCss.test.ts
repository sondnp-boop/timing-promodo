import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const css = fs.readFileSync(path.join(__dirname, '../../src/App.css'), 'utf-8');

function block(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`Không tìm thấy rule ${selector}`);
  return match[1];
}

describe('App.css (các quy tắc không kiểm tra được bằng jsdom)', () => {
  it('tiêu đề luôn cố định trên cùng khi cuộn', () => {
    const title = block('.title-bar');
    expect(title).toMatch(/position:\s*sticky/);
    expect(title).toMatch(/top:\s*0/);
    expect(title).toMatch(/background:/);
    expect(title).toMatch(/z-index:\s*\d+/);
  });

  it('dòng điều khiển Pomodoro chia cột 2/12 - 2/12 - 6/12 - 2/12', () => {
    expect(block('.pomodoro-controls')).toMatch(/grid-template-columns:\s*2fr 2fr 6fr 2fr/);
  });

  it('có đủ màu nhấp nháy: vàng/trắng và đỏ/xanh', () => {
    for (const c of ['yellow', 'white', 'red', 'green']) {
      expect(css).toContain(`.push-task-row--flash-${c}`);
    }
  });
});
