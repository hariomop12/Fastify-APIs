const redisClient = require('./config/redis')

async function getTodos() {
    try {
        const todos = await redisClient.lrange('todos', 0, -1);
        return todos;
    } catch (error) {
        console.error('Error getting todos:', error);
        throw error;
    }
}

async function addTodo(todo) {
    try {
        await redisClient.rpush('todos', todo);
    } catch (error) {
        console.error('Error adding todo:', error);
        throw error;
    }
}

async function getTodoById(id) {
  try {
    const todos = await getTodos();
    return todos.find(todo => todo.id === id) || null;
  } catch (error) {
    console.error('Error getting todo by id:', error);
    return null;
  }
}

module.exports = {
    getTodos,
    addTodo,
    getTodoById
}