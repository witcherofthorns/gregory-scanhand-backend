import User from '../models/user.js';
import Task from '../models/task.js'
import Request from '../models/request.js'
import { createAiRequest } from '../services/openai.js';

let timeoutLoop = null
const TIMEOUT_SECONDS = 15
const S3_URL = process.env.SCANHAND_S3_URL

async function fileDownloadFromS3(fileName){
    // http based request
    const url = `${S3_URL}/${fileName}`;
    const response = await fetch(url);

    // failed donwload
    if(!response.ok){
        return null;
    }

    // return array buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

async function taskProcess(task){
    try {
        // start working
        console.log(`worker: processing task ${task._id}`);

        // donwload files from S3
        const leftFile = await fileDownloadFromS3(task.files.left.key);
        const rightFile = await fileDownloadFromS3(task.files.right.key);

        // check files
        if(!leftFile || !rightFile){
            console.log('worker: bad files')
            await task.deleteOne();
            return;
        }

        // send openai request
        const result = await createAiRequest(
            leftFile.toString('base64'),
            rightFile.toString('base64'),
            task.theme
        );

        // no openai result
        // error or failed result
        if(!result){
            console.log('worker: open ai bad request, delete task')
            await task.deleteOne();
            return;
        }

        // if ai response success
        // sub user balance credit
        // fixed $inc amout - 50 credits
        if(result.status === 'ok'){
            await User.findOneAndUpdate({ userId: task.userId}, {
                $inc: { balance: -50 }
            });
        }

        // create final user result request
        await Request.create({
            userId: task.userId,
            theme: task.theme,
            task: task._id,
            result: result
        });

        // delete task
        await task.deleteOne();
        console.log(`worker: task ${task._id}: ${result.status}`);
    }
    catch (error) {
        console.error(`worker: task ${task._id} failed:`, error);
        //await task.deleteOne();
    }
}

async function workerLoop(){
    // search created tasks
    const task = await Task.findOneAndUpdate(
        {
            'status': 'pending',
            'files.left.uploaded': true,
            'files.right.uploaded': true
        },
        { $set: { status: 'processing' } },
        { sort: { createdAt: 1 } }
    );

    // task not found
    if(!task){
        workerRestart()
        return
    }
    
    // start processing task
    await taskProcess(task);
    workerRestart();
}

function workerRestart(){
    timeoutLoop = setTimeout(workerLoop, TIMEOUT_SECONDS * 1000)
}

export async function workerStart(){
    try {
        console.log(`worker: runed, interval loop ${TIMEOUT_SECONDS} seconds`);
        workerLoop();
    } catch (error) {
        console.error('worker: ', error);
        process.exit(1);
    }
}

export function workerStop() {
    clearTimeout(timeoutLoop)
    timeoutLoop = null
    console.log('worker: stoped');
}