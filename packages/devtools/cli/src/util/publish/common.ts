//
// Copyright 2023 DXOS.org
//

import { ux } from '@oclif/core';
import { CID } from 'ipfs-http-client';

import type { ConfigProto } from '@dxos/config';

export type PackageModule = NonNullable<NonNullable<ConfigProto['package']>['modules']>[0];
export type PackageRepo = NonNullable<NonNullable<ConfigProto['package']>['repos']>[0];

export type Logger = (message: string, ...args: any[]) => void;

export const mapModules = (modules: PackageModule[]) => {
  return modules.map((mod) => ({
    key: mod.name,
    bundle: CID.decode(mod.bundle!).toString(),
  }));
};

export const printModules = (modules: PackageModule[], flags = {}) => {
  ux.table(
    mapModules(modules),
    {
      key: {
        header: 'name',
      },
      bundle: {
        header: 'bundle',
      },
    },
    {
      ...flags,
    },
  );
};
