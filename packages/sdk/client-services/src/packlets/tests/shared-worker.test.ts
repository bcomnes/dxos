//
// Copyright 2022 DXOS.org
//

import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { sleep } from '@dxos/async';
import { Client, ClientServicesProxy, fromIFrame } from '@dxos/client';
import { Config } from '@dxos/config';
import { createLinkedPorts } from '@dxos/rpc';
import { describe, test, afterTest } from '@dxos/test';
import { MaybePromise } from '@dxos/util';

import { TestBuilder } from '../testing';
import { IFrameProxyRuntime, WorkerRuntime } from '../vault';

chai.use(chaiAsPromised);

const setup = (getConfig: () => MaybePromise<Config>) => {
  const workerRuntime = new WorkerRuntime(getConfig);

  const systemPorts = createLinkedPorts();
  const workerProxyPorts = createLinkedPorts();
  const proxyWindowPorts = createLinkedPorts();
  const shellPorts = createLinkedPorts();
  void workerRuntime.createSession({
    systemPort: systemPorts[1],
    appPort: workerProxyPorts[1],
    shellPort: shellPorts[1]
  });
  const clientProxy = new IFrameProxyRuntime({
    systemPort: systemPorts[0],
    windowAppPort: proxyWindowPorts[0],
    workerAppPort: workerProxyPorts[0],
    shellPort: shellPorts[0]
  });
  const client = new Client({
    services: new ClientServicesProxy(proxyWindowPorts[1])
  });

  return { workerRuntime, clientProxy, client };
};

describe('Shared worker', () => {
  test('client connects to the worker', async () => {
    const { workerRuntime, clientProxy, client } = setup(() => new Config({}));

    await Promise.all([workerRuntime.start(), clientProxy.open('*'), client.initialize()]);

    await client.halo.createIdentity();
  });

  test('initialization errors get propagated to the client', async () => {
    const { workerRuntime, clientProxy, client } = setup(async () => {
      await sleep(1);
      throw new Error('Test error');
    });

    const promise = Promise.all([
      workerRuntime.start().catch(() => {}), // This error should be propagated to client.initialize() call.
      clientProxy.open('*')
    ]);

    await expect(client.initialize()).to.be.rejectedWith('Test error');

    await promise;
  });

  test('host can be initialized after client', async () => {
    const { workerRuntime, clientProxy, client } = setup(async () => {
      await sleep(5);
      return new Config({});
    });

    await Promise.all([workerRuntime.start(), clientProxy.open('*'), client.initialize()]);

    await client.halo.createIdentity();
  });

  // TODO(burdon): Browser-only.
  test.skip('creates client with remote iframe', async () => {
    const testBuilder = new TestBuilder();

    const client = new Client({
      services: fromIFrame(testBuilder.config)
    });

    await client.initialize();
    afterTest(() => client.destroy());
    expect(client.initialized).to.be.true;
  });
});