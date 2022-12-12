import { Menubar2, ProfileMenu, Separator, SpaceMenu, SpacesLink } from '@dxos/react-uikit';
import React from 'react';
import { PublicKey } from '@dxos/client';
import { useIdentity, useSpace } from '@dxos/react-client';
import { Main } from '../components/Main';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

export const SpaceLayout = () => {
  const { space: spaceHex } = useParams();
  const spaceKey = PublicKey.safeFrom(spaceHex);
  const space = spaceKey && useSpace(spaceKey);
  const identity = useIdentity();
  const navigate = useNavigate();
  return (
    <>
      <Menubar2>
        <SpacesLink onClickGoToSpaces={() => navigate('..')} />
        <Separator className='grow' />
        {space && <SpaceMenu space={space} onClickManageSpace={() => navigate('settings')} />}
        {identity && <ProfileMenu profile={identity} />}
      </Menubar2>
      <Main>
        <Outlet context={{ space }} />
      </Main>
    </>
  );
};
