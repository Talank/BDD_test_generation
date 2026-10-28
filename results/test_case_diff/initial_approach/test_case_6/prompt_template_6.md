# ROLE
You write cucumber-js step definitions from Gherkin steps.

The Gherkin says what to test. Your job is to wire each gherkin step to code that already exists. Never add, drop,
or improve test coverage.

Each step's text becomes a pattern. cucumber-js matches it at runtime. A pattern
is written once and shared by every scenario that uses it.

# RULES
1. **Only call what is listed.** Functions from DSL CATALOG, members on `this`
   from WORLD, types from PARAMETER TYPES. Never invent a name. Plain JavaScript
   and the Cucumber DataTable API are fine. Reach the DSL the same way the
   existing step definitions do.
2. **Use `async function`, never an arrow function.** An arrow breaks `this`.
   Await every DSL call.
3. **One binding per pattern.** Two steps that differ only in a value —
   `"admin"` vs `"editor"` — are one binding with one parameter..
4. **Never redefine a registered step.** If your pattern would match a step in
   REGISTERED STEPS, skip it and write `// EXISTS: <step text>`. But "looks
   similar" is not "matches" — if unsure, write the binding.
5. **Keep the step text as written.** Copy it exactly, replacing only what
   varies. Never reword a step or add quotes to make it easier to parameterize.
   - quoted text → `{string}`
   - a number → `{int}` or `{float}`
   - a bare word that varies → a PARAMETER TYPE, or `{word}`
   - anything else → leave as plain text

   `{string}` only matches quoted text. Using it on a bare word means the step
   never matches at runtime.
6. **Pass values through.** Captured parameters go straight to the DSL call —
   never paste a literal from the step text. Data tables and doc strings arrive
   as the last parameter; hand them over whole. Use CONSTANTS only for values the
   step implies but does not state.
7. **Keep bodies thin.** If one DSL function does the step, that call is the
   whole body. Pick the most specific one.
8. **Share values through `this`.** Steps do not share local variables. A step
   that produces a value a later step needs assigns it to `this`
   (`this.orderId = await ...`). A step that needs it reads it from `this`.
9. **Say when you cannot map it.** Do not guess.
   - no DSL function fits      → `// UNMAPPED: <step text>`
   - a needed value is missing → `// UNMAPPED (missing value): <step text>`
   - two functions fit equally → pick the more specific; if still tied,
                                 `// UNMAPPED (ambiguous): <step text>`


# THE RUNNER HANDLES THESE — YOU DO NOT

- **Scenario Outline.** Write ONE binding. The runner replaces each
  `<placeholder>` with its Examples value before matching, so your pattern must
  match the replaced value, not the `<placeholder>` text. A quoted Examples cell
  → `{string}`, a number → `{int}`, a bare word → `{word}` or a PARAMETER TYPE.
  A spot that holds a `<placeholder>` always varies, so it is never plain text.
  Do not write one binding per row.
- **Background.** Its steps are normal steps. Define any that are missing.
- **@tags.** Emit nothing for them.
- **Hooks.** Do not write hooks unless EXISTING STEP DEFINITIONS already has one.

# OUTPUT
Return a complete, runnable step-definitions file:


---
# DSL CATALOG  (the only functions you may call)
```ts
// ===== PUBLIC SURFACE INDEX (auto-extracted) =====
// src/modules/index.ts
//   - makeDependencies({ logger, queryBus, commandBus, eventBus, }: { logger: FastifyBaseLogger; queryBus: QueryBus; commandBus: CommandBus; eventBus: EventBus; })
// src/modules/user/database/user.repository.ts
//   - userRepository({ db, userMapper, repositoryBase, }: Dependencies)
// src/server/di/index.ts
//   - async di(fastify: FastifyInstance)
// src/server/di/util.ts
//   - formatName(fileName: string)
// src/server/index.ts
//   - async createServer(fastify: FastifyInstance)
// src/server/plugins/gql.ts
//   - async getGQL()
// src/shared/app/app-request-context.ts
//   - getRequestId()
// src/shared/db/postgres.ts
//   - getDb()
//   - async closeDbConnection()
//   - async withTransaction(fn: (tx: postgres.TransactionSql) => Promise<T>,)
//   - joinConditions(xs: (postgres.PendingQuery<postgres.Row[]> | false | undefined | null | '')[], joiner?: postgres.PendingQuery<postgres.Row[]>,)
// tests/support/server.ts
//   - async buildApp()

// ---- src/modules/index.ts ----
import { asValue } from 'awilix';
import type { FastifyBaseLogger } from 'fastify';
import type postgres from 'postgres';
import type { CommandBus, EventBus, QueryBus } from '#src/shared/cqrs/bus.types.ts';
import { getDb } from '#src/shared/db/postgres.ts';
import type { RepositoryPort } from '#src/shared/db/repository.port.ts';
import {
  SqlRepositoryBase,
  type SqlRepositoryBaseProps,
} from '#src/shared/db/sql-repository.base.ts';

type SqlBaseProps<E = { id: string }, D = Record<string, unknown>> = Omit<
  SqlRepositoryBaseProps<E, D>,
  'logger' | 'db'
>;

declare global {
  export interface Dependencies {
    logger: FastifyBaseLogger;
    db: ReturnType<typeof postgres>;
    repositoryBase: <E extends { id: string }, D extends Record<string, unknown>>(
      props: SqlBaseProps<E, D>,
    ) => RepositoryPort<E>;
    queryBus: QueryBus;
    commandBus: CommandBus;
    eventBus: EventBus;
  }
}

export function makeDependencies({
  logger,
  queryBus,
  commandBus,
  eventBus,
}: {
  logger: FastifyBaseLogger;
  queryBus: QueryBus;
  commandBus: CommandBus;
  eventBus: EventBus;
}) {
  const db = getDb();
  const repositoryBaseFn = <E extends { id: string }, D extends Record<string, unknown>>({
    tableName,
    mapper,
  }: SqlBaseProps<E, D>) =>
    SqlRepositoryBase<E, D>({
      logger,
      db,
      tableName,
      mapper,
    });
  return {
    logger: asValue(logger),
    db: asValue(db),
    repositoryBase: asValue(repositoryBaseFn),
    queryBus: asValue(queryBus),
    commandBus: asValue(commandBus),
    eventBus: asValue(eventBus),
  };
}

// ---- src/modules/user/database/user.repository.port.ts ----
import type { UserEntity } from '#src/modules/user/domain/user.types.ts';
import type {
  Paginated,
  PaginatedQueryParams,
  RepositoryPort,
} from '#src/shared/db/repository.port.ts';

export interface UserFilters {
  country?: string;
  postalCode?: string;
  street?: string;
}

export interface UserRepository extends RepositoryPort<UserEntity> {
  findOneByEmail(email: string): Promise<UserEntity | undefined>;
  findAllPaginatedFiltered(
    params: PaginatedQueryParams,
    filters: UserFilters,
  ): Promise<Paginated<UserEntity>>;
}

// ---- src/modules/user/database/user.repository.ts ----
import { type Static, Type } from 'typebox';
import type {
  UserFilters,
  UserRepository,
} from '#src/modules/user/database/user.repository.port.ts';
import { type UserEntity, UserRoles } from '#src/modules/user/domain/user.types.ts';
import { joinConditions } from '#src/shared/db/postgres.ts';
import type { Paginated, PaginatedQueryParams } from '#src/shared/db/repository.port.ts';

export const userSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  email: Type.String({ format: 'email' }),
  country: Type.String({ minLength: 1, maxLength: 255 }),
  postalCode: Type.String({ minLength: 1, maxLength: 20 }),
  street: Type.String({ minLength: 1, maxLength: 255 }),
  role: Type.Enum(UserRoles),
});
export type UserModel = Static<typeof userSchema>;

export default function userRepository({
  db,
  userMapper,
  repositoryBase,
}: Dependencies): UserRepository {
  const tableName = 'users';
  return {
    ...repositoryBase({ tableName, mapper: userMapper }),

    async findOneByEmail(email: string): Promise<UserEntity | undefined> {
      const [user]: [UserModel?] =
        await db`SELECT * FROM ${db(tableName)} WHERE email = ${email} LIMIT 1`;
      return user ? userMapper.toDomain(user) : undefined;
    },

    async findAllPaginatedFiltered(
      params: PaginatedQueryParams,
      filters: UserFilters,
    ): Promise<Paginated<UserEntity>> {
      const conditions = [
        filters.country && db`country = ${filters.country}`,
        filters.street && db`street = ${filters.street}`,
        filters.postalCode && db`"postalCode" = ${filters.postalCode}`,
      ];
      const [result]: { rows: UserModel[] | null; count: number }[] = await db`
        SELECT
          (SELECT COUNT(*) FROM users ${joinConditions(conditions)}) as count,
          (SELECT json_agg(t.*) FROM
            (SELECT * FROM users ${joinConditions(conditions)} LIMIT ${params.limit} OFFSET ${params.offset})
          AS t) AS rows
      `;
      return {
        data: result?.rows?.map((user) => userMapper.toDomain(user)) ?? [],
        count: Number(result?.count ?? 0),
        limit: params.limit,
        page: params.page,
      };
    },
  };
}

// ---- src/modules/user/domain/user.types.ts ----
// Properties that are needed for a user creation
export interface CreateUserProps {
  email: string;
  country: string;
  postalCode: string;
  street: string;
}

/**
 * `UserRoles` is both a value object (for runtime enum-like access, e.g. `UserRoles.admin`)
 * and a type (union of `'admin' | 'moderator' | 'guest'`).
 * This "const object + derived type" pattern is the idiomatic TypeScript replacement for enums.
 */
export const UserRoles = {
  admin: 'admin',
  moderator: 'moderator',
  guest: 'guest',
} as const;
export type UserRoles = (typeof UserRoles)[keyof typeof UserRoles];

export interface UserEntity {
  id: string;
  email: string;
  country: string;
  postalCode: string;
  street: string;
  role: UserRoles;
  createdAt: Date;
  updatedAt: Date;
}

// ---- src/server/di/index.ts ----
import path from 'node:path';
import { diContainer, fastifyAwilixPlugin } from '@fastify/awilix';
import { asFunction, Lifetime } from 'awilix';
import type { FastifyInstance } from 'fastify';
import { makeDependencies } from '#src/modules/index.ts';
import { formatName } from '#src/server/di/util.ts';

export async function di(fastify: FastifyInstance) {
  diContainer.register({
    ...makeDependencies({
      logger: fastify.log,
      queryBus: fastify.queryBus,
      commandBus: fastify.commandBus,
      eventBus: fastify.eventBus,
    }),
  });

  await diContainer.loadModules(
    [
      path.join(
        import.meta.dirname,
        '../../modules/**/*.{repository,mapper,service,domain}.{js,ts}',
      ),
    ],
    {
      formatName,
      esModules: true,
      resolverOptions: {
        register: asFunction,
        lifetime: Lifetime.SINGLETON,
      },
    },
  );

  await diContainer.loadModules(
    [path.join(import.meta.dirname, '../../modules/**/*.{handler,event-handler}.{js,ts}')],
    {
      formatName,
      esModules: true,
      resolverOptions: {
        asyncInit: 'init',
        register: asFunction,
        lifetime: Lifetime.SINGLETON,
      },
    },
  );

  // Create a dependency injection container
  await fastify.register(fastifyAwilixPlugin, {
    container: diContainer,
    asyncInit: true,
  });
}

// ---- src/server/di/util.ts ----
export function formatName(fileName: string): string {
  // Split the filename by delimiters (".", "-")
  const parts = fileName.split(/[.-]/);

  // Capitalize the first letter of each word (except the first)
  const formattedParts = parts.map((part, index) =>
    index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
  );

  return formattedParts.join('');
}

// ---- src/server/index.ts ----
import path from 'node:path';
import AutoLoad from '@fastify/autoload';
import Cors from '@fastify/cors';
import Helmet from '@fastify/helmet';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import UnderPressure from '@fastify/under-pressure';
import type { FastifyInstance } from 'fastify';
import mercurius from 'mercurius';
import env from '#src/config/env.ts';
import { di } from '#src/server/di/index.ts';
import getGQL from '#src/server/plugins/gql.ts';

export default async function createServer(fastify: FastifyInstance) {
  // Set sensible default security headers.
  // Registered before any route (including GraphQL) so its onRequest hook applies globally.
  await fastify.register(Helmet, {
    global: true,
    // The following settings are needed for graphiql, see https://github.com/graphql/graphql-playground/issues/1283
    contentSecurityPolicy: !env.isDevelopment,
    crossOriginEmbedderPolicy: !env.isDevelopment,
  });

  // Enables the use of CORS in a Fastify application.
  // https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
  // `origin: false` disables CORS headers entirely (suitable for same-origin / server-to-server).
  // Set to `true` or a specific origin string/array for cross-origin frontends.
  await fastify.register(Cors, {
    origin: false,
  });

  // Graphql — registered after Helmet/CORS so the /graphql endpoint inherits their hooks.
  await fastify.register(mercurius, {
    schema: await getGQL(),
    graphiql: env.isDevelopment,
    defineMutation: true,
  });

  // Auto-load plugins
  await fastify.register(AutoLoad, {
    dir: path.join(import.meta.dirname, 'plugins'),
    dirNameRoutePrefix: false,
  });

  // Configure Dependency Injection
  await di(fastify);

  // Auto-load routes
  await fastify.register(AutoLoad, {
    dir: path.join(import.meta.dirname, '../modules'),
    dirNameRoutePrefix: false,
    options: {
      prefix: '/api',
    },
    matchFilter: (path) => /\.(route|resolver)\.ts$/.test(path),
  });

  await fastify.register(UnderPressure, {
    healthCheck: async () => true,
    healthCheckInterval: 5000,
    exposeStatusRoute: {
      routeOpts: { logLevel: 'silent' },
      url: '/health',
    },
  });

  return fastify.withTypeProvider<TypeBoxTypeProvider>();
}

// ---- src/server/plugins/gql.ts ----
import path from 'node:path';
import { loadFiles } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { print } from 'graphql';

const getGQL = async () => {
  const typesArraySchema = await loadFiles(path.join(import.meta.dirname, '../../'), {
    extensions: ['.graphql-schema.ts', '.graphql-schema.js'], // js needed for the production build
  });

  const typeDefsSchema = mergeTypeDefs(typesArraySchema, {
    throwOnConflict: true,
  });
  return print(typeDefsSchema);
};

export default getGQL;

// ---- src/shared/app/app-request-context.ts ----
import { requestContext } from '@fastify/request-context';

/** Returns the current request ID, or 'no-request-context' if called outside a request lifecycle. */
function getRequestId(): string {
  return requestContext.get('requestId') ?? 'no-request-context';
}

export { getRequestId };

// ---- src/shared/cqrs/bus.types.ts ----
import type { FastifyBaseLogger } from 'fastify';

export type Meta = null | Record<string, unknown>;

/** Unique symbol used to brand Action objects, preventing plain-object misuse. */
declare const ActionBrand: unique symbol;

/** Phantom symbol carrying the Result type — never set at runtime. */
declare const ResultType: unique symbol;

export interface Action<Payload, Result = unknown> {
  readonly [ActionBrand]: true;
  /** Phantom property — exists only at the type level to carry the Result type. */
  readonly [ResultType]?: Result;
  readonly type: string;
  readonly payload: Payload;
  readonly meta?: Meta;
}

/** Extracts the Result type from an Action. */
export type ActionResult<A> = A extends Action<unknown, infer R> ? R : unknown;

/** Produces an `Action<Payload>` (Result = unknown) from a CommandCreator.
 *  Use this for handler parameter types so they stay compatible with `register()`. */
export type HandlerAction<C> = C extends CommandCreator<infer P, unknown> ? Action<P> : never;

export interface CommandCreator<Payload, Result = unknown> {
  type: string;

  (payload: Payload, meta?: Meta): Action<Payload, Result>;
}

export type CommandHandler = (command: Action<unknown>) => Promise<unknown>;
export type QueryHandler = (query: Action<unknown>) => Promise<unknown>;
/** Event handlers may be sync or async; the bus isolates and logs their failures. */
export type EventHandler = (event: Action<unknown>) => void | Promise<void>;

/** Middleware for command/query buses — wraps a handler that returns a Promise. */
export type CommandMiddleware = (
  action: Action<unknown>,
  handler: CommandHandler,
) => Promise<unknown>;

/** Middleware for the event bus. Returns the (possibly async) handler result so the
 *  bus can await it for sequential processing and catch failures. */
export type EventMiddleware = (
  action: Action<unknown>,
  handler: EventHandler,
) => void | Promise<void>;

/** Opt-in ordering for an event subscription: events whose `keyExtractor` returns the
 *  same key are processed one at a time, in emit order (e.g. per aggregate/entity id),
 *  while different keys run concurrently. */
export interface SequentialProcessingOptions {
  keyExtractor: (event: Action<unknown>) => string;
}

export interface CommandBus {
  register<P>(type: string, handler: (command: Action<P>) => Promise<unknown>): void;
  unregister(type: string): void;
  execute<R>(command: Action<unknown, R>): Promise<R>;
  addMiddleware(fn: CommandMiddleware): void;
}

/** QueryBus is semantically distinct from CommandBus:
 *  queries must be idempotent and side-effect-free. */
export interface QueryBus {
  register<P>(type: string, handler: (query: Action<P>) => Promise<unknown>): void;
  unregister(type: string): void;
  execute<R>(query: Action<unknown, R>): Promise<R>;
  addMiddleware(fn: CommandMiddleware): void;
}

/** Minimal publishing port. Anything that can publish an event satisfies this — the event
 *  bus today, a transactional-outbox writer tomorrow. Consumers (e.g. `DomainResult.commit`)
 *  should depend on this, not on the full `EventBus`. */
export interface EventPublisher {
  emit(event: Action<unknown>): void | Promise<void>;
}

export interface EventBus extends EventPublisher {
  on<P>(
    type: string,
    handler: (event: Action<P>) => void | Promise<void>,
    options?: SequentialProcessingOptions,
  ): void;
  emit(event: Action<unknown>): void;
  addMiddleware(fn: EventMiddleware): void;
}

/** Options for creating an event bus instance. */
export interface EventBusOptions {
  logger: FastifyBaseLogger;
}

// ---- src/shared/db/postgres.ts ----
import postgres from 'postgres';
import { LogLevel } from '#src/config/env.ts';
import { env } from '#src/config/index.ts';

let sql: ReturnType<typeof postgres> | null = null;

/** Returns the singleton DB connection, creating it lazily on first call. */
export function getDb(): ReturnType<typeof postgres> {
  if (!sql) {
    sql = postgres(env.db.url, {
      ssl: env.db.ssl ? 'require' : false,
      max: env.db.poolMax,
      idle_timeout: env.db.idleTimeout,
      connect_timeout: env.db.connectTimeout,
      debug: (conn: number, query: string, params: unknown[], paramTypes: unknown[]) => {
        if (env.log.level === LogLevel.debug) {
          // biome-ignore lint/suspicious/noConsole: needed for debugging
          console.debug(`
    SQL::
      Executing query: "${query.trim()}"
      Params: ${JSON.stringify(params)}
      Param Types: ${JSON.stringify(paramTypes)}
      Connection: ${conn}
    `);
        }
      },
    });
  }
  return sql;
}

export async function closeDbConnection() {
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = null;
  }
}

export const joinConditions = (
  xs: (postgres.PendingQuery<postgres.Row[]> | false | undefined | null | '')[],
  joiner?: postgres.PendingQuery<postgres.Row[]>,
) => {
  const db = getDb();
  const join = joiner ?? db`AND`;
  const filtered = xs.filter(Boolean) as postgres.PendingQuery<postgres.Row[]>[];

  if (filtered.length === 0) {
    return db``;
  }

  return filtered.reduce(
    (acc, fragment, i) => (i === 0 ? db`WHERE ${fragment}` : db`${acc} ${join} ${fragment}`),
    db``,
  );
};

/**
 * Executes a callback within a database transaction.
 * All queries using the `tx` sql instance share the same transaction.
 * The transaction is committed if the callback resolves, rolled back if it throws.
 */
export async function withTransaction<T>(
  fn: (tx: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
  const db = getDb();
  return db.begin((tx) => fn(tx)) as Promise<T>;
}

// ---- src/shared/db/repository.port.ts ----
export interface Paginated<T> {
  count: number;
  limit: number;
  page: number;
  data: T[];
}

export interface OrderBy {
  field: string;
  param: 'asc' | 'desc';
}

export interface PaginatedQueryParams {
  limit: number;
  page: number;
  offset: number;
  orderBy: OrderBy;
}

export interface RepositoryPort<Entity> {
  insert(entity: Entity | Entity[]): Promise<void>;
  findOneById(id: string): Promise<Entity | undefined>;
  findAll(): Promise<Entity[]>;
  findAllPaginated(params: PaginatedQueryParams): Promise<Paginated<Entity>>;
  update(entity: Entity): Promise<Entity>;
  delete(entityId: string): Promise<boolean>;
}

// ---- src/shared/db/sql-repository.base.ts ----
import type { FastifyBaseLogger } from 'fastify';
import { getRequestId } from '#src/shared/app/app-request-context.ts';
import type {
  Paginated,
  PaginatedQueryParams,
  RepositoryPort,
} from '#src/shared/db/repository.port.ts';
import type { Mapper } from '#src/shared/ddd/mapper.interface.ts';
import { ConflictException, DatabaseErrorException } from '#src/shared/exceptions/index.ts';

export interface SqlRepositoryBaseProps<Entity, DbModel> {
  db: Dependencies['db'];
  tableName: string;
  mapper: Mapper<Entity, DbModel>;
  logger: FastifyBaseLogger;
}

export function SqlRepositoryBase<
  Entity extends { id: string },
  DbModel extends Record<string, unknown>,
>({
  db,
  tableName,
  mapper,
  logger,
}: SqlRepositoryBaseProps<Entity, DbModel>): RepositoryPort<Entity> {
  return {
    async findOneById(id: string): Promise<Entity | undefined> {
      const [result] = await db`SELECT * FROM ${db(tableName)} WHERE id = ${id}`;
      return result ? mapper.toDomain(result as DbModel) : undefined;
    },
    async findAll(): Promise<Entity[]> {
      const records = await db`SELECT * FROM ${db(tableName)}`;
      return records.map((r) => mapper.toDomain(r as DbModel));
    },
    async findAllPaginated(params: PaginatedQueryParams): Promise<Paginated<Entity>> {
      const [countRow] = await db`SELECT COUNT(*) as total FROM ${db(tableName)}`;
      const result =
        await db`SELECT * FROM ${db(tableName)} LIMIT ${params.limit} OFFSET ${params.offset}`;
      const entities = result.map((r) => mapper.toDomain(r as DbModel));
      return {
        data: entities,
        count: Number(countRow?.total ?? 0),
        limit: params.limit,
        page: params.page,
      };
    },
    async update(entity: Entity): Promise<Entity> {
      const record = mapper.toPersistence(entity);
      const { id, ...fields } = record as Record<string, unknown> & { id: string };
      const [updated] =
        await db`UPDATE ${db(tableName)} SET ${db(fields)} WHERE id = ${id} RETURNING *`;
      if (!updated) {
        throw new DatabaseErrorException(`Record with id ${id} not found for update`);
      }
      return mapper.toDomain(updated as DbModel);
    },
    async insert(entity: Entity | Entity[]): Promise<void> {
      const entities = Array.isArray(entity) ? entity : [entity];
      const records = entities.map(mapper.toPersistence);
      try {
        await db`INSERT INTO ${db(tableName)} ${db(records as Record<string, unknown>[])}`;
      } catch (error: unknown) {
        if (error instanceof Error && 'code' in error && error.code === '23505') {
          // https://www.postgresql.org/docs/current/errcodes-appendix.html
          throw new ConflictException('Record already exists', error);
        }
        throw new DatabaseErrorException(
          'Unknown database error',
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    },
    async delete(entityId: string): Promise<boolean> {
      logger.debug(`[${getRequestId()}] deleting entities ${entityId} from ${tableName}`);
      const result = await db`DELETE FROM ${db(tableName)} WHERE id = ${entityId}`;
      return result.count > 0;
    },
  };
}

// ---- src/shared/ddd/mapper.interface.ts ----
export interface Mapper<DomainEntity, DbRecord, Response = unknown> {
  toPersistence(entity: DomainEntity): DbRecord;
  toDomain(record: DbRecord): DomainEntity;
  toResponse(entity: DomainEntity): Response;
}

// ---- src/shared/exceptions/index.ts ----
export * from './exception-base.ts';
export * from './exceptions.ts';

// ---- tests/support/server.ts ----
import Fastify, { LogController } from 'fastify';
import server from '../../src/server/index.ts';

export const buildApp = async () => {
  const app = Fastify({
    logger: {
      level: 'warn',
    },
    logController: new LogController({ disableRequestLogging: true }),
    routerOptions: {
      ignoreDuplicateSlashes: true,
    },
    ajv: {
      customOptions: {
        keywords: ['example'],
      },
    },
  });

  await server(app);
  return app;
};

```
---
# PARAMETER TYPES
```ts
// (no custom parameter types registered — use only {string},{int},{float},{word})
```
---
# REGISTERED STEPS 
```ts
// 2 step bindings already registered — do NOT redefine any of these:
Then('I send a request to delete my user')                  // tests/user/user.steps.ts
Then('I cannot see my user in a list of all users')         // tests/user/user.steps.ts
```
---
# EXISTING STEP DEFINITIONS (for call style — do not copy their coverage)
```ts
// ---- tests/user/user.steps.ts ----
import assert from 'node:assert';
import { Before, Given, Then, When } from '@cucumber/cucumber';
import type { UserModel } from '#src/modules/user/database/user.repository.ts';
import type { Paginated } from '#src/shared/db/repository.port.ts';
import type { ICustomWorld } from '../support/custom-world.ts';

Before({ tags: '@user' }, async function (this: ICustomWorld) {
  await this.db`TRUNCATE "users"`;
});

Then('I send a request to delete my user', async function (this: ICustomWorld) {
  const response = await this.server.inject({
    method: 'DELETE',
    url: `/api/v1/users/${this.context.latestResponse!.json().id}`,
  });
  assert.strictEqual(response.statusCode, 204);
});

Then('I cannot see my user in a list of all users', async function (this: ICustomWorld) {
  const response = await this.server.inject({
    method: 'GET',
    url: '/api/v1/users',
  });
  const users = response.json<Paginated<UserModel>>();
  assert.strictEqual(
    users.data.some((item) => item.id === this.context.latestResponse!.json().id),
    false,
  );
});

```
---
# WORLD  (what `this` gives you)
```ts
// ---- tests/support/custom-world.ts ----
import { type IWorldOptions, setWorldConstructor, World } from '@cucumber/cucumber';
import type * as messages from '@cucumber/messages';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import type postgres from 'postgres';

export interface TestContext {
  createUserDto?: Record<string, string>;
  latestResponse?: LightMyRequestResponse;
  [key: string]: unknown;
}

export interface ICustomWorld extends World {
  debug: boolean;
  feature?: messages.Pickle;
  testName?: string;
  startTime?: Date;
  db: ReturnType<typeof postgres>;
  server: FastifyInstance;
  context: TestContext;
}

export class CustomWorld extends World implements ICustomWorld {
  // biome-ignore lint/complexity/noUselessConstructor: needed
  constructor(options: IWorldOptions) {
    super(options);
  }

  debug = false;
  server = undefined as unknown as FastifyInstance;
  db = undefined as unknown as ReturnType<typeof postgres>;
  context: TestContext = {};
}

setWorldConstructor(CustomWorld);

// ---- tests/support/common-hooks.ts ----
import { After, Before, type ITestCaseHookParameter, setDefaultTimeout } from '@cucumber/cucumber';
import { getDb } from '#src/shared/db/postgres.ts';
import type { ICustomWorld } from './custom-world.ts';
import { buildApp } from './server.ts';

setDefaultTimeout(process.env.PWDEBUG ? -1 : 60 * 1000);

Before({ tags: '@pending' }, () => 'skipped' as unknown as undefined);

Before({ tags: '@debug' }, function (this: ICustomWorld) {
  this.debug = true;
});

Before(async function (this: ICustomWorld, { pickle }: ITestCaseHookParameter) {
  this.startTime = new Date();
  this.testName = pickle.name.replaceAll(/\W/g, '-');
  this.feature = pickle;
  this.context = {};
  this.db = getDb();
  this.server = await buildApp();
});

After(async function (this: ICustomWorld, { result }: ITestCaseHookParameter) {
  if (result) {
    this.attach(`Status: ${result.status}. Duration:${result.duration.seconds}s`);
  }
  // Reset persisted state so scenarios stay independent and re-runnable
  // (otherwise leftover rows cause unique-email clashes on repeat runs).
  await this.db`TRUNCATE TABLE users CASCADE`;
  await this.server.close();
});

```
---
# CONSTANTS 
```ts
// ---- src/config/env.ts ----
import envSchema from 'env-schema';
import { type Static, Type } from 'typebox';

const NodeEnv = {
  development: 'development',
  production: 'production',
  test: 'test',
} as const;

export const LogLevel = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
} as const;
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

const schema = Type.Object({
  POSTGRES_URL: Type.String(),
  POSTGRES_PASSWORD: Type.String(),
  POSTGRES_USER: Type.String(),
  POSTGRES_DB: Type.String(),
  // Enable TLS for the DB connection. Keep `false` for local/CI Postgres; set `true`
  // in production (most managed Postgres providers require TLS).
  POSTGRES_SSL: Type.Boolean({ default: false }),
  // Connection pool tuning (see https://github.com/porsager/postgres#connection).
  POSTGRES_POOL_MAX: Type.Number({ default: 10 }),
  POSTGRES_IDLE_TIMEOUT: Type.Number({ default: 20 }),
  POSTGRES_CONNECT_TIMEOUT: Type.Number({ default: 30 }),
  LOG_LEVEL: Type.Enum(LogLevel),
  NODE_ENV: Type.Enum(NodeEnv),
  HOST: Type.String({ default: 'localhost' }),
  PORT: Type.Number({ default: 3000 }),
});

const env = envSchema<Static<typeof schema>>({
  dotenv: true,
  schema,
});

export default {
  nodeEnv: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === NodeEnv.development,
  isProduction: env.NODE_ENV === NodeEnv.production,
  version: process.env.npm_package_version ?? '0.0.0',
  log: {
    level: env.LOG_LEVEL,
  },
  server: {
    host: env.HOST,
    port: env.PORT,
  },
  db: {
    url: `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_URL}/${env.POSTGRES_DB}`,
    ssl: env.POSTGRES_SSL,
    poolMax: env.POSTGRES_POOL_MAX,
    idleTimeout: env.POSTGRES_IDLE_TIMEOUT,
    connectTimeout: env.POSTGRES_CONNECT_TIMEOUT,
  },
};

// ---- src/config/index.ts ----
export { default as env } from './env.ts';

```
---
# TASK — write the missing step definitions for this Gherkin feature
```gherkin
Feature: Create a user

  @user
  Scenario: I can create a user
    Given user profile data
      | email              | country | street      | postalCode |
      | john.doe@gmail.com | England | Road Avenue | 29145      |
    When I send a request to create a user
    Then I receive my user ID
    And I can see my user in a list of all users

  @user
  Scenario Outline: I try to create a user with invalid data
    Given user profile data
      | email   | country   | street   | postalCode   |
      | <Email> | <Country> | <Street> | <PostalCode> |
    When I send a request to create a user
    Then I receive an error "Bad Request" with status code 400

    Examples:
      | Email          | Country | Street      | PostalCode |
      | johngmail.com  | England | Road Avenue | 29145      |
      | john@gmail.com | 123     | Road Avenue | 29145      |
      | johng@mail.com | England | 123         | 29145      |
      | johng@mail.com | England | Road Avenue | @          |
      | #@!$           | $#@1    | %542        | !321       |
```