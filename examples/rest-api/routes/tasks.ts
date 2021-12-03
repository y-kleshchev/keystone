import type { Request, Response } from 'express';
import type { KeystoneContext } from '@keystone-6/core/types';

/*
  This example route handler gets all the tasks in the database and returns
  them as JSON data, emulating what you'd normally do in a REST API.

  More sophisticated API routes might accept query params to select fields,
  map more params to `where` arguments, add pagination support, etc.

  We're also demonstrating how you can query related data through the schema.
*/

export async function getTasks(
	request  : Request & { context: KeystoneContext },
	response : Response
) {
  // This was added by the context middleware in ../keystone.ts
  const { context, query } = request;
  // Let's map the `complete` query param to a where filter
  let isComplete;
  if (query.complete === 'true') {
    isComplete = { equals: true };
  } else if (query.complete === 'false') {
    isComplete = { equals: false };
  }
  // Now we can use it to query the Keystone Schema
  const tasks = await context.query.Task.findMany({
    where: {
      isComplete,
    },
    query: `
      id
      label
      priority
      isComplete
      assignedTo {
        id
        name
      }
    `,
  });
  // And return the result as JSON
  response.json(tasks);
}
