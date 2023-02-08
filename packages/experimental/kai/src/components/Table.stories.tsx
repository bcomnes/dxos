//
// Copyright 2023 DXOS.org
//

import React from 'react';
import { Column } from 'react-table';

import { EchoObject } from '@dxos/echo-schema';

import '@dxosTheme';

import { Contact } from '../proto';
import { Table } from './Table';

export default {
  component: Table
};

const columns: Column<EchoObject>[] = [];

const data: EchoObject[] = [new Contact()];

export const Default = () => <Table<EchoObject> columns={columns} data={data} />;
