//
// Copyright 2023 DXOS.org
//

import '@dxosTheme';

import { Minus, Plus } from '@phosphor-icons/react';
import React from 'react';

import { SmallPresence } from '@braneframe/plugin-space';
import { Surface, SurfaceProvider } from '@dxos/app-framework';
import { GraphBuilder, isGraphNode, type ActionArg } from '@dxos/app-graph';
import { buildGraph } from '@dxos/app-graph/testing';
import { PublicKey } from '@dxos/keys';
import { faker } from '@dxos/random';
import { Tooltip } from '@dxos/react-ui';
import { Mosaic } from '@dxos/react-ui-mosaic';
import { NavTree, translations, type TreeNode } from '@dxos/react-ui-navtree';
import { fineBlockSize } from '@dxos/react-ui-theme';
import { withTheme } from '@dxos/storybook-utils';

faker.seed(3);

const StorybookNavtreePresence = () => {};

const renderPresence = (node: TreeNode) => {
  if (isGraphNode(node)) {
    return <Surface role='presence' data={{ object: node.data }} />;
  }

  return null;
};

const defaultActions: ActionArg[] = [
  {
    id: 'remove',
    label: 'Remove',
    invoke: () => {},
    icon: () => <Minus />,
  },
  {
    id: 'add',
    label: 'Add',
    invoke: () => {},
    icon: () => <Plus />,
    properties: { disposition: 'toolbar' },
  },
];

const createGraph = () => {
  const content = [...Array(2)].map((_, i) => ({
    id: faker.string.hexadecimal({ length: 4 }).slice(2).toUpperCase(),
    label: faker.lorem.words(2),
    description: faker.lorem.sentence(),
    data: {
      viewers: [...Array(faker.number.int(4))].map(() => ({
        identityKey: PublicKey.random(),
      })),
    },
    actions: defaultActions,
    children: [...Array(2)].map((_, j) => ({
      id: faker.string.hexadecimal({ length: 4 }).slice(2).toUpperCase(),
      label: faker.lorem.words(2),
      description: faker.lorem.sentence(),
      data: {
        viewers: [...Array(faker.number.int(4))].map(() => ({
          identityKey: PublicKey.random(),
        })),
      },
      actions: defaultActions,
      children: [...Array(2)].map((_, k) => ({
        id: faker.string.hexadecimal({ length: 4 }).slice(2).toUpperCase(),
        label: faker.lorem.words(2),
        description: faker.lorem.sentence(),
        data: {
          viewers: [...Array(faker.number.int(4))].map(() => ({
            identityKey: PublicKey.random(),
          })),
        },
        actions: defaultActions,
      })),
    })),
  }));

  return buildGraph(new GraphBuilder().build(), 'tree', content);
};

const graph = createGraph();

export const Demo = {
  render: () => {
    return (
      <Tooltip.Provider>
        <Mosaic.Root>
          <SurfaceProvider
            value={{
              components: {
                // @ts-ignore
                presence: ({ data: { object } }: { data: { object: any } }) => {
                  return (
                    <SmallPresence size={2} members={object?.viewers ?? []} classNames={[fineBlockSize, 'is-6']} />
                  );
                },
              },
            }}
          >
            <NavTree node={graph.root} renderPresence={renderPresence} />
          </SurfaceProvider>
        </Mosaic.Root>
      </Tooltip.Provider>
    );
  },
};

// TODO(burdon): Move to react-ui-navtree?
export default {
  title: 'composer-app/StorybookNavtreePresence',
  component: StorybookNavtreePresence,
  decorators: [withTheme],
  parameters: { translations },
};
