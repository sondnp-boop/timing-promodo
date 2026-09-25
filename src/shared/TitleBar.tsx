import { getElectronApi } from '../api/electronApi';

export function TitleBar() {
  return (
    <div className="title-bar">
      <span className="title-bar__name">POMODORO // PUSH</span>
      <button
        type="button"
        className="title-bar__minimize"
        aria-label="Thu nhỏ cửa sổ"
        onClick={() => getElectronApi().minimizeWindow()}
      >
        &#8211;
      </button>
    </div>
  );
}
