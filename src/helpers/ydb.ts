/**
 * YDB wrapper.
 */
import {
  Column,
  Driver,
  Session,
  TableDescription,
  TableIndex,
  TokenAuthService,
  TypedData,
  TypedValues,
  Types
} from 'ydb-sdk';
import { logger } from './logger';

const YDB_ENDPOINT = 'grpcs://ydb.serverless.yandexcloud.net:2135';
const YDB_PATH = process.env.YDB_PATH;

const CONNECTIONS_TABLE = 'connections';

let ydbDriver: Driver;

type Connection = {
  stubId: string,
  connectionId: string,
  gatewayId: string,
  createdAt: string,
};

export class Ydb {
  constructor(protected token: string) { }

  async getConnection(stubId: string) {
    const query = `
      DECLARE $stubId AS Utf8;

      SELECT connectionId, gatewayId, createdAt
      FROM ${CONNECTIONS_TABLE}
      WHERE stubId = $stubId
    `;
    const resultSets = await this.withSession(async session => {
      const preparedQuery = await session.prepareQuery(query);
      const params = {
        '$stubId': TypedValues.utf8(stubId),
      };
      const { resultSets } = await session.executeQuery(preparedQuery, params);
      return resultSets;
    });
    const rows = TypedData.createNativeObjects(resultSets[ 0 ]) as unknown as Connection[];
    return rows.length ? rows[ 0 ] : undefined;
  }

  async saveConnection(stubId: string, connectionId: string, gatewayId: string) {
    const query = `
      DECLARE $stubId AS Utf8;
      DECLARE $connectionId AS Utf8;
      DECLARE $gatewayId AS Utf8;

      UPSERT INTO ${CONNECTIONS_TABLE} (stubId, connectionId, gatewayId, createdAt)
      VALUES ($stubId, $connectionId, $gatewayId, CurrentUtcTimestamp())
    `;
    await this.withSession(async session => {
      const preparedQuery = await this.ensureTable(() => session.prepareQuery(query));
      const params = {
        '$stubId': TypedValues.utf8(stubId),
        '$connectionId': TypedValues.utf8(connectionId),
        '$gatewayId': TypedValues.utf8(gatewayId),
      };
      return session.executeQuery(preparedQuery, params);
    });
    logger.debug(`Connection saved in ydb`);
  }

  protected async ensureTable<T>(fn: () => T) {
    try {
      return await fn();
    } catch (e) {
      if (/Cannot find table/i.test(e.message)) {
        await this.createConnectionsTable();
        return await fn();
      }
      throw e;
    }
  }

  protected async createConnectionsTable() {
    logger.info(`Creating table: ${CONNECTIONS_TABLE}`);
    const tableDescription = new TableDescription()
      .withColumn(new Column('stubId', Types.optional(Types.UTF8)))
      .withColumn(new Column('connectionId', Types.optional(Types.UTF8)))
      .withColumn(new Column('gatewayId', Types.optional(Types.UTF8)))
      .withColumn(new Column('createdAt', Types.optional(Types.TIMESTAMP)))
      .withPrimaryKey('stubId')
      .withIndex(
        new TableIndex('createdAtIndex')
          .withIndexColumns('createdAt')
          .withGlobalAsync(true)
      )
      .withTtl('createdAt', 24 * 60);

    await this.withSession(async session => {
      return session.createTable(CONNECTIONS_TABLE, tableDescription);
    });
  }

  protected async withSession<T>(callback: (session: Session) => Promise<T>) {
    const driver = await this.getDriver();
    return driver.tableClient.withSession(callback);
  }

  protected async getDriver() {
    ydbDriver = ydbDriver || new Driver({
      endpoint: YDB_ENDPOINT,
      database: YDB_PATH,
      authService: new TokenAuthService(this.token)
    });

    if (!await ydbDriver.ready(3000)) {
      throw new Error(`YDB driver has not become ready in allowed time!`);
    }

    return ydbDriver;
  }
}
