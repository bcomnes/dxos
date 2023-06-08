//
// Copyright 2023 DXOS.org
//

import { CaretDown, CaretRight, DotsThreeVertical, Placeholder } from '@phosphor-icons/react';
import React, { useEffect, useRef, useState } from 'react';

import { useSidebar, useTranslation, TreeItem, Tooltip, DropdownMenu, Button } from '@dxos/aurora';
import { defaultDisabled, getSize } from '@dxos/aurora-theme';
import { SpaceState } from '@dxos/client';
import { useMulticastObservable } from '@dxos/react-async';
import { Space, observer } from '@dxos/react-client';

import { GraphNode } from '../GraphPlugin';
import { TreeView } from '../TreeViewPlugin/TreeView';
import { getSpaceDisplayName } from './getSpaceDisplayName';

export const FullSpaceTreeItem = observer(({ data: item }: { data: GraphNode<Space> }) => {
  const space = item.data!;
  const [primaryAction, ...actions] = item.actions ?? [];
  const { t } = useTranslation('composer');
  const hasActiveDocument = false;
  const spaceSate = useMulticastObservable(space.state);
  const disabled = spaceSate !== SpaceState.READY;
  const error = spaceSate === SpaceState.ERROR;
  const { sidebarOpen } = useSidebar();

  const suppressNextTooltip = useRef<boolean>(false);
  const [optionsTooltipOpen, setOptionsTooltipOpen] = useState(false);
  const [optionsMenuOpen, setOpetionsMenuOpen] = useState(false);

  const [open, setOpen] = useState(true /* todo(thure): Open if document within is selected */);

  useEffect(() => {
    // todo(thure): Open if document within is selected
  }, []);

  const spaceDisplayName = getSpaceDisplayName(t, space, disabled);

  const OpenTriggerIcon = open ? CaretDown : CaretRight;

  return (
    <TreeItem.Root
      collapsible
      open={!disabled && open}
      onOpenChange={(nextOpen) => setOpen(disabled ? false : nextOpen)}
      classNames={['mbe-1', disabled && defaultDisabled]}
      {...(disabled && { 'aria-disabled': true })}
    >
      <div role='none' className='flex mis-1 items-start'>
        <TreeItem.OpenTrigger disabled={disabled} {...(!sidebarOpen && { tabIndex: -1 })}>
          <OpenTriggerIcon
            {...(hasActiveDocument && !open
              ? { weight: 'fill', className: 'text-primary-500 dark:text-primary-300' }
              : {})}
          />
        </TreeItem.OpenTrigger>
        <TreeItem.Heading
          classNames={[
            'grow break-words pis-1 pbs-2.5 pointer-fine:pbs-1.5 text-sm font-medium',
            error && 'text-error-700 dark:text-error-300',
            !disabled && 'cursor-pointer',
          ]}
          onClick={() => setOpen(!open)}
        >
          {spaceDisplayName}
        </TreeItem.Heading>
        <Tooltip.Root
          open={optionsTooltipOpen}
          onOpenChange={(nextOpen) => {
            if (suppressNextTooltip.current) {
              setOptionsTooltipOpen(false);
              suppressNextTooltip.current = false;
            } else {
              setOptionsTooltipOpen(nextOpen);
            }
          }}
        >
          <Tooltip.Portal>
            <Tooltip.Content classNames='z-[31]' side='bottom'>
              {t('space options label')}
              <Tooltip.Arrow />
            </Tooltip.Content>
          </Tooltip.Portal>
          <DropdownMenu.Root
            {...{
              open: optionsMenuOpen,
              onOpenChange: (nextOpen: boolean) => {
                if (!nextOpen) {
                  suppressNextTooltip.current = true;
                }
                return setOpetionsMenuOpen(nextOpen);
              },
            }}
          >
            <DropdownMenu.Trigger asChild>
              <Tooltip.Trigger asChild>
                <Button
                  variant='ghost'
                  data-testid='composer.openSpaceMenu'
                  classNames='shrink-0 pli-2 pointer-fine:pli-1'
                  {...(!sidebarOpen && { tabIndex: -1 })}
                >
                  <DotsThreeVertical className={getSize(4)} />
                </Button>
              </Tooltip.Trigger>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content classNames='z-[31]'>
                {actions.map((action) => (
                  <DropdownMenu.Item key={action.id} onClick={action.invoke} classNames='gap-2'>
                    <Placeholder className={getSize(4)} />
                    <span>{action.label}</span>
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Arrow />
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </Tooltip.Root>
        {primaryAction && (
          <Tooltip.Root>
            <Tooltip.Portal>
              <Tooltip.Content side='bottom' classNames='z-[31]'>
                {primaryAction.label}
                <Tooltip.Arrow />
              </Tooltip.Content>
            </Tooltip.Portal>
            <Tooltip.Trigger asChild>
              <Button
                variant='ghost'
                data-testid='composer.createDocument'
                classNames='shrink-0 pli-2 pointer-fine:pli-1'
                onClick={primaryAction.invoke}
                {...(!sidebarOpen && { tabIndex: -1 })}
              >
                <span className='sr-only'>{primaryAction.label}</span>
                <Placeholder className={getSize(4)} />
              </Button>
            </Tooltip.Trigger>
          </Tooltip.Root>
        )}
      </div>
      <TreeItem.Body>
        <TreeView items={item.children} />
      </TreeItem.Body>
    </TreeItem.Root>
  );
});
