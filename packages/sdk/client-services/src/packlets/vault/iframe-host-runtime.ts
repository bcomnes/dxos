//
// Copyright 2023 DXOS.org
//

import { Trigger } from '@dxos/async';
import { Config } from '@dxos/config';
import { log, logInfo } from '@dxos/log';
import { MemorySignalManager, MemorySignalManagerContext, WebsocketSignalManager } from '@dxos/messaging';
import { createWebRTCTransportFactory, NetworkManager } from '@dxos/network-manager';
import { createProtoRpcPeer, ProtoRpcPeer, RpcPort } from '@dxos/rpc';
import { MaybePromise } from '@dxos/util';

import { clientServiceBundle, ClientServices, ClientServicesHost } from '../services';

const LOCK_KEY = 'DXOS_RESOURCE_LOCK';

export type IFrameHostRuntimeParams = {
  configProvider: () => MaybePromise<Config>;
  appPort: RpcPort;
};

/**
 * Runs the client services in the main thread.
 *
 * Holds a lock over the client services such that only one instance can run at a time.
 * This should only be used when SharedWorker is not available.
 */
export class IFrameHostRuntime {
  private readonly _configProvider: () => MaybePromise<Config>;
  private readonly _transportFactory = createWebRTCTransportFactory();
  private readonly _ready = new Trigger<Error | undefined>();
  private readonly _getService: <Service>(
    find: (services: Partial<ClientServices>) => Service | undefined
  ) => Promise<Service>;

  private readonly _appPort: RpcPort;
  private _clientServices!: ClientServicesHost;
  private _clientRpc!: ProtoRpcPeer<ClientServices>;
  private _config!: Config;

  @logInfo
  public origin?: string;

  constructor({ configProvider, appPort }: IFrameHostRuntimeParams) {
    this._configProvider = configProvider;
    this._appPort = appPort;
    this._getService = async (find) => {
      const error = await this._ready.wait();
      if (error) {
        throw error;
      }

      const service = await find(this._clientServices.services);
      if (!service) {
        throw new Error('Service not found');
      }

      return service;
    };
  }

  async start() {
    log('starting...');
    try {
      this._config = await this._configProvider();
      const signalServer = this._config.get('runtime.services.signal.server');
      this._clientServices = new ClientServicesHost({
        lockKey: LOCK_KEY,
        config: this._config,
        networkManager: new NetworkManager({
          log: true,
          signalManager: signalServer
            ? new WebsocketSignalManager([signalServer])
            : new MemorySignalManager(new MemorySignalManagerContext()), // TODO(dmaretskyi): Inject this context.
          transportFactory: this._transportFactory
        })
      });

      this._clientRpc = createProtoRpcPeer({
        exposed: clientServiceBundle,
        handlers: {
          DataService: async () => await this._getService((services) => services.DataService),
          DevicesService: async () => await this._getService((services) => services.DevicesService),
          DevtoolsHost: async () => await this._getService((services) => services.DevtoolsHost),
          HaloInvitationsService: async () => await this._getService((services) => services.HaloInvitationsService),
          NetworkService: async () => await this._getService((services) => services.NetworkService),
          ProfileService: async () => await this._getService((services) => services.ProfileService),
          SpaceInvitationsService: async () => await this._getService((services) => services.SpaceInvitationsService),
          SpaceService: async () => await this._getService((services) => services.SpaceService),
          SpacesService: async () => await this._getService((services) => services.SpacesService),
          SystemService: async () => await this._getService((services) => services.SystemService),
          TracingService: async () => await this._getService((services) => services.TracingService)
        },
        port: this._appPort
      });

      await Promise.all([this._clientServices.open(), this._clientRpc.open()]);
      this._ready.wake(undefined);
      log('started');
    } catch (err: any) {
      this._ready.wake(err);
      log.catch(err);
    }
  }

  async stop() {
    log('stopping...');
    await this._clientRpc.close();
    await this._clientServices.close();
    log('stopped');
  }
}