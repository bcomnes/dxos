//
// Copyright 2022 DXOS.org
//

import '@dxosTheme';
import React from 'react';

import { useTranslation } from '@dxos/aurora';
import { mx } from '@dxos/aurora-theme';

import { Group } from '../Group';
import { AuthChoices, AuthChoicesProps } from './AuthChoices';

export default {
  component: AuthChoices,
  argTypes: {
    onCreate: { action: 'create' },
    onRecover: { action: 'recover' },
    onJoin: { action: 'join' }
  }
};
export const Default = {
  render: (args: AuthChoicesProps) => {
    const { t } = useTranslation('appkit');
    return (
      <Group
        label={{
          level: 1,
          className: 'mb-4 text-3xl',
          children: t('auth choices label')
        }}
        className={mx('p-5 rounded-xl max-w-md mx-auto my-4')}
      >
        <AuthChoices {...args} />
      </Group>
    );
  }
};
