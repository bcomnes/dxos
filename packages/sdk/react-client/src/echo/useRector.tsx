//
// Copyright 2022 DXOS.org
//

import React, { FC, ReactElement, createContext, useContext, useEffect, useReducer, useState } from 'react';

import { useClient } from '../client';

export type UseRector = {
  render: (component: ReactElement<any, any> | null) => ReactElement<any, any> | null;
};

export type ReactorProps = {
  onChange?: () => void;
};

/**
 * Hook to update components that access the database when modified.
 */
export const useReactor = (opts?: ReactorProps): UseRector => {
  const client = useClient();
  const observer = client.echo.dbRouter.createAccessObserver();
  const [, forceUpdate] = useReducer((tick) => tick + 1, 0);

  // Create subscription.
  const [handle] = useState(() =>
    client.echo.dbRouter.createSubscription(() => {
      forceUpdate();
      opts?.onChange?.(); // TODO(burdon): Pass in modified objects.
    })
  );

  // Cancel subscription on exit.
  useEffect(() => {
    if (!handle.subscribed) {
      console.error('bug: subscription lost'); // TODO(dmaretskyi): Fix this.
    }

    return () => handle.unsubscribe();
  }, []);

  // Watch accessed objects.
  return {
    render: (component: ReactElement<any, any> | null) => {
      try {
        return component;
      } finally {
        // Trigger to update components if modified.
        handle.update([...observer.accessed]);
      }
    }
  };
};

const ReactorContext = createContext({});

/**
 * Reactive HOC.
 */
export const withReactor = <P,>(component: FC<P>): FC<P> => {
  return (props: P) => {
    const { render } = useReactor({
      onChange: () => {
        // console.log('UPDATED');
      }
    });

    return <ReactorContext.Provider value={{}}>{render(component(props))}</ReactorContext.Provider>;
  };
};

// TODO(burdon): Allow caller to subscribe to changes?
export const useReactorContext = (opts?: ReactorProps) => {
  useContext(ReactorContext);
  useEffect(() => {}, [opts]);
};