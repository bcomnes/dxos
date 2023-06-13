//
// Copyright 2023 DXOS.org
//

import { Dispatch, SetStateAction } from 'react';

import { Document } from '@braneframe/types';
import { Space } from '@dxos/client';

export type EditorViewState = 'editor' | 'preview';

export type MarkdownDocumentProps = {
  space: Space;
  document: Document;
  layout: 'standalone' | 'embedded';
  editorViewState: EditorViewState;
  setEditorViewState: Dispatch<SetStateAction<EditorViewState>>;
};

export type GhSharedProps = {
  owner: string;
  repo: string;
};

export type GhFileIdentifier = GhSharedProps & {
  ref: string;
  path: string;
};

export type GhIssueIdentifier = GhSharedProps & {
  issueNumber: number;
};

export type GhIdentifier = GhFileIdentifier | GhIssueIdentifier;

export type ExportViewState = 'create-pr' | 'pending' | 'response' | null;