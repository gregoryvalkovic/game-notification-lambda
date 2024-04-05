const baseUrl = "https://discord.com/api/v10/webhooks/";
const webhookId = process.env.WEBHOOK_ID; 
const webhookToken = process.env.WEBHOOK_TOKEN;

export async function PostMessage(content) {
    try {
        const response = await fetch(`${baseUrl}/${webhookId}/${webhookToken}?wait=true`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                key1: 'value1',
                key2: 'value2',
            })
        })
    }
    catch(exception) {
        return undefined; 
    }
    return await response.body.id;
}

