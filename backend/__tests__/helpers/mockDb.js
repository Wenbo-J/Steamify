// Helper to create a mock database connection
module.exports.createMockConnection = () => {
  return {
    query: jest.fn(),
    connect: jest.fn((callback) => {
      if (callback) callback(null);
    }),
    end: jest.fn()
  };
};

