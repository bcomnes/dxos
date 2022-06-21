//
// Copyright 2022 DXOS.org
//

import { GreetingCommandPlugin } from '@dxos/credentials';
import { PublicKey } from '@dxos/crypto';

import { InvitationFactory, OfflineInvitationClaimer } from '../invitations';

/**
 * Creates network protocol plugin that allows peers to claim offline invitations.
 * Plugin is intended to be used in data-party swarms.
 */
export function createOfflineInvitationPlugin (invitationFactory: InvitationFactory, peerId: PublicKey) {
  return new GreetingCommandPlugin(
    peerId.asBuffer(),
    OfflineInvitationClaimer.createOfflineInvitationClaimHandler(invitationFactory)
  );
}