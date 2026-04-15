import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import routeAuth from './routes/auth.js'
import routeUser from './routes/user.js'
import routePayment from './routes/payment.js'
import routeRequest from './routes/request.js'
import { S3Connect } from './services/s3.js'
import { workerStart, workerStop } from './workers/task.js'

const CORS_FRONTEND = process.env.SCANHAND_CORS || 'http://localhost:3000'

const app = express()
const port = 3100
let server = null

app.use(cors({ origin: CORS_FRONTEND }))
app.use(express.json())
app.use('/api', routeAuth)
app.use('/api', routeUser)
app.use('/api', routePayment)
app.use('/api', routeRequest)

async function mongodbConnect(uri, user, pass) {
    await mongoose.connect(uri, {
        user: user,
        pass: pass,
        authSource: 'admin'
    })
    console.log('app: mongodb connected');
}

await S3Connect(
    process.env.SCANHAND_S3_ACCESS_KEY,
    process.env.SCANHAND_S3_SECRET_KEY
)

await mongodbConnect(
    `${process.env.SCANHAND_MONGODB_URI}/scanhand`,
    process.env.SCANHAND_MONGODB_USER,
    process.env.SCANHAND_MONGODB_PASS
)

await workerStart()

function shutdown(){
    mongoose.connection.close();
    workerStop();
    console.log('exit...')
    server.close(() => {
        console.log('server HTTP closed...')
    })
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server = app.listen(port, () => {
    console.log(`app: used CORS for ${CORS_FRONTEND}`)
    console.log(`app: runed on http://localhost:${port} ...`)
})