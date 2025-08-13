function validateInput(schema) {
  return (request, reply, done) => {
    try {
      const { body, params, query } = request;
      
      if (schema.body && body) {
        const result = schema.body.validate(body);
        if (result.error) {
          return reply.code(400).send({ 
            error: 'Validation Error', 
            message: result.error.message 
          });
        }
        request.body = result.value;
      }
      
      if (schema.params && params) {
        const result = schema.params.validate(params);
        if (result.error) {
          return reply.code(400).send({ 
            error: 'Validation Error', 
            message: result.error.message 
          });
        }
        request.params = result.value;
      }
      
      if (schema.query && query) {
        const result = schema.query.validate(query);
        if (result.error) {
          return reply.code(400).send({ 
            error: 'Validation Error', 
            message: result.error.message 
          });
        }
        request.query = result.value;
      }
      
      done();
    } catch (error) {
      reply.code(500).send({ error: 'Validation system error' });
    }
  };
}

module.exports = { validateInput };