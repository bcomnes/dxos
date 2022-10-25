//
// Copyright 2022 DXOS.org
//

import { Event } from '@dxos/async';
import { discoveryKey, sha256 } from '@dxos/crypto';
import { PublicKey } from '@dxos/keys';
import { log } from '@dxos/log';
import { Protocol } from '@dxos/mesh-protocol';
import { MMSTTopology, NetworkManager, Plugin } from '@dxos/network-manager';
import { PresencePlugin } from '@dxos/protocol-plugin-presence';

import { AuthPlugin, AuthVerifier, AuthProvider } from './auth-plugin';

export interface SwarmIdentity {
  peerKey: PublicKey;
  credentialProvider: AuthProvider;
  credentialAuthenticator: AuthVerifier;
}

/**
 * Manages hypercore protocol stream creation and joining swarms.
 */
export class SpaceProtocol {
  private readonly _presence: PresencePlugin;
  private readonly _authenticator: AuthPlugin;
  private readonly _discoveryKey: PublicKey;
  private readonly _peerId: PublicKey;

  readonly authenticationFailed: Event;

  constructor(
    private readonly _networkManager: NetworkManager,
    topic: PublicKey,
    private readonly _swarmIdentity: SwarmIdentity,
    private readonly _plugins: Plugin[] = []
  ) {
    this._presence = new PresencePlugin(this._swarmIdentity.peerKey.asBuffer());
    this._authenticator = new AuthPlugin(this._swarmIdentity, []); // Enabled for all protocol extensions.
    this.authenticationFailed = this._authenticator.authenticationFailed;
    this._discoveryKey = PublicKey.from(discoveryKey(sha256(topic.toHex())));
    this._peerId = PublicKey.from(
      discoveryKey(sha256(this._swarmIdentity.peerKey.toHex()))
    );
  }

  async start() {
    log('starting...');
    // TODO(burdon): Document why empty buffer.
    const credentials = await this._swarmIdentity.credentialProvider(
      Buffer.from('')
    );

    // TODO(burdon): Move to config (with sensible defaults).
    const topologyConfig = {
      originateConnections: 4,
      maxPeers: 10,
      sampleSize: 20
    };

    await this._networkManager.joinProtocolSwarm({
      protocol: ({ channel, initiator }) =>
        this._createProtocol(credentials, { channel, initiator }),
      peerId: this._peerId,
      topic: this._discoveryKey,
      presence: this._presence,
      topology: new MMSTTopology(topologyConfig),
      label: `Protocol swarm: ${this._discoveryKey}`
    });
    log('started');
  }

  async stop() {
    log('stopping...');
    await this._networkManager.leaveProtocolSwarm(this._discoveryKey);
    log('stopped');
  }

  private _createProtocol(
    credentials: Uint8Array | undefined,
    { initiator, channel }: { initiator: boolean; channel: Buffer }
  ) {
    const plugins: Plugin[] = [
      this._presence,
      this._authenticator,
      ...this._plugins
    ];

    const protocol = new Protocol({
      streamOptions: {
        live: true
      },

      discoveryKey: channel,
      discoveryToPublicKey: (discoveryKey: any) => {
        if (!PublicKey.from(discoveryKey).equals(this._discoveryKey)) {
          return undefined;
        }

        // TODO(dmaretskyi): Why does this do side effects?
        // TODO(burdon): Remove need for external closure (ie, pass object to this callback).
        protocol.setContext({ topic: this._discoveryKey.toHex() });
        // TODO(burdon): Inconsistent use of toHex vs asBuffer?
        return this._discoveryKey.asBuffer();
      },

      userSession: {
        // TODO(burdon): See deprecated `protocolFactory` in HALO.
        peerId: this._peerId.toHex(),
        // TODO(telackey): This ought to be the CredentialsProvider itself, so that fresh credentials can be minted.
        credentials: credentials
          ? Buffer.from(credentials).toString('base64')
          : undefined
      },

      initiator
    });

    protocol
      .setExtensions(plugins.map((plugin) => plugin.createExtension()))
      .init();

    return protocol;
  }

  get peers() {
    return this._presence.peers.map((peer) => PublicKey.from(peer));
  }
}