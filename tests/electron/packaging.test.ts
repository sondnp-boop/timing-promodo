import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const root = path.join(__dirname, '../..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf-8').split(/\r?\n/);

describe('cấu hình đóng gói (electron-builder)', () => {
  it('có script dist build rồi đóng gói cho Windows', () => {
    expect(pkg.scripts.dist).toBe('npm run build && electron-builder --win');
  });

  it('output ra release/ (không đè lên dist của Vite) và release/ bị git bỏ qua', () => {
    expect(pkg.build.directories.output).toBe('release');
    expect(pkg.build.directories.output).not.toBe('dist');
    expect(gitignore).toContain('release/');
  });

  it('đóng gói đủ file renderer + main process, và main trỏ đúng file build', () => {
    expect(pkg.build.files).toEqual(expect.arrayContaining(['dist/**/*', 'dist-electron/**/*', 'package.json']));
    expect(pkg.main).toBe('dist-electron/main.js');
  });

  it('có bộ cài NSIS và bản portable cho Windows', () => {
    expect(pkg.build.win.target).toEqual(expect.arrayContaining(['nsis', 'portable']));
  });

  it('tắt bước ký/chỉnh exe để build được trên máy không có quyền tạo symlink', () => {
    expect(pkg.build.win.signAndEditExecutable).toBe(false);
  });

  it('có appId và productName', () => {
    expect(pkg.build.appId).toMatch(/^[\w.-]+$/);
    expect(pkg.build.productName).toBeTruthy();
  });

  it('main.ts nạp giao diện từ dist/index.html nằm trong gói', () => {
    const main = fs.readFileSync(path.join(root, 'electron/main.ts'), 'utf-8');
    expect(main).toContain("'../dist/index.html'");
  });
});
