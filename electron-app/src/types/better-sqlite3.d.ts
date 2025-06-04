declare module 'better-sqlite3' {
  class Database {
    constructor(path: string);
    prepare(sql: string): Statement;
    exec(sql: string): this;
    close(): void;
  }

  interface Statement {
    run(...params: any[]): void;
    get(...params: any[]): any;
    all(...params: any[]): any[];
  }

  export = Database;
}
