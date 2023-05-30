//
// Copyright 2023 DXOS.org
//

import {
  ToggleGroup as ToggleGroupPrimitive,
  ToggleGroupSingleProps,
  ToggleGroupMultipleProps,
  ToggleGroupItemProps as ToggleGroupItemPrimitiveProps,
  ToggleGroupItem as ToggleGroupItemPrimitive,
} from '@radix-ui/react-toggle-group';
import React, { forwardRef } from 'react';

import { Button, ButtonGroup, ButtonGroupProps } from './Button';

type ToggleGroupProps = Omit<ToggleGroupSingleProps, 'className'> | Omit<ToggleGroupMultipleProps, 'className'>;

const ToggleGroup = forwardRef<HTMLDivElement, ToggleGroupProps & ButtonGroupProps>(
  ({ classNames, children, ...props }, forwardedRef) => {
    return (
      <ToggleGroupPrimitive {...props} asChild ref={forwardedRef}>
        <ButtonGroup {...{ classNames, children }} />
      </ToggleGroupPrimitive>
    );
  },
);

type ToggleGroupItemProps = ToggleGroupItemPrimitiveProps;

const ToggleGroupItem = forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ value, disabled, ...props }, forwardedRef) => {
    return (
      <ToggleGroupItemPrimitive {...{ value, disabled }} asChild ref={forwardedRef}>
        <Button {...props} />
      </ToggleGroupItemPrimitive>
    );
  },
);

export { ToggleGroup, ToggleGroupItem };
export type { ToggleGroupProps, ToggleGroupItemProps };