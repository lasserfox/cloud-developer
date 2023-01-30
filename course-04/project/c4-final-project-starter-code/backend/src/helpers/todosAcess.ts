import * as AWS from 'aws-sdk'
//import * as AWSXRay from 'aws-xray-sdk'
const AWSXRay = require('aws-xray-sdk')
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE
  ) {}

  async getTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info('Getting all todoItems1', {'userId': userId })

    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false
      })
      .promise()

    const items = result.Items
    logger.info('Getting all todoItems2', {'items': items })
    return items as TodoItem[]
  }

  async createTodoItem(todoItem: TodoItem): Promise<TodoItem> {
  logger.info('createTodoItem', {'todoItem': todoItem })
    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todoItem
      })
      .promise()

    return todoItem
  }

  async getTodoItem(userId: string, todoItemId: string)  {
  logger.info('getTodoItem', {'userId': userId,'todoItemId': todoItemId })
    const result = await this.docClient
      .get({
        TableName: this.todosTable,
        Key: {
          todoId: todoItemId,
          userId
        }
      })
      .promise()

    return result.Item
  }

  async todoItemExists(
    userId: string,
    todoItemId: string
  ): Promise<Boolean> {
    const todoItem = await this.getTodoItem(userId, todoItemId)

    return !!todoItem
  }

  async deleteTodoItem(userId: string, todoItemId: string): Promise<void>  {
  logger.info('deleteTodoItem', {'userId': userId,'todoItemId': todoItemId })
    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: {
          todoId: todoItemId,
          userId
        }
      })
      .promise()
  }

  async updateTodoItem(userId: string, todoItemId: string, updatedTodoItem: TodoUpdate): Promise<void> {
  logger.info('updateTodoItem', {'userId': userId,'todoItemId': todoItemId })
    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        todoId: todoItemId,
        userId
      },
      ExpressionAttributeNames: {
        '#N': 'name'
      },
      UpdateExpression: 'SET #N = :name, dueDate = :dueDate, done = :done',
      ExpressionAttributeValues: {
        ':name': updatedTodoItem.name,
        ':dueDate': updatedTodoItem.dueDate,
        ':done': updatedTodoItem.done
      }
    }).promise()
  }

  async updateAttachmentUrl(userId: string, todoItemId: string, bucketName: string): Promise<void> {
  logger.info('updateAttachmentUrl', {'userId': userId,'todoItemId': todoItemId, 'bucketName': bucketName })
    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        todoId: todoItemId,
        userId
      },
      UpdateExpression: 'SET attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': `https://${bucketName}.s3.amazonaws.com/${todoItemId}`
      }
    }).promise()
  }
}

function createDynamoDBClient() {
logger.info('createDynamoDBClient')
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}