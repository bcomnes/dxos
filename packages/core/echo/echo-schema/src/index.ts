//
// Copyright 2020 DXOS.org
//

import { AutomergeArray, AutomergeObject } from './automerge';
import { EchoDatabase } from './database';
import { Expando, TextObject, TypedObject } from './object';
import { linkDeferred } from './type-collection';

export * from './database';
export * from './hypergraph';
export * from './object';
export * from './proto';
export * from './query';
export * from './serializer';
export { TypeCollection } from './type-collection';
export * from './util';
export * from './automerge';
export { getGlobalAutomergePreference, setGlobalAutomergePreference } from './automerge-preference';

linkDeferred();

// TODO(wittjosiah): This ensures that typed objects are not proxied by deepsignal. Remove.
// https://github.com/luisherranz/deepsignal/issues/36
(globalThis as any)[EchoDatabase.name] = EchoDatabase;
(globalThis as any)[Expando.name] = Expando;
(globalThis as any)[TextObject.name] = TextObject;
(globalThis as any)[TypedObject.name] = TypedObject;
(globalThis as any)[AutomergeArray.name] = AutomergeArray;
(globalThis as any)[AutomergeObject.name] = AutomergeObject;
