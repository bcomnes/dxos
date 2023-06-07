//
// Copyright 2023 DXOS.org
//
// import React from 'react';

import React from 'react-router';

import { Document } from '@braneframe/types';
import { isTypedObject } from '@dxos/react-client';

import { definePlugin, PluginDefinition } from '../../framework';
import { MainAll, MainOne, OctokitProvider } from './components';

export const isDocument = (datum: unknown): datum is Document =>
  isTypedObject(datum) && Document.type.name === datum.__typename;

export const GithubMarkdownPlugin: PluginDefinition = definePlugin({
  meta: {
    id: 'dxos:GithubMarkdownPlugin',
  },
  provides: {
    context: (props) => <OctokitProvider {...props} />,
    component: (datum, role) => {
      if (role === 'main') {
        switch (true) {
          case isDocument(datum):
            return MainOne;
          default:
            return null;
        }
      } else {
        return null;
      }
    },
    components: {
      MainAll,
      MainOne,
    },
  },
});
