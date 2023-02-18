import Link from 'next/link';
import { Link as RSLink } from 'react-scroll';

import { toMenuId } from '@/utils/menu';

import Arrow from './arrow';
import styles from './menu.module.scss';

export type MenuItem = {
  name: string;
  path?: string;
};

type MenuType = {
  items: MenuItem[];
  useArrow?: boolean;
};

export default function Menu({ items = [], useArrow = false }: MenuType) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.menu}>
        <ul>
          {items.map((item) => {
            const { name, path } = item;

            return (
              <li key={name}>
                <h3>
                  {!!path ? (
                    <Link href={path}>{name}</Link>
                  ) : (
                    <RSLink
                      activeClass="active"
                      to={toMenuId(name)}
                      delay={0}
                      offset={0}
                      spy
                      hashSpy
                    >
                      {name}
                    </RSLink>
                  )}
                </h3>
              </li>
            );
          })}
        </ul>
        {useArrow && <Arrow />}
      </div>
    </div>
  );
}
