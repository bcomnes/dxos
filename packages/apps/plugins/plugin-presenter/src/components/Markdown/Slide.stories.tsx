//
// Copyright 2023 DXOS.org
//

import '@dxosTheme';

import { Slide } from './Slide';
import { createSlide } from '../../testing';

export default {
  title: 'plugin-presenter/Slide',
  component: Slide,
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  args: {
    content: createSlide(),
  },
};
