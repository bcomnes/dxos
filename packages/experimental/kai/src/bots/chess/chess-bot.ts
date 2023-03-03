//
// Copyright 2023 DXOS.org
//

import { Game } from '@dxos/chess-app';
import { Subscription } from '@dxos/echo-schema';

import { Bot } from '../bot';

/**
 * Simple chess bot.
 */
export class ChessBot extends Bot {
  private readonly _player = 'b';
  private _subscription?: Subscription;

  override async onStart() {
    const query = this.db.query(Game.filter());
    this._subscription = query.subscribe(async (query) => {
      await Promise.all(
        query.objects.map(async (object) => {
          await this.onUpdate(object);
        })
      );
    });
  }

  override async onStop() {
    this._subscription?.();
  }

  // TODO(burdon): Only trigger if has player credential.
  // TODO(burdon): Trivial engine: https://github.com/josefjadrny/js-chess-engine
  async onUpdate(game: Game) {
    if (game.fen) {
      const { Chess } = await import('chess.js');
      const chess = new Chess();
      chess.loadPgn(game.fen);
      if (chess.turn() === this._player) {
        const moves = chess.moves();
        if (moves.length) {
          const move = moves[Math.floor(Math.random() * moves.length)];
          chess.move(move);
          game.fen = chess.pgn();
        }
      }
    }
  }
}