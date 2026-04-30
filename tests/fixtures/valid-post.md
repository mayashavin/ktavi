---
title: Using TanStack Query in Vue
description: Learn how to simplify data fetching and caching in Vue apps with TanStack Query.
slug: tanstack-query-vue
tags:
  - vue
  - tanstack-query
  - frontend
cover: /images/blog/tanstack-query-vue-cover.png
date: 2025-01-15
---

# Using TanStack Query in Vue

TanStack Query brings powerful data fetching, caching, and synchronization to Vue applications.

## Why TanStack Query?

Managing loading states, errors, caching, and refetching manually can become complex. TanStack Query abstracts all of this into a simple, declarative API.

## Getting Started

First, install the package:

```bash
npm install @tanstack/vue-query
```

Then set up the query client in your app:

```ts
import { VueQueryPlugin } from '@tanstack/vue-query';

app.use(VueQueryPlugin);
```

## Fetching Data

Use the `useQuery` composable to fetch data:

```ts
import { useQuery } from '@tanstack/vue-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
});
```

## Conclusion

TanStack Query simplifies data management in Vue apps significantly. Give it a try in your next project.

Check out the [official documentation](https://tanstack.com/query) for more details.

![TanStack Query diagram](./images/query-diagram.png "Query flow diagram")
