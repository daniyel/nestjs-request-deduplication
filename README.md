# nestjs-request-deduplication

### Optional Dependencies
By default, this module does not install Redis or Memcached dependencies. If you want to use them, install them manually:

#### **Using Redis**
```sh
npm install ioredis
```

#### **Using Redis**
```sh
npm install memcached
```

### Deveopment

You need to run `npm run build` in root folder to build the module first. Then you need to execute one of the following commands:

```sh
npm run dev --workspace=examples/memory
# or
npm run dev --workspace=examples/redis
# or
npm run dev --workspace=examples/memcached
```
