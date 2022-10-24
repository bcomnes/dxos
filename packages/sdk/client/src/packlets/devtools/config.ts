//
// Copyright 2020 DXOS.org
//

import { GetConfigResponse } from '@dxos/protocols/proto/dxos/devtools';

import { DevtoolsServiceDependencies } from './devtools-context';

export const getConfig = (hook: DevtoolsServiceDependencies): GetConfigResponse => ({
  config: JSON.stringify(hook.config.values) // TODO(dmaretskyi): Serialize config with protobuf.
});
