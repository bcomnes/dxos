//
// Copyright 2023 DXOS.org
//

import { isTypedObject, Expando, TypedObject } from '@dxos/client/echo';

export const TEMPLATE_PLUGIN = 'dxos.org/plugin/template';

const TEMPLATE_ACTION = `${TEMPLATE_PLUGIN}/action`;

export enum TemplateAction {
  CREATE = `${TEMPLATE_ACTION}/create`,
}

export type TemplateProvides = {};

// TODO(burdon): Better way to detect?
export const isObject = (object: unknown): object is TypedObject => {
  return isTypedObject(object) && (object as Expando).type === 'template';
};