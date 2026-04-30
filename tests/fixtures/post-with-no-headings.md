---
title: Quick Tip
description: A short tip about JavaScript destructuring.
slug: quick-tip-destructuring
tags:
  - javascript
  - tips
---

Did you know you can use default values with destructuring?

```js
const { name = 'Anonymous', age = 0 } = user;
```

This is useful when dealing with optional properties in objects.

It also works with arrays:

```js
const [first = 1, second = 2] = [];
```

Pretty neat, right?
