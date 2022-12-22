import { Request, Response } from 'express';
import { Session, SessionData } from 'express-session';
// import { buildDataLoaders } from 'src/utils/dataLoaders';
import { DataSource } from 'typeorm';

export type Context = {
  req: Request & {
    session: Session & Partial<SessionData> & { userId?: number };
  };
  res: Response;
  dataSource: DataSource;
  // dataLoaders: ReturnType<typeof buildDataLoaders>;
};
