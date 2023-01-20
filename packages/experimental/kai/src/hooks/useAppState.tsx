//
// Copyright 2022 DXOS.org
//

import React, { Context, Dispatch, SetStateAction, FC, ReactNode, createContext, useContext, useState } from 'react';

// TODO(burdon): Merge options.

// TODO(burdon): Use reducer?
// https://beta.reactjs.org/learn/scaling-up-with-reducer-and-context

export type AppState = {
  // Debug info.
  debug?: boolean;
  // Auto-create data.
  demo?: boolean;
  // UX state.
  showSidebar?: boolean;
};

export type AppStateContextType = [AppState, Dispatch<SetStateAction<AppState>>];

export const AppStateContext: Context<AppStateContextType | undefined> = createContext<AppStateContextType | undefined>(
  undefined
);

export const AppStateProvider: FC<{ children: ReactNode; value?: AppState }> = ({ children, value }) => {
  const [state, setState] = useState<AppState>(value ?? { showSidebar: true });
  return <AppStateContext.Provider value={[state, setState]}>{children}</AppStateContext.Provider>;
};

export const useAppState = (): AppState => {
  const [state] = useContext(AppStateContext)!;
  return state;
};

export const useAppStateDispatch = (): Dispatch<SetStateAction<AppState>> => {
  const [, setState] = useContext(AppStateContext)!;
  return setState;
};