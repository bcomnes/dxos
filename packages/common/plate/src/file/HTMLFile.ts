//
// Copyright 2022 DXOS.org
//

import prettier from 'prettier';

import { File } from './File';

export class HTMLFile extends File<string> {
  protected override async serialize(): Promise<string> {
    const content = this.content?.toString() ?? '';
    const formatted = prettier.format(content, {
      parser: 'html'
    });
    return formatted;
  }
}