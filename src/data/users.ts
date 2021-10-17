import { APIUser } from 'discord-api-types';
import { KVObject } from './utils';
import { RestEndpointMethodTypes } from '@octokit/rest';

/**
 * Provider for an identity.
 */
export enum IdentityProvider {
  Discord = 'discord',
  GitHub = 'github',
}

export class User extends KVObject {
  static prefix = 'user';

  /**
   * The user's unique ID.
   * This value should match the suffix of the user's KV key.
   */
  id: string;
  /**
   * Randomly-generated session key.
   * Can be rotated to invalidate existing sessions.
   */
  sessionKey: string;
  /**
   * Whether or not this user is currently onboarding.
   * Will be set to `true` when the user has not yet completed the onboarding process.
   */
  isOnboarding: boolean;

  /**
   * Whether or not this user should be shown any guild management-related UI.
   */
  isManaging: boolean;
  /**
   * Whether or not this user should be shown any guild joining-related UI.
   */
  isJoining: boolean;

  /**
   * List of identities associated with this user.
   */
  identities: UserIdentityData[];

  constructor({
    id,
    sessionKey,
    isOnboarding,
    isManaging,
    isJoining,
    identities,
  }: Pick<
    User,
    | 'id'
    | 'isOnboarding'
    | 'isManaging'
    | 'isJoining'
    | 'identities'
    | 'sessionKey'
  >) {
    super();
    this.id = id;
    this.sessionKey = sessionKey;
    this.isOnboarding = isOnboarding;
    this.isManaging = isManaging;
    this.isJoining = isJoining;
    this.identities = identities;
  }

  /**
   * Parse all the user's identities into their corresponding classes.
   */
  getIdentities(): UserIdentity[] {
    return this.identities.map(
      (identity) => new IdentityTypeMap[identity.provider](identity),
    );
  }

  getIdentityData(
    provider: IdentityProvider,
    id: string,
  ): UserIdentityData | null {
    return (
      this.identities.find(
        (identity) => identity.provider === provider && identity.id === id,
      ) || null
    );
  }
}

/**
 * Base data type for all identity providers.
 */
interface UserIdentityData {
  /**
   * A unique ID for this identity.
   */
  id: string;

  /**
   * The identity provider for this identity.
   */
  provider: IdentityProvider;

  /**
   * Time at which this identity was last verified.
   */
  verifiedAt: Date;

  /**
   * Arbitrary data attached to this identity, to be used by the identity provider's class.
   */
  data: {
    [key: string]: any;
  };
}

/**
 * Base type for identity provider classes.
 */
interface UserIdentity {
  /**
   * Turn the instance back into the original data format.
   */
  toData(): UserIdentityData;
}

/**
 * A constructor, capable of taking a user identity object and turning it into it's respective class.
 */
interface UserIdentityConstructor {
  /**
   * The class constructor.
   */
  new (data: UserIdentityData): UserIdentity;
}

class DiscordUserIdentity implements UserIdentity {
  id: string;
  provider: IdentityProvider;
  verifiedAt: Date;
  data: APIUser;

  constructor({ id, provider, verifiedAt, data }: UserIdentityData) {
    this.id = id;
    this.provider = provider;
    this.verifiedAt = verifiedAt;
    this.data = data as APIUser;
  }

  toData(): UserIdentityData {
    return {
      id: this.id,
      provider: this.provider,
      verifiedAt: this.verifiedAt,
      data: this.data,
    };
  }
}

class GitHubUserIdentity implements UserIdentity {
  id: string;
  provider: IdentityProvider;
  verifiedAt: Date;
  data: RestEndpointMethodTypes['users']['getAuthenticated']['response']['data'];

  constructor({ id, provider, verifiedAt, data }: UserIdentityData) {
    this.id = id;
    this.provider = provider;
    this.verifiedAt = verifiedAt;
    this.data =
      data as RestEndpointMethodTypes['users']['getAuthenticated']['response']['data'];
  }

  toData(): UserIdentityData {
    return {
      id: this.id,
      provider: this.provider,
      verifiedAt: this.verifiedAt,
      data: this.data,
    };
  }
}

const IdentityTypeMap: {
  [identityType in IdentityProvider]: UserIdentityConstructor;
} = {
  [IdentityProvider.Discord]: DiscordUserIdentity,
  [IdentityProvider.GitHub]: GitHubUserIdentity,
};
