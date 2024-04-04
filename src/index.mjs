import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const gamesInProgressTable = "games-in-progress-table";
const inGameNamesTable = "in-game-names-table";

const civCloudPath = "/civ-6-cloud";
const civPydtPath = "/civ-6-pydt";

export const handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    let body;
    let statusCode = '200';
    const headers = {
        'Content-Type': 'application/json',
    };
    
    try {
        let gameName;
        let inGameName;
        let round;
        
        switch (event.path) {
            case civCloudPath:
                gameName = event.body.value1;
                inGameName = event.body.value2;
                round = event.body.value3;
                await ProcessEvent(gameName, inGameName, round, "Civ 6 - Cloud");
                
                body = "Successfully processed civ cloud notification";
                break;
                
            case civPydtPath:
                gameName = event.body.gameName;
                inGameName = event.body.userName;
                round = event.body.round;
                await ProcessEvent(gameName, inGameName, round, "Civ 6 - PYDT");
                
                body = "Successfully processed civ pydt notification";
                break;
                
            default:
                throw new Error(`Unsupported path "${event.path}"`);
        }
    } catch (err) {
        statusCode = '400';
        body = err.message;
    } finally {
        body = JSON.stringify(body);
    }

    return {
        statusCode,
        body,
        headers,
    };
};

async function FetchUsername(inGameName) {
    const inGameNameMapping = await dynamo.send(
        new GetCommand({
            TableName: inGameNamesTable,
            Key: {
                InGameName: inGameName,
            }
        })
    );
    
    if (inGameNameMapping?.Item === undefined) {
        await AddInGameNameMapping({InGameName: inGameName, DiscordTag: ""});
    }
    
    return inGameNameMapping?.Item.DiscordTag || inGameName;
}

async function AddInGameNameMapping(inGameNameMapping) {
    await dynamo.send(
        new PutCommand({
            TableName: inGameNamesTable,
            Item: inGameNameMapping,
        })
    );
}

async function FetchGameInProgress(gameName, turn) {
    if (turn === 1) {
        return undefined;
    }
    return await dynamo.send(
        new GetCommand({
            TableName: gamesInProgressTable,
            Key: {
                GameName: gameName,
                Turn: turn - 1
            }
        })
    );
}

async function AddGameInProgress(gameInProgress) {
    await dynamo.send(
        new PutCommand({TableName: gamesInProgressTable, Item: gameInProgress})
    );
}

async function ProcessEvent(gameName, inGameName, round, game) {
    const userName = await FetchUsername(inGameName);
    let gameInProgress = await FetchGameInProgress(gameName, round);
    
    console.log(`Fetched game: ${JSON.stringify(gameInProgress)}`);
    
    if (gameInProgress?.Item === undefined) {
        await AddGameInProgress({ GameName: gameName, Turn: round, CurrentUser: userName, Game: game});
        return;
    }
    const outdatedGame = gameInProgress.Item;
    console.log(`Outdated game: ${JSON.stringify(outdatedGame)}`);
    await UpdateGameInProgress(outdatedGame.GameName, outdatedGame.Turn, round, userName, outdatedGame.Game);
}

async function UpdateGameInProgress(gameName, previousRound, currentRound, currentUser, game) {
    const deleteResponse = await DeleteGameInProgress(gameName, previousRound);
    console.log(`Delete response: ${JSON.stringify(deleteResponse)}`);
    await AddGameInProgress({GameName: gameName, Turn: currentRound, Game: game, CurrentUser: currentUser});
}

async function DeleteGameInProgress(gameName, round) {
    console.log(`Deleting ${gameName} on round ${round}`);
    return await dynamo.send(
        new DeleteCommand({
            TableName: gamesInProgressTable,
            Key: {GameName: gameName, Turn: round}
        })
    );
}
