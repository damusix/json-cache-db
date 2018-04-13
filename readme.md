# JSON Cache DB

#### Get Started

#### Usage

``` javascript
const db = new JsonDatabaseCache('hello');
// see tmp/hello.json for db

db.create('tableName', { name: 'first row of data' });
db.create('tableName', { name: 'second row of data' });


db.find('tableName', { name: 'first row of data' });
// > [{ name: 'first row of data', id: 1 }]

db.find('tableName', {});
// > [{ name: 'first row of data', id: 1 }, { name: 'second row of data', id: 2 }]

db.update('tableName', { id: 2 }, { description: 'this was updated' });

db.remove('tableName', { id: 1 });
// > [{ name: 'second row of data', description: 'this was updated', id: 2 }]


```
