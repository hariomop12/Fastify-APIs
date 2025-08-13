const fastify = require("fastify")({ logger: true });
const { v4: uuidv4 } = require("uuid");
const swagger = require("@fastify/swagger");
const swaggerUi = require("@fastify/swagger-ui");

// Add before defining routes
fastify.register(swagger, {
  swagger: {
    info: {
      title: 'Fastify Todo API',
      description: 'Todo application API with authentication',
      version: '1.0.0'
    },
    host: 'localhost:3000',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
      { name: 'auth', description: 'Authentication endpoints' },
      { name: 'todos', description: 'Todo operations' }
    ]
  }
});

fastify.register(swaggerUi, {
  routePrefix: "/documentation",
  uiConfig: {
    docExpansion: "list",
    deepLinking: false,
  },
  staticCSP: true,
});

const {
  getTodos,
  addTodo,
  getTodoById,
  updateTodo,
  deleteTodo,
} = require("./todo");
const { registerUser, loginUser, authenticate } = require("./auth");

// Public routes
fastify.get("/", async (request, reply) => {
  return { message: "Hello Fastify!" };
});

// Auth routes
fastify.post(
  "/register",
  {
    schema: {
      body: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string", minLength: 3 },
          password: { type: "string", minLength: 6 },
        },
      },
    },
  },
  async (request, reply) => {
    try {
      const { username, password } = request.body;
      const user = await registerUser(username, password);
      return user;
    } catch (error) {
      reply.code(400).send({ error: error.message });
    }
  }
);

fastify.post(
  "/login",
  {
    schema: {
      body: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string" },
          password: { type: "string" },
        },
      },
    },
  },
  async (request, reply) => {
    try {
      const { username, password } = request.body;
      const result = await loginUser(username, password);
      return result;
    } catch (error) {
      reply.code(401).send({ error: error.message });
    }
  }
);

// Protected routes - todos
fastify.get("/todos", async (request, reply) => {
  if (await authenticate(request, reply)) {
    return getTodos(request.user.username);
  }
});

fastify.get("/todos/:id", async (request, reply) => {
  if (await authenticate(request, reply)) {
    const todo = await getTodoById(request.params.id, request.user.username);
    if (!todo) {
      reply.code(404).send({ error: "Todo not found" });
      return;
    }
    return todo;
  }
});

fastify.post(
  "/todos",
  {
    schema: {
      body: {
        type: "object",
        required: ["task"],
        properties: { task: { type: "string" } },
      },
    },
  },
  async (request, reply) => {
    if (await authenticate(request, reply)) {
      const todo = {
        id: uuidv4(),
        task: request.body.task,
        completed: false,
        createdAt: new Date(),
        username: request.user.username,
      };
      return addTodo(todo);
    }
  }
);

// New routes for update and delete
fastify.put(
  "/todos/:id",
  {
    schema: {
      body: {
        type: "object",
        properties: {
          task: { type: "string" },
          completed: { type: "boolean" },
        },
      },
    },
  },
  async (request, reply) => {
    if (await authenticate(request, reply)) {
      const updated = await updateTodo(
        request.params.id,
        request.body,
        request.user.username
      );

      if (!updated) {
        reply.code(404).send({ error: "Todo not found" });
        return;
      }
      return updated;
    }
  }
);

fastify.delete("/todos/:id", async (request, reply) => {
  if (await authenticate(request, reply)) {
    const deleted = await deleteTodo(request.params.id, request.user.username);
    if (!deleted) {
      reply.code(404).send({ error: "Todo not found" });
      return;
    }
    return { message: "Todo deleted successfully" };
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server running on http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
