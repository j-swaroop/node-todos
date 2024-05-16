const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'todoApplication.db')
const isMatch = require('date-fns/isMatch')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')

const app = express()
app.use(express.json())

let db = null
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Started')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryAndStatus = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasSearchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const convertIntoRequiredForm = dbresponse => {
  return {
    id: dbresponse.id,
    todo: dbresponse.todo,
    priority: dbresponse.priority,
    status: dbresponse.status,
    category: dbresponse.category,
    dueDate: dbresponse.due_date,
  }
}

//API_1
app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {status, search_q = '', category, priority} = request.query

  switch (true) {
    //scenario-3
    case hasPriorityAndStatusProperties(request.query):
      if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`
          data = await db.all(getTodosQuery)
          response.send(data.map(eachTodo => convertIntoRequiredForm(eachTodo)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    //scenario-5
    case hasCategoryAndStatus(request.query):
      if (
        category === 'WORK' ||
        category === 'LEARNING' ||
        category === 'HOME'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND category = '${category}';`
          data = await db.all(getTodosQuery)
          response.send(data.map(eachTodo => convertIntoRequiredForm(eachTodo)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    //scenario-7
    case hasCategoryAndPriority(request.query):
      if (
        category === 'WORK' ||
        category === 'LEARNING' ||
        category === 'HOME'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'LOW' ||
          priority === 'MEDIUM'
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';`
          data = await db.all(getTodosQuery)
          response.send(data.map(eachTodo => convertIntoRequiredForm(eachTodo)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    //scenario-2
    case hasPriorityProperty(request.query):
      if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
        getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}';`
        data = await db.all(getTodosQuery)
        response.send(data.map(eachTodo => convertIntoRequiredForm(eachTodo)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    //scenario-1
    case hasStatusProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodosQuery = `SELECT * FROM todo WHERE status = '${status}';`
        data = await db.all(getTodosQuery)
        response.send(data.map(eachTodo => convertIntoRequiredForm(eachTodo)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    //scenario-4
    case hasSearchProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`
      data = await db.all(getTodosQuery)
      response.send(data.map(eachTodo => convertIntoRequiredForm(eachTodo)))
      break

    //scenario-6
    case hasCategoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'LEARNING' ||
        category === 'HOME'
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category = '${category}';`
        data = await db.all(getTodosQuery)
        response.send(data.map(eachTodo => convertIntoRequiredForm(eachTodo)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    default:
      getTodosQuery = `SELECT * FROM todo;`
      data = await db.all(getTodosQuery)
      response.send(data.map(eachTodo => convertIntoRequiredForm(eachTodo)))
  }
})

//API_2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const selectedUserQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
        FROM
            todo
        WHERE
            id = ${todoId};`
  const dbUser = await db.get(selectedUserQuery)
  response.send(dbUser)
})

//API_3
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    const requestQuery = `
            SELECT 
                *
            FROM
                todo
            WHERE 
                due_date = '${newDate}';`
    const dbUser = await db.all(requestQuery)
    response.send(dbUser.map(eachTodo => convertIntoRequiredForm(eachTodo)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//API-4 post
app.post('/todos/', async (request, response) => {
  const {id, todo, status, priority, category, dueDate} = request.body
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'IN PROGRESS' || status === 'DONE' || status === 'TO DO') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const newDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const addQuery = `
                        INSERT INTO
                            todo(
                                id, todo, category, priority, status, due_date)
                        VALUES(
                            ${id}, '${todo}', '${category}', '${priority}', '${status}', '${newDate}');`
          await db.run(addQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

//API_5
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  const selectedUserQuery = `
        SELECT * FROM todo WHERE id = ${todoId};`
  const dbUser = await db.get(selectedUserQuery)
  const {
    todo = dbUser.todo,
    status = dbUser.status,
    priority = dbUser.priority,
    category = dbUser.category,
    dueDate = dbUser.due_date,
  } = request.body

  let updataTodoQuery
  switch (true) {
    // update Status
    case requestBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updataTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}'
                ,due_date = '${dueDate}' WHERE id = ${todoId};`

        await db.run(updataTodoQuery)
        response.send(`Status Updated`)
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    //update priority;
    case requestBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
        updataTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}'
                ,due_date = '${dueDate}' WHERE id = ${todoId};`

        await db.run(updataTodoQuery)
        response.send(`Priority Updated`)
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    //update Todo
    case requestBody.todo !== undefined:
      updataTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}'
                ,due_date = '${dueDate}' WHERE id = ${todoId};`

      await db.run(updataTodoQuery)
      response.send(`Todo Updated`)
      break

    //update category
    case requestBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'LEARNING' ||
        category === 'HOME'
      ) {
        updataTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}'
                ,due_date = '${dueDate}' WHERE id = ${todoId};`

        await db.run(updataTodoQuery)
        response.send(`Category Updated`)
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    //update DueDate
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        updataTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}'
                ,due_date = '${dueDate}' WHERE id = ${todoId};`

        await db.run(updataTodoQuery)
        response.send(`Due Date Updated`)
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})

//API_6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
            DELETE FROM 
                todo
            WHERE
                id = ${todoId};`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
