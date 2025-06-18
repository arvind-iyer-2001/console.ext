global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  
  global.fetch.mockImplementation(() => 
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    })
  );
});

afterEach(() => {
  if (global.console.restore) {
    global.console.restore();
  }
});