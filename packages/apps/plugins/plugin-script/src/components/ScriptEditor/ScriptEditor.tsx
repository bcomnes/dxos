//
// Copyright 2023 DXOS.org
//

import MonacoEditor, { type Monaco, useMonaco } from '@monaco-editor/react';
import get from 'lodash.get';
import { editor } from 'monaco-editor';
import React, { useEffect } from 'react';

import { getTextContent, type TextObject } from '@dxos/client/echo';
import { type ThemeMode } from '@dxos/react-ui';
import { mx, tailwindConfig } from '@dxos/react-ui-theme';

import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import IStandaloneEditorConstructionOptions = editor.IStandaloneEditorConstructionOptions;
// @ts-ignore
import ThemeLight from './themes/GitHubLight.json?json';

export type ScriptEditorProps = {
  id: string;
  source?: TextObject;
  language?: string;
  themeMode?: ThemeMode;
  className?: string;
  onBeforeMount?: (monaco: Monaco) => void;
};

/**
 * Monaco script editor.
 * https://www.npmjs.com/package/@monaco-editor
 * https://microsoft.github.io/monaco-editor/playground.html
 */
export const ScriptEditor = ({ id, source, language, themeMode, className, onBeforeMount }: ScriptEditorProps) => {
  // https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneEditorConstructionOptions.html
  const options: IStandaloneEditorConstructionOptions = {
    cursorStyle: 'line-thin',
    fontSize: 14,
    fontFamily: get(tailwindConfig({}).theme, 'fontFamily.mono', []).join(','),
    fontLigatures: true,
    language,
    minimap: {
      enabled: false,
    },
    readOnly: false,
    renderLineHighlight: 'none',
    scrollbar: {
      horizontalScrollbarSize: 4,
      verticalScrollbarSize: 4,
      useShadows: false,
    },
    tabSize: 2,
  };

  // https://www.npmjs.com/package/@monaco-editor/react#monaco-instance
  const monaco = useMonaco();
  useEffect(() => {
    // https://github.com/brijeshb42/monaco-themes/tree/master/themes
    monaco?.editor.defineTheme('light', ThemeLight);
    monaco?.editor.setTheme(themeMode === 'dark' ? 'vs-dark' : 'light');
  }, [monaco, themeMode]);

  // Connect editor model.
  const handleMount = (editor: IStandaloneCodeEditor, _: Monaco) => {};

  // https://www.npmjs.com/package/@monaco-editor/react#props
  return (
    <MonacoEditor
      key={id}
      className={mx('grow overflow-hidden', className)}
      theme={themeMode === 'dark' ? 'vs-dark' : 'light'}
      loading={<div />}
      options={options}
      language={language}
      path={`${id}.tsx`} // Required to support JSX.
      value={source ? getTextContent(source) : undefined}
      beforeMount={onBeforeMount}
      onMount={handleMount}
    />
  );
};
