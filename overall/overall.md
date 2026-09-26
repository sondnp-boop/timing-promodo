# Pomodoro + Push-Task Widget — Tổng quan để maintain

> Đọc file này trước khi sửa code. Nó chứa: mục đích, kiến trúc, quy tắc nghiệp vụ (kể cả các quyết định/giả định đã chốt với người dùng), cách chạy/test và các bẫy đã gặp. Khi thay đổi hành vi, **cập nhật lại file này**.

## 1. App làm gì

App desktop nhỏ (Windows là môi trường chính), cửa sổ luôn nổi ở góc trên-phải màn hình, 2 khung:

1. **Đồng hồ Pomodoro** – đếm làm/nghỉ, thông báo Windows khi chuyển pha, nút Play mở nhạc YouTube bằng trình duyệt mặc định.
2. **Đầu việc cần push** – danh sách việc cần nhắc push theo các mốc giờ, có thanh timeline + chấm đỏ, nhấp nháy khi tới hạn, sửa/xóa/done, Export danh sách.

Ngôn ngữ giao diện: tiếng Việt. Người dùng làm việc bằng tiếng Việt.

## 2. Stack & lệnh

- Electron 29 + React 18 + TypeScript, build renderer bằng Vite, test bằng Vitest + Testing Library (jsdom).
- Lưu dữ liệu: file JSON (không dùng DB).
- Không có lib icon/UI ngoài; icon là SVG inline (`src/shared/icons.tsx`).

```bash
npm install
npm run build        # tsc (renderer) + tsc (electron, CommonJS) + vite build  → dist/, dist-electron/
npm run electron:dev # build rồi chạy Electron thật (cách duy nhất để xem app thật)
npm test             # vitest run (toàn bộ test)
```

- `package.json` **không** có `"type": "module"` (main process biên dịch ra CommonJS; thêm vào sẽ lỗi `exports is not defined`).
- `npm run dev` chỉ chạy Vite (trình duyệt), không có Electron/IPC → UI sẽ lỗi vì thiếu `window.electronAPI`.
- Cảnh báo "CJS build of Vite's Node API is deprecated" là vô hại.

## 3. Quy trình làm việc bắt buộc (từ `~/.claude/CLAUDE.md` của người dùng)

1. Trước khi đổi code: tạo & checkout branch `feature_<tên_ngắn>`, commit trên branch đó.
2. Viết test tự động cho mọi code mới/đổi.
3. `npm run build` phải sạch và `npm test` phải pass 100% trước khi commit.
4. Không commit `.claude/` (đã trong `.gitignore`). Commit message kết thúc bằng dòng `Co-Authored-By` theo cấu hình phiên.
5. Người dùng thường yêu cầu theo dạng danh sách chỉnh UI/hành vi; các điểm mơ hồ nên chọn mặc định hợp lý, **nêu rõ giả định** khi báo cáo (người dùng từng từ chối bị hỏi nhiều câu).

## 4. Cấu trúc thư mục

```
electron/                      # Main process (biên dịch CommonJS → dist-electron/)
  main.ts                      # Tạo BrowserWindow (480x560, frameless, alwaysOnTop, góc trên-phải), tray, single-instance lock
  preload.ts                   # contextBridge → window.electronAPI (chỉ chỗ này expose IPC)
  ipc.ts                       # Đăng ký ipcMain.handle + vòng tick 1s (push due, pomodoro tick, cảnh báo)
  notifications.ts             # Wrapper Notification của Electron
  store/schema.ts              # Kiểu dữ liệu + createDefaultAppData + playlist mặc định
  store/jsonStore.ts           # Đọc/ghi JSON atomic + backup + phục hồi file hỏng
  modules/pomodoro/pomodoroEngine.ts   # Thuần: startPhase, tick, dueWarning
  modules/pomodoro/musicPicker.ts      # Thuần: chọn link nhạc
  modules/pushTasks/pushTaskEngine.ts  # Thuần: nextPushTime, processDueTasks, sortByNextPush
  modules/pushTasks/historyPruner.ts   # Thuần: xóa lịch sử push > 10 ngày
src/                           # Renderer (React)
  main.tsx, App.tsx, App.css   # App.css là toàn bộ style (theme + layout)
  api/electronApi.ts           # Kiểu ElectronAPI + getElectronApi() — renderer chỉ chạm IPC qua đây
  features/pomodoro/           # PomodoroPanel (container), PomodoroClock, PomodoroSettingsPanel, MusicSettingsPanel
  features/pushTasks/          # PushTaskPanel (container), PushTaskForm, PushTaskList, PushTaskRow, ExportDialog
  shared/                      # CollapsiblePanel, Modal(+ConfirmDialog), TitleBar, icons, colorPalette,
                               # flash (rowAlert), formatDuration, exportTasks, types (re-export từ electron/)
tests/electron/*.test.ts       # Test logic thuần + jsonStore (dùng fs thật + thư mục tạm)
tests/src/*.test.tsx|ts        # Test component / helper / CSS
tests/setupTests.ts            # jest-dom matchers
overall/overall.md             # File này
```

Nguyên tắc kiến trúc: **logic nghiệp vụ nằm trong hàm thuần** (engine, flash, formatDuration, exportTasks) để test dễ; `ipc.ts`/`main.ts`/`preload.ts` chỉ nối dây (không unit-test được vì cần runtime Electron → kiểm thủ công bằng `npm run electron:dev`). Renderer chỉ import **kiểu** từ `electron/` (qua `src/shared/types.ts`); không import logic từ main process.

## 5. Dữ liệu & lưu trữ

File: `%APPDATA%\timing-promodo\app-data.json` (`app.getPath('userData')`, tên app lấy từ `package.json`).

```ts
AppData {
  pomodoroSettings: { workMinutes, breakMinutes, musicGenre: 'mixset'|'pomodoro'|'baroque'|'custom', customLink? }
  playlists: { mixset: string[]; pomodoro: string[]; baroque: string[] }   // URL YouTube mặc định (chưa kiểm chứng còn sống)
  pushTasks: PushTask[]
  pushHistory: { taskId, pushedAt }[]      // tự dọn > 10 ngày khi khởi động
}
PushTask { id, name, offsetsHours: number[], cycleStart (epoch ms), pushedOffsetIndexes: number[], done, colorIndex }
```

- Task **chỉ mất khi người dùng xóa**. `pushHistory` mới bị prune (10 ngày).
- `JsonStore.save`: ghi `.tmp` → rename → copy sang `.bak`. `load`: file chính → `.bak` → nếu cả hai hỏng thì đổi tên file hỏng thành `.corrupt-<ts>` (không ghi đè) và dùng mặc định. Tự bổ sung mặc định cho trường thiếu (file cũ).
- `main.ts` dùng `requestSingleInstanceLock` để 2 bản app không ghi đè dữ liệu của nhau.
- Trạng thái Pomodoro (đang chạy/đếm) **không** được lưu; tắt app là mất. Chỉ cài đặt (`x/y`, link) được lưu.
- Dữ liệu cũ có thể còn trường thừa (`pusher`, `cycleHours`) – vô hại, không cần migrate.

## 6. IPC (preload ↔ ipc.ts)

| Kênh | Hướng | Việc |
|---|---|---|
| `data:get` | invoke | trả toàn bộ AppData |
| `window:minimize` | invoke | thu nhỏ xuống taskbar |
| `clipboard:write` | invoke | copy text (qua main vì preload sandbox không có clipboard) |
| `pomodoro:updateSettings` / `start`(phase) / `stop` / `getState` / `playMusic` | invoke | điều khiển Pomodoro; `playMusic` mở link bằng `shell.openExternal` |
| `pomodoro:stateChanged` | main→renderer | khi tự chuyển pha |
| `tasks:list` / `add` / `update` / `markDone`(toggle) / `delete` | invoke | CRUD, luôn trả danh sách đã `sortByNextPush` |
| `tasks:updated` | main→renderer | sau khi tick đánh dấu push |

Thêm kênh mới = sửa 3 nơi: `ipc.ts`, `preload.ts`, `src/api/electronApi.ts` (và stub `window.electronAPI` trong test liên quan).

## 7. Quy tắc nghiệp vụ

### 7.1 Push task
- Thêm: 2 `<textarea>` trên cùng 1 dòng, **nằm trên danh sách**: tên + mốc giờ (tách bằng dấu phẩy/khoảng trắng/xuống dòng, chỉ nhận số > 0). `Enter` = thêm, `Shift+Enter` = xuống dòng. **Cả 2 ô luôn trống** khi mở app và sau mỗi lần Enter thành công (thêm hoặc sửa) — ô mốc chỉ có placeholder gợi ý `3,6,9`, không điền sẵn; nếu tên trống hoặc mốc không hợp lệ thì Enter không làm gì và không xóa gì. Textarea tự giãn theo `scrollHeight`. Không có nút thêm, không có ô "người push", không có ô chu kỳ.
- Mốc `offsetsHours` tính bằng giờ (cho phép lẻ, vd `0.5`) **kể từ `cycleStart`** (thời điểm tạo hoặc lần sửa mốc). **Không có chu kỳ lặp lại**: sau mốc cuối task dừng và báo đỏ/xanh cho tới khi bấm Done (đã bỏ auto-roll 24h).
- Thời gian tính theo **giờ thật (epoch)**, tiếp tục trôi khi app tắt (mở lại sau 30 phút → chấm đỏ nhích thêm 30 phút; mốc lỡ sẽ bắn thông báo ở tick đầu tiên).
- Tick 1s trong `ipc.ts`: `processDueTasks` đánh dấu mốc đã tới (`pushedOffsetIndexes`), ghi `pushHistory`, bắn thông báo Windows "Đến giờ push công việc", gửi `tasks:updated`. Task `done` bị bỏ qua.
- Sắp xếp (`sortByNextPush`, chỉ sắp ở main process, renderer hiển thị đúng thứ tự nhận được): task **chưa done** theo `nextPushTime` tăng dần (task đã hết mốc nhưng chưa done → cuối nhóm này); task **đã Done luôn nằm dưới cùng** (theo mốc trong nhóm done). Bỏ Done thì task quay về vị trí theo mốc. Hiển thị 5 dòng đầu, còn lại nút "Xem thêm N task"; dòng đang nhấp nháy (`rowAlert != null`) luôn hiện dù ngoài top 5.
- **Sửa** (icon bút): điền tên + mốc vào form, hiện nhãn "Sửa"; Enter cập nhật (`tasks:update`); đổi mốc → reset `cycleStart=now` & `pushedOffsetIndexes=[]`; chỉ đổi tên → giữ tiến độ. `Escape` hủy sửa. Xóa task đang sửa thì thoát chế độ sửa.
- **Xóa**: hiện `ConfirmDialog` trong app (KHÔNG dùng `window.confirm` — trên Electron nó làm mất focus ô nhập). Đồng ý mới gọi `tasks:delete`.
- **Done** (icon check) là toggle; done → gạch ngang, không nhấp nháy, không bắn push.
- Badge cạnh tiêu đề = số task chưa done. Nút **Export** cạnh badge (nằm trong `headerExtra`, chặn nổi bọt để không đóng/mở panel).

### 7.2 Timeline (PushTaskRow)
- Điểm: `0` + các mốc (sắp xếp tăng dần); vị trí = `giờ / mốc_cuối * 100%` (tỉ lệ thời gian thật, không chia đều). Phần tô = màu task (`colorForIndex(colorIndex)`, 8 màu lặp) đến chấm đỏ; chấm đỏ = `(now - cycleStart)/mốc_cuối`, kẹp 0..100%.
- Nhãn mốc: `0` ghi "0"; `< 1h` → "N phút"; `>= 1h` → "X tiếng" (tối đa 1 số lẻ, dấu chấm: "2.5 tiếng") — `formatDurationHours`.
- Tooltip (`title`) trên chấm đỏ: "Đã trôi qua …" cùng quy tắc phút/tiếng. Đã **bỏ** dòng nhãn "Còn x tiếng".

### 7.3 Nhấp nháy (`src/shared/flash.ts → rowAlert(task, now)`), tính thuần từ thời gian
- 15 giây trước **mỗi** mốc: `yellow`/`white` đổi mỗi 1 giây (bắt đầu bằng vàng), hết 15s về mặc định.
- Từ mốc cuối trở đi: `red`/`green` đổi mỗi 1 giây, liên tục tới khi Done. ("xanh" được hiểu là **xanh lá** — giả định; đổi ở `.push-task-row--flash-green` trong App.css nếu người dùng muốn xanh dương.)
- Task `done` → không nhấp nháy. Renderer cập nhật `now` mỗi giây (setInterval trong `PushTaskPanel`).

### 7.4 Export
- Popup (`ExportDialog`): các task **done trước**, rồi **Progress**; đánh số liên tục; task đã xóa không có. Định dạng: `N. Tên. Done` và `N. Tên. Progress. <thời gian đã trôi qua> / 1,2,3`. Tên nhiều dòng gộp thành 1 dòng. Nút "Copy to Clipboard" (→ IPC `clipboard:write`), hiện "Đã copy!" 2 giây; khóa khi rỗng.

### 7.5 Pomodoro
- Panel Pomodoro **nằm trên**, mặc định **thu gọn**; panel Push nằm dưới, mặc định **mở**.
- Hộp giờ: to (68px), căn giữa. Chưa chạy: nền gradient xanh dương + chữ vàng. Đang làm: nền `#89ABE3` chữ trắng. Đang nghỉ: nền `#EA738D` chữ đen.
- Một hàng điều khiển (`.pomodoro-controls`, grid `2fr 2fr 6fr 2fr`): **[ô giờ làm/nghỉ] [nút Start/Stop] [ô URL] [nút Play]**.
  - Ô giờ dạng `x/y` (vd `30/5` = làm 30 phút, nghỉ 5 phút); chỉ lưu khi hợp lệ (2 số nguyên dương).
  - `Enter` trong ô giờ hoặc ô URL = (khởi động lại) pha làm việc. Nút chuyển Start ⇄ Stop.
  - **Start không tự mở trình duyệt.** Chỉ nút Play mới mở nhạc (`playMusic`): URL nhập tay (chỉ nhận `http(s)://`) ưu tiên; URL rỗng → chọn ngẫu nhiên trong playlist của `musicGenre` đã lưu (mặc định `pomodoro`). Combobox thể loại đã bỏ khỏi UI (dữ liệu `musicGenre` vẫn còn).
- Tự chuyển làm↔nghỉ; thông báo Windows ở **10s, 5s và 0s** trước khi chuyển pha (0s = thông báo chuyển pha). Logic mốc ở `dueWarning` (mốc 10 và 5), set `warned` trong `ipc.ts`, reset khi start/stop/chuyển pha.
- Nhạc bằng trình duyệt mặc định (người dùng dùng Chrome), không nhúng player.

### 7.6 Cửa sổ
- Frameless, 480x560, luôn nổi, góc trên-phải (`workArea`). `TitleBar` (sticky đầu trang, `-webkit-app-region: drag`) để kéo; nút "–" thu nhỏ xuống taskbar. Tiêu đề luôn cố định khi cuộn nội dung.
- Không có nút đóng; đóng bằng taskbar / Alt+F4. Tray icon cần `assets/tray-icon.png` (**chưa có**, `createTray` bị bọc try/catch nên app vẫn chạy).

## 8. Giao diện & CSS

- Toàn bộ style ở `src/App.css` (biến `:root`: `--bg`, `--cyan`, `--magenta`, `--yellow`, `--danger`…). Theme tối neon/kính mờ ("futuristic").
- `backdrop-filter` trên `.collapsible-panel` tạo containing block cho phần tử `fixed` → **modal phải render ngoài panel** (fragment cùng cấp), xem `PushTaskPanel`.
- `.modal-overlay` z-index 200 > `.title-bar` z-index 100.
- Icon-button: `.icon-btn` + modifier `--done/--edit/--delete/--play`.

## 9. Test

- Vitest, môi trường jsdom, globals bật, setup `tests/setupTests.ts`. Chạy 1 file: `npx vitest run tests/src/PushTaskRow.test.tsx`.
- Hiện ~160 test, 22 file. Component test stub `window.electronAPI = {...}` (chỉ cần khai báo hàm được gọi).
- jsdom **không có layout/CSS file** → quy tắc CSS quan trọng (sticky, tỉ lệ cột 2/2/6/2, có class màu nhấp nháy) được kiểm bằng cách đọc thẳng text `src/App.css` (`tests/src/appCss.test.ts`). Sửa các rule này thì sửa test tương ứng.
- Mock `scrollHeight` bằng `Object.defineProperty` trên `HTMLTextAreaElement.prototype` (không dùng `vi.spyOn` getter — gây đệ quy vô hạn), nhớ `delete` sau test.
- Test theo thời gian: truyền `now` cố định vào component/hàm thuần thay vì fake timers. Test tích hợp Panel dùng `Date.now()` thật, chỉ assert regex lớp `flash-(red|green)` vì màu phụ thuộc giây chẵn/lẻ.
- Bẫy khi soạn test: giây thứ 14 của cửa sổ 15s vẫn là `yellow` (14 chẵn); nhiều task cùng `offset` nhỏ với `now` cố định sẽ đều "đã hết hạn" → nhấp nháy đỏ/xanh; dữ liệu `cycleStart: 1000` cho ra thời gian trôi qua khổng lồ.
- Không unit-test được: `main.ts`, `ipc.ts`, `preload.ts`, `notifications.ts`, single-instance lock, kéo cửa sổ, thông báo thật, clipboard thật → kiểm thủ công.

## 10. Bẫy đã gặp khi làm việc trong repo này

- Shell Bash tool: heredoc/`node -e` chứa nhiều dấu nháy lồng nhau hay lỗi "unexpected EOF" và **không chạy gì**; dùng công cụ Write/Edit cho file nhiều dòng.
- Git cảnh báo LF→CRLF (Windows) — vô hại.
- `PomodoroSettingsPanel` giữ text cục bộ; chỉ gọi `onChange` khi parse hợp lệ (nhập dở như `30/` không lưu).
- `PushTaskForm` nhận `editing` phải có **identity ổn định** (state trong Panel), nếu tạo object mới mỗi render thì `useEffect` sẽ ghi đè thứ người dùng đang gõ (Panel cập nhật mỗi giây).

## 11. Lịch sử branch (mỗi đợt yêu cầu = 1 branch, đã commit)

1. `feature_pomodoro_push_widget` – scaffold + logic + test ban đầu; sửa lỗi module type.
2. `feature_ui_revision` – kéo/thu nhỏ cửa sổ, icon, form gọn, x/y, theme futuristic.
3. `feature_push_pomodoro_refine` – sửa task, nhãn giờ, badge, Enter chạy đồng hồ, Play, màu theo pha, cảnh báo 10s/5s.
4. `feature_layout_swap_widen` – đổi thứ tự panel, hàng điều khiển 2/9/1, rộng 480px.
5. `feature_start_stop_flash_persist` – Start/Stop cùng hàng, form lên đầu, nhấp nháy, gia cố lưu trữ.
6. `feature_timeline_bar_alerts` – timeline + chấm đỏ, nhấp nháy theo thời gian, bỏ chu kỳ lặp, sticky title.
7. `feature_export_confirm_units` – nhãn phút/tiếng, tooltip, xác nhận xóa, Export.
8. `feature_overall_doc` – file này.
9. `feature_done_bottom_clear_form` – task Done xuống cuối danh sách; form thêm/sửa xóa trắng cả 2 ô sau Enter (và trống khi mở app).

(Các branch chưa được merge vào một nhánh chính; mỗi branch tách từ branch trước.)

## 12. Việc còn dang dở / ý tưởng

- Thiếu `assets/tray-icon.png` (tray không hiện).
- Chưa có đóng gói installer (`electron-builder` đã có trong devDependencies nhưng chưa cấu hình).
- Playlist mặc định trong `schema.ts` là URL mẫu, chưa xác nhận còn hoạt động.
- Người dùng từng hỏi về thông báo **to hơn** (phát file chuông riêng, `toastXml` với âm `Notification.Looping.Alarm`, nháy taskbar `flashFrame`) → chưa làm, đang chờ người dùng chọn cách.
- Trạng thái Pomodoro chưa lưu qua lần khởi động lại.
