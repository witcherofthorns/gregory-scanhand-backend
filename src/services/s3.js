import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

let s3 = null

export function S3Connect(accessKey, secretKey){
    s3 = new S3Client({
        region: process.env.SCANHAND_S3_REGION,
        endpoint: process.env.SCANHAND_S3_ENDPOINT,
        apiVersion: "latest",
        credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
        },
        forcePathStyle: true
    })
    
    console.log('s3: connected')
}

export async function S3FilePut(bucketName, fileName, fileBody, fileMimeType){
    try {
        // bucket params
        const params = {
            Bucket: bucketName,
            Key: fileName,
            Body: fileBody,
            ContentType: fileMimeType,
        }

        // create and send command
        const command = new PutObjectCommand(params);
        await s3.send(command);

        // return new file name
        return true
    } catch (error) {
        console.error(`s3-put: ${error}`)
        return false
    }
}