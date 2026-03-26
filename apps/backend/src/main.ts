import { BasePath } from '@fpl/contracts/self-service';
import { JsonBodyMiddleware } from '@fpl/express-app';
import { Server } from '@fpl/fpl-express';
import { Application, ApplicationContext } from './app';
import { DataController } from './controllers/DataController';
import { FixtureController } from './controllers/FixtureController';
import { PlayerController } from './controllers/PlayerController';
import { TeamController } from './controllers/TeamController';

(async () => {
  try {
    const context = new ApplicationContext();
    const middlewares = [new JsonBodyMiddleware()];
    const controllers = [
      new DataController(context),
      new FixtureController(context),
      new PlayerController(context),
      new TeamController(context),
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
