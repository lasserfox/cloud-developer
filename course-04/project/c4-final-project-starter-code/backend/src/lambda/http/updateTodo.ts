import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { todoItemExists, updateTodoItem } from '../../helpers/todos'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

import { createLogger } from '../../utils/logger'
const logger = createLogger('updateTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
    logger.info('update1', {'todoId': todoId,'updatedTodo': updatedTodo })
    if (!updatedTodo.name){
    return {
      statusCode: 404,
      headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // replace with hostname of frontend (CloudFront)
    },
      body: JSON.stringify({
        'msg': 'item empty'
      })
    }
    }

    // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
    const validTodoId = await todoItemExists(event, todoId)
   logger.info('update2', {'isvalid': validTodoId })
    if (!validTodoId) {
      return {
        statusCode: 404,
        headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // replace with hostname of frontend (CloudFront)
    },
        body: JSON.stringify({
          error: 'Todo item does not exist'
        })
      }
    }

    await updateTodoItem(event, todoId, updatedTodo)
    logger.info('update3')
     return {
      statusCode: 200,
      headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // replace with hostname of frontend (CloudFront)
    },
      body: JSON.stringify({})
    };
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
