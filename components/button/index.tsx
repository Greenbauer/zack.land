import { Button as BSButton } from 'react-bootstrap';

import styles from './button.module.scss';

type ButtonType = {
  children: JSX.Element | string;
  type?: string;
  href?: string;
  target?: '_blank' | '_self';
  disabled?: boolean;
};

export default function Button({
  children,
  type,
  href,
  target,
  disabled,
}: ButtonType) {
  return (
    <div className={styles.button}>
      {type === 'submit' ? (
        <BSButton type={type} disabled={disabled}>
          {children}
        </BSButton>
      ) : (
        <a
          href={href}
          target={target}
          rel={target === '_blank' ? 'noreferrer' : undefined}
        >
          {children}
        </a>
      )}
    </div>
  );
}
