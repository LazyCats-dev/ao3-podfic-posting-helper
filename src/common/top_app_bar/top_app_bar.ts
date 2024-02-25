import styles from './top_app_bar.scss';

import {css, unsafeCSS} from 'lit';

export const TOP_APP_BAR_STYLES = [
  unsafeCSS(styles),
  css`
    .app-bar {
      --md-icon-button-icon-color: #fff;
      position: absolute;
    }

    .header-icon {
      margin-left: 4px;
    }

    .mdc-top-app-bar {
      z-index: 7;
    }
  `,
];
