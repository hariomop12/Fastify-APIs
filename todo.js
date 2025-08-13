const redisClient = require('./config/redis');

async function getTodos(username) { 
  try {
    const todos = await redisClient.lrange(`todos:${username}`, 0, -1);
    return todos.map(JSON.parse);
  } catch (error) {
    console.error('Error getting todos:', error);
    return [];
  }
}

async function addTodo(todo) {
  try {
    await redisClient.rpush(`todos:${todo.username}`, JSON.stringify(todo));
    return todo;
  } catch (error) {
    console.error("Error adding todo:", error);
    throw error;
  }
}

async function getTodoById(id, username) {
  try {
    const todos = await getTodos(username);
    return todos.find((todo) => todo.id === id) || null;
  } catch (error) {
    console.error("Error getting todo by id:", error);
    return null;
  }
}


async function updateTodo(id, updates, username) {
  try {
    const todos = await getTodos(username);
    const todoIndex = todos.findIndex((todo) => todo.id === id);

    if (todoIndex === -1) return null;

    // Create updated todo
    const updatedTodo = { ...todos[todoIndex], ...updates };

    // Update in Redis by replacing the entire list
    await redisClient.lset(
      `todos:${username}`,
      todoIndex,
      JSON.stringify(updatedTodo)
    );

    return updatedTodo;
  } catch (error) {
    console.error("Error updating todo:", error);
    return null;
  }
}

async function deleteTodo(id, username) {
  try {
    const todos = await getTodos(username);
    const todoIndex = todos.findIndex((todo) => todo.id === id);

    if (todoIndex === -1) return false;

    const todoToDelete = todos[todoIndex];

    // Get all todos, filter out the one to delete, and save the new list
    const updatedTodos = todos.filter((todo) => todo.id !== id);

    // Delete the old list and create a new one
    await redisClient.del(`todos:${username}`);

    if (updatedTodos.length > 0) {
      await redisClient.rpush(
        `todos:${username}`,
        ...updatedTodos.map((todo) => JSON.stringify(todo))
      );
    }

    return true;
  } catch (error) {
    console.error("Error deleting todo:", error);
    return false;
  }
}

module.exports = {
  getTodos,
  addTodo,
  getTodoById,
  updateTodo,
  deleteTodo,
};