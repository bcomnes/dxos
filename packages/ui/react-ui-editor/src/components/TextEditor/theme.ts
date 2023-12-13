//
// Copyright 2023 DXOS.org
//

import get from 'lodash.get';
import { type StyleSpec } from 'style-mod';

import { tailwindConfig, type TailwindConfig } from '@dxos/react-ui-theme';

const tokens: TailwindConfig['theme'] = tailwindConfig({}).theme;

/**
 * Minimal styles.
 * https://codemirror.net/examples/styling
 */
// TODO(burdon): If given a "theme" suffix, `__docgen` properties are added to the object.
export const defaultStyles: {
  [selector: string]: StyleSpec;
} = {
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    fontFamily: get(tokens, 'fontFamily.body', []).join(','),
    overflow: 'visible',
  },
  '.cm-tooltip': {
    backgroundColor: 'transparent',
    border: 'none',
  },
  '.cm-link': {
    color: get(tokens, 'extend.colors.primary.500'),
    textDecoration: 'underline',
  },
};
