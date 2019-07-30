import { Controller, Get, Global, Injectable, MiddlewareConsumer, Module, NestMiddleware, NestModule, Req, Res } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyReply, FastifyRequest } from 'fastify';

const prefix = process.argv[process.argv.length - 1];

/// This middleware will only run if we do not specifiy a global prefix.
@Injectable()
export class TestMiddleware implements NestMiddleware {

    use(req: any, res: any, next: () => void) {

        console.log('Test Middleware');
        req['user'] = { name: 'Test', role: 'Tester' };

        next();
    }
}

// If we set a prefix during npm start then we want to use setGlobalPrefix in order to show that middleware does not run. This means that we should not add /api to controller definition
// if we do not set prefix during npm start then we use should add /api to controller definition (just so we can keep /api/test url).
@Controller(`${prefix === '/api' ? '' : '/api/'}test`)
export class TestController {

    @Get()
    public test(@Req() req: FastifyRequest, @Res() reply: FastifyReply<any>) {

        // The user will be null if we used the global prefix
        const user = req.req['user'];

        reply.send({ user: user ? user : { name: 'No User' } });
    }

}

@Global()
@Module({
    controllers: [
        TestController
    ]
})
export class ApplicationModule implements NestModule {

    constructor() { }

    configure(consumer: MiddlewareConsumer): void | MiddlewareConsumer {
        consumer
            .apply(TestMiddleware)
            .forRoutes('*');
    }

}

async function bootstrap() {

    const app = await NestFactory.create<NestFastifyApplication>(ApplicationModule, new FastifyAdapter(), { bodyParser: true, cors: true });

    // Check for prefix passed in from npm start.
    if (prefix === '/api') {
        console.log(`Set Prefix: ${prefix}`);
        app.setGlobalPrefix('/api');
    }

    try {
        await app.listen(4300, '0.0.0.0');
    }
    catch (err) {
        console.log(err);
    }
}
bootstrap();
