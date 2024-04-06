import { post } from "./http-handler.mjs";

const webhookId = process.env.WEBHOOK_ID; 
const webhookToken = process.env.WEBHOOK_TOKEN;
const basePath = `${webhookId}/${webhookToken}`;

export async function PostMessage(gameName, game, userName) {
    try {
        const path = `${basePath}?wait=true`; 
        const body = {content: CreateNotificationMessage(gameName, game, userName), allowed_mentions: ["users"]};
        const response = await post(path, body);

        return await response.body.id;   
    }
    catch(exception) {
        return undefined; 
    }
}

function CreateNotificationMessage(gameName, game, userName) {
    return `## ${game} | ${gameName}\n${userName}'s turn!`;
}

