//
// Copyright 2021 DXOS.org
//

import assert from 'node:assert';
import { inspect } from 'node:util';

import {
  asyncTimeout,
  Event,
  EventSubscriptions,
  Observable,
  observableError,
  ObservableProvider,
  Trigger
} from '@dxos/async';
import {
  AuthenticatingInvitationObservable,
  CancellableInvitationObservable,
  ClientServicesProvider,
  HaloInvitationsProxy,
  InvitationsOptions
} from '@dxos/client-services';
import { inspectObject } from '@dxos/debug';
import { ResultSet } from '@dxos/echo-db';
import { ApiError } from '@dxos/errors';
import { PublicKey } from '@dxos/keys';
import { log } from '@dxos/log';
import { Contact, Identity as DeprecatedIdentity } from '@dxos/protocols/proto/dxos/client';
import { Identity, Invitation } from '@dxos/protocols/proto/dxos/client/services';
import { Credential, Presentation } from '@dxos/protocols/proto/dxos/halo/credentials';
import { DeviceInfo } from '@dxos/protocols/proto/dxos/halo/credentials/identity';
import { humanize } from '@dxos/util';

type CreateIdentityOptions = {
  publicKey?: PublicKey;
  secretKey?: PublicKey;
  displayName?: string;
};

// TODO(wittjosiah): This is kind of cumbersome.
type DeviceEvents = {
  onUpdate(devices: DeviceInfo[]): void;
  onError(error?: Error): void;
};

/**
 * TODO(burdon): Public API (move comments here).
 */
export interface Halo {
  get identity(): Identity | undefined;
  get invitations(): CancellableInvitationObservable[];
  createIdentity(options?: CreateIdentityOptions): Promise<Identity>;
  subscribeToIdentity(callback: (profile: Identity) => void): void;

  queryDevices(): Observable<DeviceEvents, DeviceInfo[]>;
  queryContacts(): ResultSet<Contact>;

  createInvitation(): CancellableInvitationObservable;
  removeInvitation(id: string): void;
  acceptInvitation(invitation: Invitation): AuthenticatingInvitationObservable;
}

const THROW_TIMEOUT_ERROR_AFTER = 3000;

// TODO(wittjosiah): Remove this.
const convertIdentity = (identity?: DeprecatedIdentity): Identity | undefined => {
  if (!identity) {
    return identity;
  }

  const { identityKey, haloSpace: spaceKey, deviceKey, ...profile } = identity;

  return {
    identityKey,
    spaceKey,
    deviceKey,
    profile
  };
};

export class HaloProxy implements Halo {
  private readonly _subscriptions = new EventSubscriptions();
  private readonly _contactsChanged = new Event(); // TODO(burdon): Remove (use subscription).
  public readonly invitationsUpdate = new Event<CancellableInvitationObservable | void>();
  public readonly identityChanged = new Event(); // TODO(burdon): Move into Identity object.

  private _invitations: CancellableInvitationObservable[] = [];
  private _invitationProxy?: HaloInvitationsProxy;

  private _identity?: Identity;
  private _contacts: Contact[] = [];

  // prettier-ignore
  constructor(
    private readonly _serviceProvider: ClientServicesProvider
  ) {}

  [inspect.custom]() {
    return inspectObject(this);
  }

  // TODO(burdon): Include deviceId.
  toJSON() {
    return {
      key: this._identity?.identityKey.truncate()
    };
  }

  /**
   * User identity info.
   */
  get identity(): Identity | undefined {
    return this._identity;
  }

  get invitations() {
    return this._invitations;
  }

  // TODO(burdon): Standardize isOpen, etc.
  get opened() {
    return this._invitationProxy !== undefined;
  }

  /**
   * Allocate resources and set-up internal subscriptions.
   */
  async open() {
    const gotIdentity = this.identityChanged.waitForCount(1);
    // const gotContacts = this._contactsChanged.waitForCount(1);

    assert(this._serviceProvider.services.HaloInvitationsService, 'HaloInvitationsService not available');
    // TODO(burdon): ???
    this._invitationProxy = new HaloInvitationsProxy(this._serviceProvider.services.HaloInvitationsService);

    assert(this._serviceProvider.services.IdentityService, 'IdentityService not available');
    const profileStream = this._serviceProvider.services.IdentityService.subscribeIdentity();
    profileStream.subscribe((data) => {
      this._identity = convertIdentity(data.identity);
      this.identityChanged.emit();
    });

    this._subscriptions.add(() => profileStream.close());

    // const contactsStream = this._serviceProvider.services.HaloService.subscribeContacts();
    // contactsStream.subscribe(data => {
    //   this._contacts = data.contacts as SpaceMember[];
    //   this._contactsChanged.emit();
    // });

    // this._subscriptions.add(() => contactsStream.close());

    await Promise.all([gotIdentity]);
  }

  /**
   * Destroy the instance and clean-up subscriptions.
   */
  async close() {
    this._subscriptions.clear();
    this._invitationProxy = undefined;
    this._identity = undefined;
    this._contacts = [];
  }

  /**
   * @deprecated
   */
  subscribeToIdentity(callback: (profile: Identity) => void): () => void {
    return this.identityChanged.on(() => callback(this._identity!));
  }

  /**
   * Create Identity.
   * Add Identity key if public and secret key are provided.
   * Then initializes profile with given display name.
   * If no public and secret key are provided it relies on keyring to contain an identity key.
   * @returns User profile info.
   */
  async createIdentity({ publicKey, secretKey, displayName }: CreateIdentityOptions = {}): Promise<Identity> {
    assert(this._serviceProvider.services.IdentityService, 'IdentityService not available');
    // TODO(burdon): Rename createIdentity?
    this._identity = convertIdentity(
      await this._serviceProvider.services.IdentityService.createIdentity({
        publicKey: publicKey?.asUint8Array(),
        secretKey: secretKey?.asUint8Array(),
        displayName
      })
    )!;

    return this._identity;
  }

  /**
   * Query for contacts. Contacts represent member keys across all known Spaces.
   */
  queryContacts(): ResultSet<Contact> {
    return new ResultSet(this._contactsChanged, () => this._contacts);
  }

  /**
   * Get set of authenticated devices.
   */
  queryDevices() {
    // TODO(wittjosiah): Try to make this easier to use for simple cases like this.
    const observable = new ObservableProvider<DeviceEvents, DeviceInfo[]>();
    assert(this._serviceProvider.services.DevicesService, 'DeviceService not available');
    const stream = this._serviceProvider.services.DevicesService.queryDevices();

    // TODO(wittjosiah): Does stream need to be closed?
    stream.subscribe(
      (data) => {
        const devices =
          data.devices?.map((device) => ({
            publicKey: device.deviceKey,
            displayName: humanize(device.deviceKey)
          })) ?? [];
        observable.setValue(devices);
        observable.callback.onUpdate(devices);
      },
      (err) => {
        if (err) {
          observableError(observable, err);
        }
      }
    );

    return observable;
  }

  /**
   * Get Halo credentials for the current user.
   */
  queryCredentials({ ids, type }: { ids?: PublicKey[]; type?: string } = {}) {
    if (!this._identity) {
      throw new ApiError('Identity is not available.');
    }
    if (!this._serviceProvider.services.SpacesService) {
      throw new ApiError('SpacesService is not available.');
    }
    const stream = this._serviceProvider.services.SpacesService.queryCredentials({
      spaceKey: this._identity.spaceKey!
    });
    this._subscriptions.add(() => stream.close());

    const observable = new ObservableProvider<
      { onUpdate: (credentials: Credential[]) => void; onError: (error?: Error) => void },
      Credential[]
    >();
    const credentials: Credential[] = [];

    stream.subscribe(
      (credential) => {
        credentials.push(credential);
        const newCredentials = credentials
          .filter((c) => !ids || (c.id && ids.some((id) => id.equals(c.id!))))
          .filter((c) => !type || c.subject.assertion['@type'] === type);
        if (
          newCredentials.length !== observable.value?.length ||
          !newCredentials.every(
            (credential, index) =>
              credential.id && observable.value![index] && credential.id.equals(observable.value![index].id!)
          )
        ) {
          observable.setValue(newCredentials);
          observable.callback.onUpdate(newCredentials);
        }
      },
      (err) => {
        if (err) {
          observableError(observable, err);
        }
      }
    );

    return observable;
  }

  /**
   * Initiates device invitation.
   */
  createInvitation(options?: InvitationsOptions) {
    if (!this.opened) {
      throw new ApiError('Client not open.');
    }

    log('create invitation', options);
    const invitation = this._invitationProxy!.createInvitation(undefined, options);
    this._invitations = [...this._invitations, invitation];

    const unsubscribe = invitation.subscribe({
      onConnecting: () => {
        this.invitationsUpdate.emit(invitation);
        unsubscribe();
      },
      onCancelled: () => {
        unsubscribe();
      },
      onSuccess: () => {
        unsubscribe();
      },
      onError: function (err: any): void {
        unsubscribe();
      }
    });

    return invitation;
  }

  /**
   * Removes device invitation.
   */
  removeInvitation(id: string) {
    log('remove invitation', { id });
    const index = this._invitations.findIndex((invitation) => invitation.invitation?.invitationId === id);
    void this._invitations[index]?.cancel();
    this._invitations = [...this._invitations.slice(0, index), ...this._invitations.slice(index + 1)];
    this.invitationsUpdate.emit();
  }

  /**
   * Initiates accepting invitation.
   */
  acceptInvitation(invitation: Invitation, options?: InvitationsOptions) {
    if (!this.opened) {
      throw new ApiError('Client not open.');
    }

    log('accept invitation', options);
    return this._invitationProxy!.acceptInvitation(invitation, options);
  }

  /**
   * Write credentials to halo profile.
   */
  async writeCredentials(credentials: Credential[]) {
    if (!this._identity) {
      throw new ApiError('Identity is not available.');
    }
    if (!this._serviceProvider.services.SpacesService) {
      throw new ApiError('SpacesService is not available.');
    }
    return this._serviceProvider.services.SpacesService.writeCredentials({
      spaceKey: this._identity.spaceKey!,
      credentials
    });
  }

  /**
   * Present Credentials.
   */
  async presentCredentials({ ids, nonce }: { ids: PublicKey[]; nonce?: Uint8Array }): Promise<Presentation> {
    if (!this._serviceProvider.services.IdentityService) {
      throw new ApiError('IdentityService is not available.');
    }
    const trigger = new Trigger<Credential[]>();
    this.queryCredentials({ ids }).subscribe({
      onUpdate: (credentials) => {
        if (
          credentials.every((credential) => ids.some((id) => id.equals(credential.id!))) &&
          ids.every((id) => credentials.some((credential) => id.equals(credential.id!)))
        ) {
          trigger.wake(credentials);
        }
      },
      onError: (err) => {
        log.catch(err);
      }
    });

    const credentials = await asyncTimeout(
      trigger.wait(),
      THROW_TIMEOUT_ERROR_AFTER,
      new ApiError('Timeout while waiting for credentials')
    );
    return this._serviceProvider.services.IdentityService!.signPresentation({
      presentation: {
        credentials
      },
      nonce
    });
  }
}
