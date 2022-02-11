//
// Copyright 2020 DXOS.org
//

import expect from 'expect';
import { it as test } from 'mocha';

import { createId } from '@dxos/crypto';

import { ModelFactory } from './model-factory';
import { TestModel } from './testing';

describe('model factory', () => {
  test('model constructor', async () => {
    const itemId = createId();

    // Create model.
    const modelFactory = new ModelFactory().registerModel(TestModel);
    const stateManager = modelFactory.createModel<TestModel>(TestModel.meta.type, itemId, {});
    expect(stateManager.model).toBeTruthy();
  });
});
