import styles from './header.module.scss';

type MenuButtonType = {
  onClick: () => void;
  isActive: boolean;
};

export default function MenuButton({ onClick, isActive }: MenuButtonType) {
  const setStyle = isActive
    ? styles.menuButtonBarsActive
    : styles.menuButtonBars;

  return (
    <div className={styles.menuButton} onClick={onClick}>
      <div className={setStyle}>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
