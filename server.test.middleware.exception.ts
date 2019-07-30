import { Controller, Get, Global, Injectable, MiddlewareConsumer, Module, NestMiddleware, NestModule, Req, Res, UnauthorizedException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyReply, FastifyRequest } from 'fastify';

const enableNoCache = process.argv[process.argv.length - 1] === 'nocache';

@Injectable()
export class TestMiddleware implements NestMiddleware {

    use(req: any, res: any, next: () => void) {

        // The will crash the app
        throw new UnauthorizedException();
    }
}

@Injectable()
export class CacheMiddleware implements NestMiddleware {

    use(req: any, res: any, next: () => void) {

        console.log('no cache');

        res
            .header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
            .header('Expires', '-1')
            .header('Pragma', 'no-cache');

        next();

    }
}

@Controller(`/api/test`)
export class TestController {

    @Get()
    public test(@Req() req: FastifyRequest, @Res() reply: FastifyReply<any>) {

        // We should not get here becaus the middleware exception will crash the app.

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


        if (enableNoCache) {

            // Test middleware that causes "response.status is not a function" without throwing an exception 
            consumer
                .apply(CacheMiddleware)
                .forRoutes('*');

        } else {

            // Test middle that causes "response.status is not a function" with throwing an exception
            consumer
                .apply(TestMiddleware)
                .forRoutes('*');
        }

    }

}

async function bootstrap() {

    const app = await NestFactory.create<NestFastifyApplication>(ApplicationModule, new FastifyAdapter(), { bodyParser: true, cors: true });

    try {
        await app.listen(4300, '0.0.0.0');
    }
    catch (err) {
        console.log(err);
    }
}
bootstrap();
