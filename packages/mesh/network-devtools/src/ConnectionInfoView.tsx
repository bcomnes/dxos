//
// Copyright 2021 DXOS.org
//

import ArrowBackIos from '@mui/icons-material/ArrowBackIos';
import { IconButton, List, ListItem } from '@mui/material';
import React from 'react';

import { ConnectionInfo } from '@dxos/network-manager';
import { CopyText } from '@dxos/react-components';

export interface ConnectionInfoViewProps {
  connectionInfo: ConnectionInfo,
  onReturn?: () => void,
}

// TODO(burdon): Convert to table.
export const ConnectionInfoView = ({ connectionInfo, onReturn }: ConnectionInfoViewProps) => (
  <div>
    <div>State: {connectionInfo.state}</div>
    <div>Session id: <CopyText value={connectionInfo.sessionId.toHex()} /></div>
    <div>Remote peer id: <CopyText value={connectionInfo.remotePeerId.toHex()} /></div>
    <div>Transport: {connectionInfo.transport}</div>
    <div>Protocol extensions: {connectionInfo.protocolExtensions.join(',')}</div>
    <hr/>
    <div>
      Connection events:
    </div>
    <List>
      {connectionInfo.events.map(event => (
        <ListItem key={JSON.stringify(event)}>
          {JSON.stringify(event)}
        </ListItem>
      ))}
    </List>
    {onReturn && (
      <IconButton size='small' onClick={onReturn} title='Back' style={{ borderRadius: 5 }}>
        <ArrowBackIos />
        Back
      </IconButton>)
    }
  </div>
);
