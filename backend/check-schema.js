const fetch = require('node-fetch');

async function checkSchema() {
  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query IntrospectionQuery {
            __schema {
              types {
                name
                fields {
                  name
                  type {
                    name
                  }
                }
              }
            }
          }
        `
      })
    });

    const result = await response.json();
    
    // Find Event type
    const eventType = result.data.__schema.types.find(t => t.name === 'Event');
    
    console.log('🔍 Event Type Fields Available:');
    if (eventType && eventType.fields) {
      eventType.fields.forEach(field => {
        console.log(`  - ${field.name}: ${field.type.name}`);
      });
    } else {
      console.log('❌ Event type not found!');
    }
    
    console.log('\n📋 Full Event Type:', JSON.stringify(eventType, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchema(); 