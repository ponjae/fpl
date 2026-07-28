import { BasePath } from '@fpl/contracts/self-service';
import { JsonBodyMiddleware } from '@fpl/express-app';
import { Server } from '@fpl/fpl-express';
import { Application, ApplicationContext } from './app';
import { DataController } from './controllers/DataController';
import { FixtureController } from './controllers/FixtureController';
import { GameweekController } from './controllers/GameweekController';
import { PlayerController } from './controllers/PlayerController';
import { SquadController } from './controllers/SquadController';
import { TeamController } from './controllers/TeamController';
import { TransferController } from './controllers/TransferController';

(async () => {
  try {
    const context = new ApplicationContext();
    const middlewares = [new JsonBodyMiddleware()];
    const controllers = [
      new DataController(context),
      new FixtureController(context),
      // GameweekController registers '/gameweeks/current' before '/gameweeks/:id'
      // (guaranteed by method declaration order in the class).
      new GameweekController(context),
      new PlayerController(context),
      new SquadController(context),
      new TeamController(context),
      new TransferController(context),
    ];

    const app = new Application(controllers, middlewares).create(context, {
      basepath: BasePath,
    });

    const port = await Server.start(app);
    console.info(`node: ${process.version}`);
    console.info(`Server is listening on port: ${port}`);
  } catch (error) {
    console.error('Could not start, reason:', error);
  }
})();
