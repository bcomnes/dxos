//
// Copyright 2022 DXOS.org
//

import Analytics from 'analytics-node';

import { invariant } from '@dxos/invariant';
import { log } from '@dxos/log';

import type { EventOptions, SegmentTelemetryOptions, PageOptions } from './types';
import { captureException } from '../sentry';

export class SegmentTelemetry {
  private _analytics?: Analytics;
  private _getTags: () => { [key: string]: string };

  constructor({ apiKey, batchSize, getTags }: SegmentTelemetryOptions) {
    this._getTags = getTags;
    try {
      invariant(apiKey, 'Key required to send telemetry');

      this._analytics = new Analytics(apiKey, {
        flushAt: batchSize,
        enable: true,
      });
    } catch (err) {
      log.catch('Failed to initialize telemetry', err);
    }
  }

  /**
   * Track a page view.
   */
  page({ installationId: anonymousId, identityId: userId, ...options }: PageOptions = {}) {
    if (!this._analytics) {
      log('Analytics not initialized', { action: 'page' });
      return;
    }

    try {
      this._analytics.page({
        ...options,
        userId,
        anonymousId: anonymousId!,
      });
    } catch (err) {
      log.catch('Failed to track page', err);
    }
  }

  /**
   * Track an event.
   */
  event({ installationId: anonymousId, identityId: userId, name: event, ...options }: EventOptions) {
    log('sending event to telemetry', { event, options, tags: this._getTags() });
    if (!this._analytics) {
      log('Analytics not initialized', { action: 'event' });
      return;
    }

    try {
      this._analytics.track({
        ...options,
        context: this._getTags(),
        userId,
        anonymousId: anonymousId!,
        event,
      });
    } catch (err) {
      log.catch('Failed to track event', err);
    }
  }

  /**
   * Flush the event queue.
   */
  async flush() {
    if (!this._analytics) {
      log('Analytics not initialized', { action: 'flush' });
      return;
    }

    try {
      await this._analytics.flush((err) => {
        captureException(err);
      });
    } catch (err) {
      log.catch('Failed to flush', err);
    }
  }
}
