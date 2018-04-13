'use strict';

const Fs = require('fs');
const Path = require('path');
const Events = require('events');
const _ = require('underscore');


const options = {
    dbPath: './tmp'
}

const mkdir = function(path) {

    const split = path.split('/');
    const p = [];

    let dir;

    while (split.length) {

        p.push(split.shift());

        dir = Path.join.apply(Path.join, p);
        if (!Fs.existsSync(dir)) {

            Fs.mkdirSync(dir);
        }
    }

    console.log(`Created directory ${dir}`);
};

class JsonDatabaseCache extends Events {


    constructor(name) {

        if (!name) {

            throw Error('database needs a name');
        }

        super();

        this.saveTimer = null;

        mkdir(options.dbPath);

        this.dbPath = Path.join(options.dbPath, `${name}.json`);

        if (Fs.existsSync(this.dbPath)) {

            this.db = JSON.parse(Fs.readFileSync(this.dbPath).toString());
        }
        else {

            this.db = {};
            this.save();
        }
    }

    save() {

        const self = this;

        if (this.saveTimer) {

            clearTimeout(this.saveTimer);
        }

        this.saveTimer = setTimeout(function() {

            Fs.writeFileSync(self.dbPath, JSON.stringify(self.db), { flag: 'w' });
            self.emit('saved');
        }, 100);
    }

    find(table, where) {

        if (!this.db[table]) {

            return false;
        }

        if (!where) {

            where = {};
        }

        let whereFn;
        let _fn;

        if (typeof where === 'object') {
            whereFn = where;
            _fn = 'where';
        }

        if (typeof where === 'number') {
            whereFn = function (row, id) {
                return where === id;
            }
            _fn = 'filter';
        }

        if (typeof where === 'string') {
            whereFn = function (row, id) {

                return where === row;
            }
            _fn = 'filter';
        }

        const found = _[_fn](this.db[table], whereFn);

        this.emit('find', found);

        return found;
    }

    create(table, data) {

        if (!this.db[table]) {

            this.db[table] = [];
        }

        if (typeof data === 'object') {

            if (!data.id) {
                const last = this.db[table][this.db[table].length-1];

                if (last) {

                    data.id = last.id + 1
                }
                else {

                    data.id = 1;
                }
            }
        }

        this.db[table].push(data);
        this.save();

        this.emit('created', [table, data]);
    }

    update(table, where, data) {

        if (!this.db[table]) {

            return false;
        }

        const self = this;

        this.db[table] = this.db[table].map((row, id) => {

            let updated = false;

            if (typeof where === 'object') {
                if (_.isMatch(where, row)) {

                    updated = true;
                    _.merge(row, data);
                }
            }

            if (typeof where === 'number') {
                if (where === id) {

                    updated = true;
                    row = data;
                }
            }

            if (typeof where === 'string') {
                if (where === data) {

                    updated = true;
                    row = data;
                }
            }

            if (updated) {

                this.emit('updated', row);
            }

            return row;
        });

        self.save();
    }

    remove(table, where) {

        if (!this.db[table]) {

            return false;
        }

        const removed = [];

        return this.db[table] = _.reject(this.db[table], (row, id) => {

            let rmv = null;

            if (typeof where === 'object') {
                rmv = _.isMatch(row, where);
            }

            if (typeof where === 'number') {
                rmv = id === where;
            }

            if (typeof where === 'string') {
                rmv = row === where;
            }

            if (rmv === null) {

                rmv = !where
            }

            if (rmv) {

                removed.push(row);
            }

            this.emit('removed', removed);

            return rmv;
        });

        this.save();
    }
}


module.exports = JsonDatabaseCache;
