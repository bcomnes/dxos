//
// Copyright 2023 DXOS.org
//

import React, { type FC, useEffect, useMemo, useRef, useState } from 'react';

import { filterObjects, type SearchResult } from '@braneframe/plugin-search';
import { type Schema, type Space, type TypedObject } from '@dxos/client/echo';
import { createSvgContext, Grid, SVG, SVGContextProvider, Zoom } from '@dxos/gem-core';
import { Graph, GraphForceProjector, type GraphLayoutNode, Markers } from '@dxos/gem-spore';
import { mx } from '@dxos/react-ui-theme';

import { EchoGraphModel } from './graph-model';

type Slots = {
  root?: { className?: string };
  grid?: { className?: string };
};

const slots: Slots = {};

const colors = [
  '[&>circle]:!fill-black-300   [&>circle]:!stroke-black-600',
  '[&>circle]:!fill-slate-300   [&>circle]:!stroke-slate-600',
  '[&>circle]:!fill-green-300   [&>circle]:!stroke-green-600',
  '[&>circle]:!fill-sky-300     [&>circle]:!stroke-sky-600',
  '[&>circle]:!fill-cyan-300    [&>circle]:!stroke-cyan-600',
  '[&>circle]:!fill-rose-300    [&>circle]:!stroke-rose-600',
  '[&>circle]:!fill-purple-300  [&>circle]:!stroke-purple-600',
  '[&>circle]:!fill-orange-300  [&>circle]:!stroke-orange-600',
  '[&>circle]:!fill-teal-300    [&>circle]:!stroke-teal-600',
  '[&>circle]:!fill-indigo-300  [&>circle]:!stroke-indigo-600',
];

export const Explorer: FC<{ space: Space; match?: RegExp }> = ({ space, match }) => {
  const model = useMemo(() => (space ? new EchoGraphModel().open(space) : undefined), [space]);

  const context = createSvgContext();
  const projector = useMemo(
    () =>
      new GraphForceProjector<TypedObject>(context, {
        forces: {
          manyBody: {
            strength: -100,
          },
          link: {
            distance: 180,
          },
          radial: {
            radius: 200,
            strength: 0.05,
          },
        },
        attributes: {
          radius: (node: GraphLayoutNode<TypedObject>) => (node.data?.__typename === 'dxos.schema.Schema' ? 24 : 12),
        },
      }),
    [],
  );

  const filteredRef = useRef<SearchResult[]>();
  filteredRef.current = filterObjects(model?.objects ?? [], match);
  useEffect(() => {
    void projector.start();
  }, [match]);

  const [colorMap] = useState(new Map<Schema, string>());

  return (
    <SVGContextProvider context={context}>
      <SVG className={slots?.root?.className}>
        <Markers arrowSize={6} />
        <Grid className={slots?.grid?.className} />
        <Zoom extent={[1 / 2, 4]}>
          <Graph
            model={model}
            projector={projector}
            drag
            arrows
            labels={{
              text: (node: GraphLayoutNode<TypedObject>) => {
                if (filteredRef.current?.length && !filteredRef.current.some((object) => object.id === node.data?.id)) {
                  return undefined;
                }

                // TODO(burdon): Use schema.
                return node.data?.label ?? node.data?.title ?? node.data?.name ?? node.data?.id.slice(0, 8);
              },
            }}
            attributes={{
              node: (node: GraphLayoutNode<TypedObject>) => {
                let className: string | undefined;
                const schema = node.data?.__schema;
                if (schema) {
                  className = colorMap.get(schema);
                  if (!className) {
                    className = colors[colorMap.size % colors.length];
                    colorMap.set(schema, className);
                  }
                }

                const selected = filteredRef.current?.some((object) => object.id === node.data?.id);
                return {
                  class: mx(
                    filteredRef.current?.length
                      ? selected
                        ? [className]
                        : '[&>text]:!fill-neutral-300'
                      : ['[&>text]:!fill-neutral-700', className],
                  ),
                };
              },
              link: () => ({
                class: '[&>path]:!stroke-neutral-300',
              }),
            }}
          />
        </Zoom>
      </SVG>
    </SVGContextProvider>
  );
};