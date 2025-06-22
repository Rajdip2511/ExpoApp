// Authentication Fix for GraphQL Context
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Static Token Mappings (matching frontend)
const STATIC_JWT_TOKENS = {
  'demo-token-123': { userId: 'demo-user-id', email: 'demo@example.com', name: 'Demo User' },
  'john-token-456': { userId: 'john-user-id', email: 'john@example.com', name: 'John Smith' },
  'jane-token-789': { userId: 'jane-user-id', email: 'jane@example.com', name: 'Jane Doe' },
  'alice-token-101': { userId: 'alice-user-id', email: 'alice@example.com', name: 'Alice Johnson' },
  'bob-token-202': { userId: 'bob-user-id', email: 'bob@example.com', name: 'Bob Wilson' },
};

// Fixed authentication middleware
async function getAuthenticatedUser(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    
    const token = authHeader.replace('Bearer ', '');
    
    // Check static tokens first
    if (STATIC_JWT_TOKENS[token]) {
      const tokenData = STATIC_JWT_TOKENS[token];
      
      // Fetch full user from database
      const user = await prisma.user.findUnique({
        where: { id: tokenData.userId },
        select: {
          id: true,
          name: true, 
          email: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      
      return user;
    }
    
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

module.exports = { getAuthenticatedUser, STATIC_JWT_TOKENS }; 