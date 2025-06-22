const fetch = require('node-fetch');

const testQuery = async (query, variables = {}) => {
  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    const result = await response.json();
    
    console.log('\n=== TESTING QUERY ===');
    console.log('Query:', query);
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    return { status: response.status, data: result };
  } catch (error) {
    console.error('Error:', error.message);
    return { error: error.message };
  }
};

async function runTests() {
  console.log('🧪 Testing GraphQL Endpoint Queries\n');

  // Test 1: Simple introspection
  await testQuery('query { __typename }');

  // Test 2: Schema introspection
  await testQuery(`
    query {
      __schema {
        queryType {
          name
        }
      }
    }
  `);

  // Test 3: Events query without description
  await testQuery(`
    query GetEvents {
      events {
        id
        name
        location
        startTime
        attendeeCount
      }
    }
  `);

  // Test 4: Events query with description (the one causing issues)
  await testQuery(`
    query GetEventsWithDescription {
      events {
        id
        name
        description
        location
        startTime
        endTime
        attendees {
          id
          name
          email
        }
      }
    }
  `);

  // Test 5: Health query if it exists
  await testQuery('query { health }');
}

runTests().catch(console.error); 