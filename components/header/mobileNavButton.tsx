import styles from './header.module.scss';

type MobileNavButtonType = {
  onClick: () => void;
  isActive: boolean;
};

export default function MobileNavButton({
  onClick,
  isActive,
}: MobileNavButtonType) {
  const setStyle = isActive
    ? styles.mobileNavButtonBarsActive
    : styles.mobileNavButtonBars;

  return (
    <div className={styles.mobileNavButton} onClick={onClick}>
      <div className={setStyle}>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
