class QueryPromise {
    db: any;
    constructor(db: any) {
        this.db = db;
    }
    queryPromise(SQL: any, params: any) {
        return new Promise((resolve, reject) => {
            this.db.query(SQL, [...params], (error: any, results: unknown) => {
                if (error)
                    return reject(error);
                resolve(results);
            });
        });
    };
}

module.exports = QueryPromise;