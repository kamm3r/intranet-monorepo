// ESM-TODO: this suite targets the legacy Express app (`../app.js`, removed
// in the Effect TS migration). It is currently broken: supertest needs an
// Express-style app/listener, but the server is now an Effect HttpApp run via
// tsx (`tsx --env-file=.env index.ts`). Kept (with jest/supertest devDeps)
// until the suite is ported — e.g. spin up the Effect app on an ephemeral
// port with mongodb-memory-server and assert over HTTP with fetch.
// ---------------------------------------------------------------------------
import mongoose from 'mongoose'
import supertest from 'supertest'

import app from '../app.js'
import User from '../models/user.js'

import { manyUsers } from './test_data.js'

const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})

  // This is not currently working. Fix it! (bcrypt function does not seem to work)
  // Yet it does not throw an error or it is not showed for some reason
  for (const user of manyUsers) {
    await api.post('/api/users').send(user)
  }
})

describe('/authorize router tests', () => {
  test('post /api/authenticate returns 200 with valid email and password', async () => {
    console.log('manyUsers[0]:', manyUsers[0])
    const response = await api.post('/api/authenticate').send(manyUsers[0]).expect(200)
    console.log(response.body)
  })

  test('logout to blacklist a token', async () => {
    const response = await api.post('/api/authenticate').send(manyUsers[1]).expect(200)
    console.log('response.body:', response.body)
    const { token } = response.body
    await api.get('/api/authorize/logout').set('Authorization', `bearer ${token}`).expect(200)

    await api.get('/api/authorize').set('Authorization', `bearer ${token}`).expect(401)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
