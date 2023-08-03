//
// Copyright 2023 DXOS.org
//

import { test } from '@playwright/test';
import { expect } from 'chai';
import { platform } from 'node:os';
import waitForExpect from 'wait-for-expect';

import { AppManager } from './app-manager';

const perfomInviation = async (host: AppManager, guest: AppManager) => {
  const invitationCode = await host.shell.createSpaceInvitation();
  const authCode = await host.shell.getAuthCode();
  await guest.joinSpace();
  await guest.shell.acceptSpaceInvitation(invitationCode);
  await guest.shell.authenticate(authCode);
  await host.shell.closeShell();
};

test.describe('Basic test', () => {
  let host: AppManager;
  let guest: AppManager;

  test.beforeEach(async ({ browser, browserName }) => {
    test.skip(browserName === 'firefox');
    test.skip(browserName === 'webkit' && platform() !== 'darwin');

    host = new AppManager(browser, true);
    guest = new AppManager(browser, true);

    await host.init();
    await guest.init();
  });

  // TODO(wittjosiah): WebRTC only available in chromium browser for testing currently.
  //   https://github.com/microsoft/playwright/issues/2973
  test.describe('Collaboration tests', () => {
    test('guest joins host’s space', async () => {
      test.slow();

      await host.shell.createIdentity('host');
      await guest.shell.createIdentity('guest');
      await host.createDocument();
      await perfomInviation(host, guest);

      await host.page.getByRole('link').last().click();
      await host.waitForMarkdownTextbox();
      await waitForExpect(async () => {
        expect(await host.page.url()).to.include(await guest.page.url());
      });

      const hostLinks = await Promise.all([host.getDocumentLinks().nth(0).getAttribute('data-itemid')]);
      const guestLinks = await Promise.all([guest.getDocumentLinks().nth(0).getAttribute('data-itemid')]);
      expect(hostLinks[0]).to.equal(guestLinks[0]);
    });

    test('host and guest can see each others’ presence when same document is in focus', async () => {
      test.slow();

      await host.shell.createIdentity('host');
      await guest.shell.createIdentity('guest');
      await host.createDocument();
      await perfomInviation(host, guest);

      await Promise.all([
        host.getDocumentLinks().nth(0).click(),
        guest.getDocumentLinks().nth(0).click(),
        host.waitForMarkdownTextbox(),
        guest.waitForMarkdownTextbox(),
      ]);
      await waitForExpect(async () => {
        expect(await host.getCollaboratorCursors().count()).to.equal(0);
        expect(await guest.getCollaboratorCursors().count()).to.equal(0);
      });
      await host.getMarkdownTextbox().focus();
      await guest.getMarkdownTextbox().focus();
      await waitForExpect(async () => {
        expect(await host.getCollaboratorCursors().first().textContent()).to.equal('guest');
        expect(await guest.getCollaboratorCursors().first().textContent()).to.equal('host');
      });
    });

    test('host and guest can see each others’ changes in same document', async () => {
      test.slow();

      await host.shell.createIdentity('host');
      await guest.shell.createIdentity('guest');
      await host.createDocument();
      await perfomInviation(host, guest);

      const parts = [
        'Lorem ipsum dolor sit amet,',
        ' consectetur adipiscing elit,',
        ' sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      ];
      const allParts = parts.join('');

      await Promise.all([
        host.getDocumentLinks().nth(0).click(),
        guest.getDocumentLinks().nth(0).click(),
        host.waitForMarkdownTextbox(),
        guest.waitForMarkdownTextbox(),
      ]);
      await host.getMarkdownTextbox().type(parts[0]);
      await guest.getMarkdownTextbox().getByText(parts[0]).waitFor();
      await guest.getMarkdownTextbox().press('End');
      await guest.getMarkdownTextbox().type(parts[1]);
      await host.getMarkdownTextbox().getByText([parts[0], parts[1]].join('')).waitFor();
      await host.getMarkdownTextbox().press('End');
      await host.getMarkdownTextbox().type(parts[2]);
      await guest.getMarkdownTextbox().getByText(allParts).waitFor();
      // TODO(thure): Just pressing 'End' was not enough to move the cursor to the end of the test string on my local device; validate that these presses work in CI.
      await Promise.all([host.getMarkdownTextbox().press('End'), guest.getMarkdownTextbox().press('End')]);
      await Promise.all([host.getMarkdownTextbox().press('ArrowDown'), guest.getMarkdownTextbox().press('ArrowDown')]);
      // await Promise.all([host.page.pause(), guest.page.pause()]);
      await host.getMarkdownTextbox().getByText(allParts).waitFor();
      const hostContent = await host.getMarkdownActiveLineText();
      const guestContent = await guest.getMarkdownActiveLineText();
      expect(hostContent).to.equal(guestContent);
    });
  });
});