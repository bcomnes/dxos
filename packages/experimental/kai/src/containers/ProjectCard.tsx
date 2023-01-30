//
// Copyright 2022 DXOS.org
//

import { Archive, ArrowsOut, User } from 'phosphor-react';
import React, { FC } from 'react';

import { id } from '@dxos/echo-schema';
import { withReactor } from '@dxos/react-client';
import { getSize } from '@dxos/react-components';

import { Input, CardRow, Button } from '../components';
import { Project, Task } from '../proto';
import { DraggableTaskList } from './DraggableTaskList';

export const ProjectCard: FC<{ project: Project }> = withReactor(({ project }) => {
  const handleExpand = () => {};

  // TODO(burdon): Pass in Task1, Task2.
  const handleDrag = (active: number, over: number) => {
    const task = project.tasks[active];
    project.tasks.splice(active, 1);
    project.tasks.splice(over, 0, task);
  };

  return (
    <div className='flex flex-col pb-2'>
      {/* Header */}
      <div className='flex p-2 pb-0 items-center'>
        <div className='flex flex-shrink-0 justify-center w-8 mr-1'>
          <Archive className={getSize(6)} />
        </div>
        <Input
          className='w-full p-1 text-lg'
          spellCheck={false}
          value={project.title}
          onChange={(value) => (project.title = value)}
          placeholder='Project name'
        />
        <Button className='mr-1 text-gray-500' onClick={handleExpand}>
          <ArrowsOut className={getSize(5)} />
        </Button>
      </div>

      {/* Tasks */}
      <div>
        <DraggableTaskList
          tasks={project.tasks}
          onCreate={(task: Task) => {
            project.tasks.push(task);
          }}
          onDrag={handleDrag}
        />
      </div>

      {/* Contacts */}
      {project.team?.length > 0 && (
        <div className='pt-2'>
          <h2 className='pl-3 text-xs'>Team</h2>
          <div className='p-1 pt-1'>
            {project.team?.map((contact) => (
              <CardRow key={contact[id]} sidebar={<User />} header={<div>{contact.name}</div>} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});